import { Request, Response, NextFunction } from 'express';
import { PayoutService } from '../services/payoutService';
import { Payout } from '../models/Payout';
import { Project } from '../models/Project';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';

export class PayoutController {
  /**
   * Get user's payouts
   * GET /api/payouts/user/:userId
   */
  static async getUserPayouts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { page, limit, status } = req.query;

      // Verify user is requesting their own payouts or is admin
      const currentUser = req.user as { _id: any; role: string } | undefined;
      if (currentUser?._id?.toString() !== userId && currentUser?.role !== 'admin') {
        throw new AppError('Not authorized to view these payouts', 403);
      }

      const result = await PayoutService.getUserPayouts(userId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payout by ID
   * GET /api/payouts/:id
   */
  static async getPayoutById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const payout = await Payout.findById(id)
        .populate('userId', 'name email')
        .populate('projectId', 'title')
        .populate('investmentId', 'amount expectedReturn');

      if (!payout) {
        throw new AppError('Payout not found', 404);
      }

      // Verify user owns this payout or is admin
      const currentUser = req.user as { _id: any; role: string } | undefined;
      if (
        currentUser?._id?.toString() !== payout.userId.toString() &&
        currentUser?.role !== 'admin'
      ) {
        throw new AppError('Not authorized to view this payout', 403);
      }

      res.status(200).json({
        success: true,
        data: payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule payouts for a completed project (Admin only)
   * POST /api/payouts/schedule/:projectId
   */
  static async scheduleProjectPayouts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.status !== 'completed') {
        throw new AppError(
          'Project must be marked as completed before scheduling payouts',
          400
        );
      }

      const payouts = await PayoutService.scheduleProjectPayouts(projectId);

      logger.info(
        `Admin ${req.user.email} scheduled ${payouts.length} payouts for project ${projectId}`
      );

      res.status(201).json({
        success: true,
        message: `${payouts.length} payouts scheduled successfully`,
        data: {
          payoutsCount: payouts.length,
          projectId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process pending payouts (Admin only - typically called by cron)
   * POST /api/payouts/process
   */
  static async processPendingPayouts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const results = await PayoutService.processPendingPayouts();

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      logger.info(`Processed payouts: ${successful} successful, ${failed} failed`);

      res.status(200).json({
        success: true,
        message: `Processed ${results.length} payouts`,
        data: {
          total: results.length,
          successful,
          failed,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed payouts (Admin only)
   * POST /api/payouts/retry
   */
  static async retryFailedPayouts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const results = await PayoutService.retryFailedPayouts();

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      logger.info(`Retried payouts: ${successful} successful, ${failed} failed`);

      res.status(200).json({
        success: true,
        message: `Retried ${results.length} payouts`,
        data: {
          total: results.length,
          successful,
          failed,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payout statistics (Admin only)
   * GET /api/payouts/stats
   */
  static async getPayoutStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const stats = await PayoutService.getPayoutStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending payouts for a project (Admin only)
   * GET /api/payouts/project/:projectId/pending
   */
  static async getPendingPayoutsForProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const { projectId } = req.params;

      const payouts = await Payout.getPendingPayoutsForProject(projectId);

      res.status(200).json({
        success: true,
        data: payouts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule periodic distributions (Admin only)
   * POST /api/payouts/schedule-periodic/:projectId
   */
  static async schedulePeriodicDistributions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      const { projectId } = req.params;
      const { frequency } = req.body;

      if (!['monthly', 'quarterly'].includes(frequency)) {
        throw new AppError('Frequency must be monthly or quarterly', 400);
      }

      const payouts = await PayoutService.schedulePeriodicDistributions(
        projectId,
        frequency
      );

      logger.info(
        `Admin ${req.user.email} scheduled ${payouts.length} periodic distributions for project ${projectId}`
      );

      res.status(201).json({
        success: true,
        message: `${payouts.length} periodic distributions scheduled`,
        data: {
          payoutsCount: payouts.length,
          projectId,
          frequency,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's total earnings
   * GET /api/payouts/user/:userId/total
   */
  static async getUserTotalEarnings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      // Verify user is requesting their own data or is admin
      const currentUser = req.user as { _id: any; role: string } | undefined;
      if (currentUser?._id?.toString() !== userId && currentUser?.role !== 'admin') {
        throw new AppError('Not authorized', 403);
      }

      const totalEarnings = await Payout.getTotalPayoutsByUser(userId);

      // Get breakdown by type
      const breakdown = await Payout.aggregate([
        {
          $match: {
            userId: new (require('mongoose').Types.ObjectId)(userId),
            status: 'completed',
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalEarnings,
          breakdown: breakdown.map((b) => ({
            type: b._id,
            total: b.total,
            count: b.count,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
