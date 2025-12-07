import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authGuard } from '../middlewares/authGuard';
import {
  authLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authGuard, AuthController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authGuard, AuthController.getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', passwordResetLimiter, AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post('/change-password', authGuard, AuthController.changePassword);

// ============================================
// 2FA Routes
// ============================================

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Initialize 2FA setup (generate secret and QR code)
 * @access  Private
 */
router.post('/2fa/setup', authGuard, AuthController.setup2FA);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable 2FA after verifying token
 * @access  Private
 */
router.post('/2fa/enable', authGuard, AuthController.enable2FA);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', authGuard, AuthController.disable2FA);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify 2FA during login
 * @access  Public (with temp token)
 */
router.post('/2fa/verify', authLimiter, AuthController.verify2FA);

/**
 * @route   GET /api/auth/2fa/status
 * @desc    Get 2FA status
 * @access  Private
 */
router.get('/2fa/status', authGuard, AuthController.get2FAStatus);

/**
 * @route   POST /api/auth/2fa/backup-codes
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post('/2fa/backup-codes', authGuard, AuthController.regenerateBackupCodes);

export default router;
