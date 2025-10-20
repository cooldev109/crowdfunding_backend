import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { logger } from '../config/logger';

export class AnalyticsController {
  /**
   * Get platform analytics summary
   */
  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await AnalyticsService.getPlatformSummary();

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Failed to get analytics summary', error);
      next(error);
    }
  }

  /**
   * Get user growth statistics
   */
  static async getUserGrowth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const growth = await AnalyticsService.getUserGrowth(days);

      res.status(200).json({
        success: true,
        data: growth,
      });
    } catch (error: any) {
      logger.error('Failed to get user growth', error);
      next(error);
    }
  }

  /**
   * Get investment trends
   */
  static async getInvestmentTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await AnalyticsService.getInvestmentTrends(days);

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      logger.error('Failed to get investment trends', error);
      next(error);
    }
  }

  /**
   * Get conversion funnel metrics
   */
  static async getConversionMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await AnalyticsService.getConversionMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Failed to get conversion metrics', error);
      next(error);
    }
  }
}
