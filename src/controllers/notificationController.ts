import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { AppError } from '../middlewares/errorHandler';

export class NotificationController {
  /**
   * Get all notifications for the current user
   * GET /api/notifications
   * @access Private
   */
  static async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const result = await NotificationService.getUserNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
        unreadOnly: unreadOnly === 'true',
      });

      res.status(200).json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit)),
          },
          unreadCount: result.unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   * @access Private
   */
  static async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   * @access Private
   */
  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = String(req.user!._id);

      const success = await NotificationService.markAsRead(id, userId);

      if (!success) {
        throw new AppError('Notification not found or already read', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/mark-all-read
   * @access Private
   */
  static async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const count = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `${count} notification(s) marked as read`,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   * @access Private
   */
  static async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = String(req.user!._id);

      const success = await NotificationService.deleteNotification(id, userId);

      if (!success) {
        throw new AppError('Notification not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all notifications
   * DELETE /api/notifications
   * @access Private
   */
  static async deleteAllNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const count = await NotificationService.deleteAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: `${count} notification(s) deleted`,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
}
