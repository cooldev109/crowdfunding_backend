import { Request, Response, NextFunction } from 'express';
import { Investment } from '../models/Investment';
import { Project } from '../models/Project';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';
import { EmailService } from '../services/emailService';
import { NotificationService } from '../services/notificationService';
import mongoose from 'mongoose';

export class InvestmentController {
  /**
   * Create a new investment
   * POST /api/investments
   * @access Private
   */
  static async createInvestment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const { projectId, amount, paymentMethod } = req.body;

      // Validate required fields
      if (!projectId || !amount || !paymentMethod) {
        throw new AppError(
          'Project ID, amount, and payment method are required',
          400
        );
      }

      // Get project
      const project = await Project.findById(projectId);
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check if project accepts investments
      if (project.status !== 'active') {
        throw new AppError(
          'This project is not accepting investments at the moment',
          400
        );
      }

      // Validate investment amount
      if (amount < project.minInvestment) {
        throw new AppError(
          `Minimum investment amount is $${project.minInvestment}`,
          400
        );
      }

      // Check if project is fully funded
      if (project.fundedAmount >= project.targetAmount) {
        throw new AppError('This project is fully funded', 400);
      }

      // Check if investment would exceed target
      if (project.fundedAmount + amount > project.targetAmount) {
        const remaining = project.targetAmount - project.fundedAmount;
        throw new AppError(
          `Investment amount exceeds remaining target. Maximum you can invest: $${remaining}`,
          400
        );
      }

      // Calculate expected return based on project ROI
      const expectedReturn = amount + (amount * project.roiPercent) / 100;

      // Calculate expected return date (project duration)
      let expectedReturnDate;
      if (project.durationMonths) {
        expectedReturnDate = new Date();
        expectedReturnDate.setMonth(
          expectedReturnDate.getMonth() + project.durationMonths
        );
      }

      // Create investment
      const investment = await Investment.create({
        userId,
        projectId,
        amount,
        paymentMethod,
        expectedReturn,
        expectedReturnDate,
        status: 'completed', // Simplified - in production, integrate with payment gateway
        investmentDate: new Date(),
      });

      // Update project funding
      project.fundedAmount += amount;
      project.totalInvestors = (project.totalInvestors || 0) + 1;

      // Check if project reached target
      if (project.fundedAmount >= project.targetAmount) {
        project.status = 'completed';
      }

      await project.save();

      // Create payment record
      await Payment.create({
        userId,
        amount,
        currency: 'USD',
        status: 'completed',
        method: paymentMethod,
        transactionId: `INV-${investment._id}`,
        description: `Investment in ${project.title}`,
      });

      logger.info(
        `Investment created: User ${userId} invested $${amount} in project ${projectId}`
      );

      // Send email and notification (async, don't wait)
      const user = await User.findById(userId);
      if (user) {
        // Send email confirmation
        EmailService.sendInvestmentConfirmation(user.email, {
          name: user.name,
          projectTitle: project.title,
          amount: investment.amount,
          expectedReturn: investment.expectedReturn,
          investmentDate: investment.investmentDate.toISOString(),
          investmentId: String(investment._id),
        }).catch(err => logger.error('Email send failed:', err));

        // Create in-app notification
        NotificationService.createNotification({
          userId,
          type: 'investment',
          title: 'Investment Confirmed',
          message: `Your investment of $${amount} in ${project.title} has been confirmed!`,
          link: `/my-investments`,
          metadata: {
            investmentId: String(investment._id),
            projectId: String(project._id),
            amount: investment.amount,
          },
        }).catch(err => logger.error('Notification create failed:', err));
      }

