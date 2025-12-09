import mongoose from 'mongoose';
import { Payout, IPayout } from '../models/Payout';
import { Investment } from '../models/Investment';
import { Project } from '../models/Project';
import { User, IUser } from '../models/User';
import { logger } from '../config/logger';
import { EmailService } from './emailService';
import { wompiService } from './wompiService';

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  transactionId?: string;
  error?: string;
}

interface SchedulePayoutOptions {
  investmentId: string;
  userId: string;
  projectId: string;
  amount: number;
  type: 'roi' | 'principal' | 'partial' | 'bonus';
  paymentMethod: 'bank_transfer' | 'wompi';
  scheduledDate: Date;
  metadata?: Record<string, any>;
}

export class PayoutService {
  /**
   * Schedule a payout for an investment
   */
  static async schedulePayout(options: SchedulePayoutOptions): Promise<IPayout> {
    const payout = await Payout.create({
      investmentId: options.investmentId,
      userId: options.userId,
      projectId: options.projectId,
      amount: options.amount,
      type: options.type,
      paymentMethod: options.paymentMethod,
      scheduledDate: options.scheduledDate,
      status: 'pending',
      metadata: options.metadata,
    });

    logger.info(`Payout scheduled: ${payout._id} for user ${options.userId}`);
    return payout;
  }

