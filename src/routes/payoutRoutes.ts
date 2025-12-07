import { Router } from 'express';
import { PayoutController } from '../controllers/payoutController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   GET /api/payouts/stats
 * @desc    Get payout statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', authGuard, PayoutController.getPayoutStats);

/**
 * @route   GET /api/payouts/user/:userId
 * @desc    Get user's payouts
 * @access  Private
 */
router.get('/user/:userId', authGuard, PayoutController.getUserPayouts);

/**
 * @route   GET /api/payouts/user/:userId/total
 * @desc    Get user's total earnings
 * @access  Private
 */
router.get('/user/:userId/total', authGuard, PayoutController.getUserTotalEarnings);

/**
 * @route   GET /api/payouts/project/:projectId/pending
 * @desc    Get pending payouts for a project (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/project/:projectId/pending',
  authGuard,
  PayoutController.getPendingPayoutsForProject
);

/**
 * @route   GET /api/payouts/:id
 * @desc    Get payout by ID
 * @access  Private
 */
router.get('/:id', authGuard, PayoutController.getPayoutById);

/**
 * @route   POST /api/payouts/schedule/:projectId
 * @desc    Schedule payouts for a completed project (Admin only)
 * @access  Private (Admin)
 */
router.post('/schedule/:projectId', authGuard, PayoutController.scheduleProjectPayouts);

/**
 * @route   POST /api/payouts/schedule-periodic/:projectId
 * @desc    Schedule periodic distributions (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/schedule-periodic/:projectId',
  authGuard,
  PayoutController.schedulePeriodicDistributions
);

/**
 * @route   POST /api/payouts/process
 * @desc    Process pending payouts (Admin only)
 * @access  Private (Admin)
 */
router.post('/process', authGuard, PayoutController.processPendingPayouts);

/**
 * @route   POST /api/payouts/retry
 * @desc    Retry failed payouts (Admin only)
 * @access  Private (Admin)
 */
router.post('/retry', authGuard, PayoutController.retryFailedPayouts);

export default router;
