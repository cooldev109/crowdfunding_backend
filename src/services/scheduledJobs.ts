import cron from 'node-cron';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { PayoutService } from './payoutService';
import { logger } from '../config/logger';

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs() {
  // Check for expired projects - Run every hour
  cron.schedule('0 * * * *', checkExpiredProjects);

  // Process pending payouts - Run every 6 hours
  cron.schedule('0 */6 * * *', processPendingPayouts);

  // Check expired subscriptions - Run daily at midnight
  cron.schedule('0 0 * * *', checkExpiredSubscriptions);

  // Retry failed payouts - Run daily at 3 AM
  cron.schedule('0 3 * * *', retryFailedPayouts);

  logger.info('Scheduled jobs started successfully');
}

/**
 * Check for expired projects and mark them as completed
 */
async function checkExpiredProjects() {
  try {
    logger.info('Running scheduled job: Check for expired projects');

    const now = new Date();

    // Find all projects that are funded and have passed their end date
    const expiredProjects = await Project.find({
      status: 'funded',
      endDate: { $lte: now },
    });

    if (expiredProjects.length === 0) {
      logger.info('No expired projects found');
      return;
    }

    // Update all expired projects to completed and schedule payouts
    for (const project of expiredProjects) {
      project.status = 'completed';
      await project.save();

      logger.info(
        `Project ${project._id} (${project.title}) marked as completed - end date reached`
      );

      // Schedule payouts for the completed project
      try {
        const payouts = await PayoutService.scheduleProjectPayouts(String(project._id));
        logger.info(
          `Scheduled ${payouts.length} payouts for project ${project._id}`
        );
      } catch (error: any) {
        logger.error(
          `Failed to schedule payouts for project ${project._id}: ${error.message}`
        );
      }
    }

    logger.info(
      `Successfully marked ${expiredProjects.length} project(s) as completed`
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Error in scheduled job: Check for expired projects');
  }
}

/**
 * Process pending payouts
 */
async function processPendingPayouts() {
  try {
    logger.info('Running scheduled job: Process pending payouts');

    const results = await PayoutService.processPendingPayouts();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(
      `Payout processing complete: ${successful} successful, ${failed} failed out of ${results.length} total`
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Error in scheduled job: Process pending payouts');
  }
}

/**
 * Check for expired subscriptions
 */
async function checkExpiredSubscriptions() {
  try {
    logger.info('Running scheduled job: Check expired subscriptions');

    const now = new Date();

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      renewalDate: { $lte: now },
    });

    if (expiredSubscriptions.length === 0) {
      logger.info('No expired subscriptions found');
      return;
    }

    for (const subscription of expiredSubscriptions) {
      // Update subscription status
      subscription.status = 'expired';
      await subscription.save();

      // Update user's plan status
      await User.findByIdAndUpdate(subscription.userId, {
        planStatus: 'expired',
        planKey: 'free',
      });

      logger.info(
        `Subscription ${subscription._id} for user ${subscription.userId} marked as expired`
      );
    }

    logger.info(
      `Successfully processed ${expiredSubscriptions.length} expired subscription(s)`
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Error in scheduled job: Check expired subscriptions');
  }
}

/**
 * Retry failed payouts
 */
async function retryFailedPayouts() {
  try {
    logger.info('Running scheduled job: Retry failed payouts');

    const results = await PayoutService.retryFailedPayouts();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(
      `Retry payouts complete: ${successful} successful, ${failed} failed out of ${results.length} total`
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Error in scheduled job: Retry failed payouts');
  }
}