      res.status(201).json({
        success: true,
        message: 'Investment successful!',
        data: {
          investment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all investments by current user
   * GET /api/investments/my-investments
   * @access Private
   */
  static async getMyInvestments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const { status, page = 1, limit = 20 } = req.query;

      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [investments, total] = await Promise.all([
        Investment.find(query)
          .populate('projectId', 'title description imageUrl status category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Investment.countDocuments(query),
      ]);

      // Calculate totals
      const totalInvested = await Investment.getTotalInvestedByUser(userId);

      res.status(200).json({
        success: true,
        data: {
          investments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
          summary: {
            totalInvested,
            totalInvestments: total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investment by ID
   * GET /api/investments/:id
   * @access Private
   */
  static async getInvestmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = String(req.user!._id);
      const isAdmin = req.user!.role === 'admin';

      const investment = await Investment.findById(id).populate(
        'projectId',
        'title description imageUrl status category roiPercent durationMonths'
      );

      if (!investment) {
        throw new AppError('Investment not found', 404);
      }

      // Check if user owns this investment or is admin
      if (String(investment.userId) !== userId && !isAdmin) {
        throw new AppError(
          'You do not have permission to view this investment',
          403
        );
      }

      res.status(200).json({
        success: true,
        data: { investment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investments for a specific project
   * GET /api/investments/project/:projectId
   * @access Private (Admin only)
   */
  static async getProjectInvestments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const project = await Project.findById(projectId);
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [investments, total] = await Promise.all([
        Investment.find({ projectId, status: 'completed' })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Investment.countDocuments({ projectId, status: 'completed' }),
      ]);

      const stats = await Investment.getTotalInvestedInProject(projectId);

      res.status(200).json({
        success: true,
        data: {
          investments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
          stats: {
            totalInvested: stats.total,
            totalInvestors: stats.count,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investment statistics for current user
   * GET /api/investments/stats
   * @access Private
   */
  static async getInvestmentStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const userRole = req.user!.role;

      // If admin, return platform-wide stats, otherwise return user-specific stats
      const matchFilter = userRole === 'admin'
        ? {}
        : { userId: new mongoose.Types.ObjectId(userId) };

      const stats = await Investment.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalExpectedReturn: { $sum: '$expectedReturn' },
            totalActualReturn: { $sum: '$actualReturn' },
          },
        },
      ]);

      // Get total count
      const total = await Investment.countDocuments(matchFilter);

      // Get total amount
      const totalAmountResult = await Investment.aggregate([
        { $match: matchFilter },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]);
      const totalAmount = totalAmountResult[0]?.totalAmount || 0;

      // Calculate growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const totalLastMonth = await Investment.countDocuments({
        ...matchFilter,
        createdAt: { $lt: thirtyDaysAgo },
      });
      const growth = totalLastMonth > 0
        ? ((total - totalLastMonth) / totalLastMonth) * 100
        : 0;

      // Get active projects count
      const activeProjects = await Investment.distinct('projectId', {
        ...matchFilter,
        status: 'completed',
      });

      res.status(200).json({
        success: true,
        data: {
          total,
          totalAmount,
          growth: parseFloat(growth.toFixed(2)),
          stats,
          activeProjects: activeProjects.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all investments (admin only)
   * GET /api/investments
   * @access Admin only
   */
  static async getAllInvestments(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const investments = await Investment.find()
        .populate('userId', 'name email')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: {
          investments: investments.map((inv) => ({
            _id: inv._id,
            user: {
              _id: (inv.userId as any)._id,
              name: (inv.userId as any).name,
              email: (inv.userId as any).email,
            },
            project: {
              _id: (inv.projectId as any)._id,
              title: (inv.projectId as any).title,
            },
            amount: inv.amount,
            status: inv.status,
            transactionId: inv.transactionId,
            createdAt: inv.createdAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel/Refund investment (Admin only or within cancellation period)
   * POST /api/investments/:id/cancel
   * @access Private
   */
  static async cancelInvestment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = String(req.user!._id);
      const isAdmin = req.user!.role === 'admin';

      const investment = await Investment.findById(id);
      if (!investment) {
        throw new AppError('Investment not found', 404);
      }

      // Check permissions
      if (String(investment.userId) !== userId && !isAdmin) {
        throw new AppError(
          'You do not have permission to cancel this investment',
          403
        );
      }

      // Check if already cancelled
      if (investment.status === 'refunded') {
        throw new AppError('Investment is already refunded', 400);
      }

      // Check if investment can be cancelled (within 24 hours for non-admin)
      if (!isAdmin) {
        const hoursSinceInvestment =
          (Date.now() - investment.investmentDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceInvestment > 24) {
          throw new AppError(
            'Investments can only be cancelled within 24 hours',
            400
          );
        }
      }

      // Update investment status
      investment.status = 'refunded';
      investment.refundReason = reason || 'User requested refund';
      investment.refundDate = new Date();
      await investment.save();

      // Update project funding
      const project = await Project.findById(investment.projectId);
      if (project) {
        project.fundedAmount -= investment.amount;
        project.totalInvestors = Math.max((project.totalInvestors || 1) - 1, 0);
        if (project.status === 'completed') {
          project.status = 'active'; // Reopen if was completed
        }
        await project.save();
      }

      logger.info(`Investment ${id} refunded: ${reason}`);

      // Send email and notification (async, don't wait)
      const user = await User.findById(userId);
      if (user && project) {
        // Send email
        EmailService.sendInvestmentCancelledEmail(user.email, {
          name: user.name,
          projectTitle: project.title,
          amount: investment.amount,
          refundReason: investment.refundReason || 'Unknown',
          investmentId: String(investment._id),
        }).catch(err => logger.error('Email send failed:', err));

        // Create in-app notification
        NotificationService.createNotification({
          userId,
          type: 'investment',
          title: 'Investment Cancelled',
          message: `Your investment in ${project.title} has been cancelled. Refund initiated.`,
          link: `/my-investments`,
          metadata: {
            investmentId: String(investment._id),
            projectId: String(project._id),
            amount: investment.amount,
          },
        }).catch(err => logger.error('Notification create failed:', err));
      }

      res.status(200).json({
        success: true,
        message: 'Investment cancelled and refund initiated',
        data: { investment },
      });
    } catch (error) {
      next(error);
    }
  }
}
