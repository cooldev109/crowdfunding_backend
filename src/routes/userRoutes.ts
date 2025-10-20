import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authGuard, adminGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Admin only
 */
router.get('/stats', authGuard, adminGuard, UserController.getUserStats);

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
