import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export class UserController {
  /**
   * Get user statistics
   * GET /api/users/stats
   * @access Admin only
   */
  static async getUserStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get total users
      const total = await User.countDocuments();

      // Get users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalLastMonth = await User.countDocuments({
        createdAt: { $lt: thirtyDaysAgo },
      });

      // Calculate growth percentage
      const growth = totalLastMonth > 0
        ? ((total - totalLastMonth) / totalLastMonth) * 100
        : 0;

      // Get users by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get users by plan
      const usersByPlan = await User.aggregate([
        {
          $group: {
            _id: '$planKey',
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          growth: parseFloat(growth.toFixed(2)),
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
          byPlan: usersByPlan.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   * GET /api/users
   * @access Admin only
   */
  static async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * @access Admin only
   */
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   * @access Admin only
   */
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Prevent deleting admin users
      if (user.role === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Cannot delete admin users',
        });
        return;
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
