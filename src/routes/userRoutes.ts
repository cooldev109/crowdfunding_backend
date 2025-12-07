import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authGuard, adminGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Authenticated user
 */
router.put('/profile', authGuard, UserController.updateProfile);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Admin only
 */
router.get('/stats', authGuard, adminGuard, UserController.getUserStats);

// ============================================
// BANK ACCOUNT ROUTES FOR PAYOUTS
// ============================================

/**
 * @route   GET /api/users/banks
 * @desc    Get list of Colombian banks
 * @access  Public
 */
router.get('/banks', UserController.getBanks);

/**
 * @route   GET /api/users/bank-account
 * @desc    Get current user's bank account
 * @access  Authenticated user
 */
router.get('/bank-account', authGuard, UserController.getBankAccount);

/**
 * @route   POST /api/users/bank-account
 * @desc    Add or update bank account for payouts
 * @access  Authenticated user
 */
router.post('/bank-account', authGuard, UserController.updateBankAccount);

/**
 * @route   DELETE /api/users/bank-account
 * @desc    Delete bank account
 * @access  Authenticated user
 */
router.delete('/bank-account', authGuard, UserController.deleteBankAccount);

/**
 * @route   PUT /api/users/:id/verify-bank-account
 * @desc    Verify a user's bank account (admin only)
 * @access  Admin only
 */
router.put('/:id/verify-bank-account', authGuard, adminGuard, UserController.verifyBankAccount);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Admin only
 */
router.get('/', authGuard, adminGuard, UserController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Admin only
 */
router.get('/:id', authGuard, adminGuard, UserController.getUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Admin only
 */
router.delete('/:id', authGuard, adminGuard, UserController.deleteUser);

export default router;
