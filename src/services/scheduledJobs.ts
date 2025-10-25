import cron from 'node-cron';
import { Project } from '../models/Project';
import { logger } from '../config/logger';

/**
 * Background job to mark expired projects as completed
 * Runs every hour to check if any projects have passed their end date
 */
export function startScheduledJobs() {
  // Run every hour at the start of the hour (0 minutes)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running scheduled job: Check for expired projects');

      const now = new Date();

      // Find all projects that are pending and have passed their end date
      const expiredProjects = await Project.find({
        status: 'pending',
        endDate: { $lte: now },
      });

      if (expiredProjects.length === 0) {
        logger.info('No expired projects found');
        return;
      }

      // Update all expired projects to completed
      const updatePromises = expiredProjects.map(async (project) => {
        project.status = 'completed';
        await project.save();
        logger.info(
          `Project ${project._id} (${project.title}) marked as completed - end date reached`
        );
      });

      await Promise.all(updatePromises);

      logger.info(
        `Successfully marked ${expiredProjects.length} project(s) as completed`
      );
    } catch (error: any) {
      logger.error({ err: error }, 'Error in scheduled job: Check for expired projects');
    }
  });

  logger.info('Scheduled jobs started successfully');
}
