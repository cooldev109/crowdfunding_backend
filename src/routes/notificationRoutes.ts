import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get notifications
router.get('/', NotificationController.getNotifications);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

// Delete all notifications
router.delete('/', NotificationController.deleteAllNotifications);

export default router;
