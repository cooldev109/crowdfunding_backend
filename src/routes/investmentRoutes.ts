import { Router } from 'express';
import { InvestmentController } from '../controllers/investmentController';
import { authGuard, adminGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   POST /api/investments
 * @desc    Create a new investment
 * @access  Private
 */
router.post('/', authGuard, InvestmentController.createInvestment);

/**
 * @route   GET /api/investments/my-investments
 * @desc    Get all investments by current user
 * @access  Private
 */
router.get(
  '/my-investments',
  authGuard,
  InvestmentController.getMyInvestments
);

/**
 * @route   GET /api/investments/stats
 * @desc    Get investment statistics for current user (or all if admin)
 * @access  Private
 */
router.get('/stats', authGuard, InvestmentController.getInvestmentStats);

/**
 * @route   GET /api/investments
 * @desc    Get all investments (admin only)
 * @access  Admin only
 */
router.get('/', authGuard, adminGuard, InvestmentController.getAllInvestments);

/**
 * @route   GET /api/investments/:id
 * @desc    Get investment by ID
 * @access  Private
 */
router.get('/:id', authGuard, InvestmentController.getInvestmentById);

/**
 * @route   POST /api/investments/:id/cancel
 * @desc    Cancel/Refund investment
 * @access  Private
 */
router.post('/:id/cancel', authGuard, InvestmentController.cancelInvestment);

/**
 * @route   GET /api/investments/project/:projectId
 * @desc    Get all investments for a specific project
 * @access  Private (Admin only)
 */
router.get(
  '/project/:projectId',
  authGuard,
  InvestmentController.getProjectInvestments
);

export default router;
