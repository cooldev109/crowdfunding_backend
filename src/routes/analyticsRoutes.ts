import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// All analytics routes require admin authentication
router.get('/summary', authGuard, AnalyticsController.getSummary);
router.get('/user-growth', authGuard, AnalyticsController.getUserGrowth);
router.get('/investment-trends', authGuard, AnalyticsController.getInvestmentTrends);
router.get('/conversion-metrics', authGuard, AnalyticsController.getConversionMetrics);

export default router;
