import { Notification, INotification } from '../models/Notification';
import { logger } from '../config/logger';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: {
    userId: string;
    type: 'investment' | 'subscription' | 'project' | 'system' | 'payment';
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }): Promise<INotification | null> {
    try {
      const notification = await Notification.create(data);
      logger.info(`Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error: any) {
      logger.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const query: any = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.updateOne(
        { _id: notificationId, userId, read: false },
        { read: true, readAt: new Date() }
      );

      return result.modifiedCount > 0;
    } catch (error: any) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );

      return result.modifiedCount;
    } catch (error: any) {
      logger.error('Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({ _id: notificationId, userId });
      return result.deletedCount > 0;
    } catch (error: any) {
      logger.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: string): Promise<number> {
    try {
      const result = await Notification.deleteMany({ userId });
      return result.deletedCount;
    } catch (error: any) {
      logger.error('Failed to delete all notifications:', error);
      return 0;
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ userId, read: false });
    } catch (error: any) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }
}