  /**
   * Schedule ROI payouts for all investments in a completed project
   */
  static async scheduleProjectPayouts(projectId: string): Promise<IPayout[]> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== 'completed') {
      throw new Error('Project must be completed to schedule payouts');
    }

    // Get all completed investments for this project
    const investments = await Investment.find({
      projectId,
      status: 'completed',
    }).populate('userId', 'name email');

    const payouts: IPayout[] = [];
    const scheduledDate = new Date();

    for (const investment of investments) {
      // Calculate ROI amount
      const roiAmount = investment.expectedReturn - investment.amount;

      // Schedule principal return
      const principalPayout = await this.schedulePayout({
        investmentId: String(investment._id),
        userId: String(investment.userId),
        projectId,
        amount: investment.amount,
        type: 'principal',
        paymentMethod: investment.paymentMethod as 'bank_transfer' | 'wompi',
        scheduledDate,
        metadata: {
          projectTitle: project.title,
          investmentAmount: investment.amount,
        },
      });
      payouts.push(principalPayout);

      // Schedule ROI payout
      if (roiAmount > 0) {
        const roiPayout = await this.schedulePayout({
          investmentId: String(investment._id),
          userId: String(investment.userId),
          projectId,
          amount: roiAmount,
          type: 'roi',
          paymentMethod: investment.paymentMethod as 'bank_transfer' | 'wompi',
          scheduledDate,
          metadata: {
            projectTitle: project.title,
            roiPercent: project.roiPercent,
          },
        });
        payouts.push(roiPayout);
      }

      // Update investment with actual return info
      investment.actualReturn = investment.expectedReturn;
      investment.actualReturnDate = scheduledDate;
      await investment.save();
    }

    logger.info(`Scheduled ${payouts.length} payouts for project ${projectId}`);
    return payouts;
  }

  /**
   * Process pending payouts
   */
  static async processPendingPayouts(): Promise<PayoutResult[]> {
    const results: PayoutResult[] = [];

    // Get payouts that are due
    const pendingPayouts = await Payout.find({
      status: 'pending',
      scheduledDate: { $lte: new Date() },
      retryCount: { $lt: 3 }, // Max 3 retries
    })
      .populate('userId', 'name email')
      .populate('projectId', 'title')
      .limit(100); // Process in batches

    for (const payout of pendingPayouts) {
      const result = await this.processSinglePayout(payout);
      results.push(result);
    }

    return results;
  }

  /**
   * Process a single payout
   */
  static async processSinglePayout(payout: IPayout): Promise<PayoutResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Mark as processing
      payout.status = 'processing';
      await payout.save({ session });

      // Get user details
      const user = await User.findById(payout.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Process payment based on method
      let transactionId: string;

      switch (payout.paymentMethod) {
        case 'wompi':
          transactionId = await this.processWompiPayout(payout, user);
          break;
        case 'bank_transfer':
          transactionId = await this.processBankTransferPayout(payout, user);
          break;
        default:
          throw new Error(`Unsupported payment method: ${payout.paymentMethod}`);
      }

      // Mark as completed
      payout.status = 'completed';
      payout.transactionId = transactionId;
      payout.processedDate = new Date();
      await payout.save({ session });

      await session.commitTransaction();

      // Send notification email
      await this.sendPayoutNotification(payout, user);

      logger.info(`Payout processed successfully: ${payout._id}`);

      return {
        success: true,
        payoutId: String(payout._id),
        transactionId,
      };
    } catch (error: any) {
      await session.abortTransaction();

      // Update payout with failure info
      payout.status = 'failed';
      payout.failureReason = error.message;
      payout.retryCount += 1;

      // Reset to pending if we haven't exceeded retry limit
      if (payout.retryCount < 3) {
        payout.status = 'pending';
      }

      await payout.save();

      logger.error(`Payout failed: ${payout._id}`, error);

      return {
        success: false,
        payoutId: String(payout._id),
        error: error.message,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Process Wompi payout - REAL IMPLEMENTATION
   */
  private static async processWompiPayout(
    payout: IPayout,
    user: IUser
  ): Promise<string> {
    // Verify user has bank account configured
    if (!user.bankAccount || !user.bankAccount.accountNumber) {
      throw new Error('User does not have a bank account configured for payouts. Please add your bank account in your profile settings.');
    }

    const bankAccount = user.bankAccount;

    // Validate bank account is verified (optional - can be enforced or not)
    if (!bankAccount.isVerified) {
      logger.warn(`Processing payout to unverified bank account for user ${user._id}`);
    }

    // Generate unique reference for this payout
    const reference = `PAYOUT-${payout._id}-${Date.now()}`;

    // Get project info for description
    const project = await Project.findById(payout.projectId);
    const payoutTypeText = payout.type === 'roi' ? 'Rendimiento' :
                           payout.type === 'principal' ? 'Capital' :
                           payout.type === 'partial' ? 'Distribución parcial' : 'Bono';

    const description = `${payoutTypeText} - ${project?.title || 'Inversión'} - Ref: ${reference}`;

    try {
      // Call Wompi disbursement API
      const disbursement = await wompiService.createDisbursement({
        amount: payout.amount,
        reference,
        bankCode: bankAccount.bankCode,
        accountType: bankAccount.accountType,
        accountNumber: bankAccount.accountNumber,
        accountHolderName: bankAccount.accountHolderName,
        documentType: bankAccount.documentType,
        documentNumber: bankAccount.documentNumber,
        description,
      });

      logger.info({
        disbursementId: disbursement.id,
        status: disbursement.status,
        amount: payout.amount,
        userId: user._id,
        reference,
      }, 'Wompi payout disbursement created successfully');

      // Return the Wompi disbursement ID as the transaction ID
      return disbursement.id;
    } catch (error: any) {
      logger.error({
        err: error,
        userId: user._id,
        payoutId: payout._id,
        amount: payout.amount,
      }, 'Failed to process Wompi payout');

      throw new Error(`Wompi disbursement failed: ${error.message}`);
    }
  }

  /**
   * Process bank transfer payout
   */
  private static async processBankTransferPayout(
    payout: IPayout,
    _user: any
  ): Promise<string> {
    // Manual bank transfer - generate reference for manual processing
    const transactionId = `bank_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    logger.info(`Bank transfer payout queued: ${transactionId} for ${payout.amount}`);

    // This would typically create a record for manual processing
    // or integrate with a banking API

    return transactionId;
  }

  /**
   * Send payout notification email
   */
  private static async sendPayoutNotification(
    payout: IPayout,
    user: any
  ): Promise<void> {
    try {
      const project = await Project.findById(payout.projectId);
      const payoutTypeText = payout.type === 'roi' ? 'ROI Return' : 'Principal Return';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payout Processed!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Great news! Your ${payoutTypeText} has been processed successfully.</p>
              <div class="amount">$${payout.amount.toLocaleString()}</div>
              <div class="details">
                <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
                <p><strong>Type:</strong> ${payoutTypeText}</p>
                <p><strong>Transaction ID:</strong> ${payout.transactionId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p>The funds should be available in your account within 1-3 business days.</p>
            </div>
            <div class="footer">
              <p>Thank you for investing with InvestFlow!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await EmailService.sendEmail(
        user.email,
        `Payout Processed - $${payout.amount.toLocaleString()}`,
        html
      );
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to send payout notification email');
    }
  }

  /**
   * Get payouts for a user
   */
  static async getUserPayouts(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .populate('projectId', 'title')
        .populate('investmentId', 'amount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payout.countDocuments(query),
    ]);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payout statistics for admin dashboard
   */
  static async getPayoutStats() {
    const stats = await Payout.getPayoutStatistics();

    // Get recent payouts
    const recentPayouts = await Payout.find()
      .populate('userId', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get payouts by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyPayouts = await Payout.aggregate([
      {
        $match: {
          status: 'completed',
          processedDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$processedDate' },
            month: { $month: '$processedDate' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      ...stats,
      recentPayouts,
      monthlyPayouts,
    };
  }

  /**
   * Retry failed payouts
   */
  static async retryFailedPayouts(): Promise<PayoutResult[]> {
    const results: PayoutResult[] = [];

    const failedPayouts = await Payout.find({
      status: 'failed',
      retryCount: { $lt: 3 },
    }).limit(50);

    for (const payout of failedPayouts) {
      // Reset status to pending for retry
      payout.status = 'pending';
      await payout.save();

      const result = await this.processSinglePayout(payout);
      results.push(result);
    }

    return results;
  }

  /**
   * Calculate and schedule periodic ROI distributions
   * (for projects with monthly/quarterly distributions)
   */
  static async schedulePeriodicDistributions(
    projectId: string,
    frequency: 'monthly' | 'quarterly'
  ): Promise<IPayout[]> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const investments = await Investment.find({
      projectId,
      status: 'completed',
    });

    const payouts: IPayout[] = [];
    const periodsPerYear = frequency === 'monthly' ? 12 : 4;
    const periodicRoi = project.roiPercent / periodsPerYear / 100;

    const nextDistributionDate = new Date();
    if (frequency === 'monthly') {
      nextDistributionDate.setMonth(nextDistributionDate.getMonth() + 1);
    } else {
      nextDistributionDate.setMonth(nextDistributionDate.getMonth() + 3);
    }

    for (const investment of investments) {
      const periodicAmount = investment.amount * periodicRoi;

      const payout = await this.schedulePayout({
        investmentId: String(investment._id),
        userId: String(investment.userId),
        projectId,
        amount: periodicAmount,
        type: 'partial',
        paymentMethod: investment.paymentMethod as 'bank_transfer' | 'wompi',
        scheduledDate: nextDistributionDate,
        metadata: {
          projectTitle: project.title,
          frequency,
          period: new Date().toISOString(),
        },
      });

      payouts.push(payout);
    }

    logger.info(
      `Scheduled ${payouts.length} periodic distributions for project ${projectId}`
    );
    return payouts;
  }
}
