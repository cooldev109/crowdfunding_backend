import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get notifications
router.get('/', NotificationController.getNotifications);

// Get unread count - specific route before dynamic routes
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark all as read - specific route before dynamic routes
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// Mark notification as read - dynamic route after specific routes
router.patch('/:id/read', NotificationController.markAsRead);

// Delete all notifications - specific route before dynamic routes
router.delete('/all', NotificationController.deleteAllNotifications);

// Delete notification - dynamic route after specific routes
router.delete('/:id', NotificationController.deleteNotification);

export default router;
