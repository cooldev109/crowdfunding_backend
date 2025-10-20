import { User } from '../models/User';
import { Project } from '../models/Project';
import { Investment } from '../models/Investment';
import { Subscription } from '../models/Subscription';
import { logger } from '../config/logger';

export class AnalyticsService {
  /**
   * Get comprehensive platform analytics summary
   */
  static async getPlatformSummary() {
    try {
      // User statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isEmailVerified: true });
      const usersByPlan = await User.aggregate([
        {
          $group: {
            _id: '$planKey',
            count: { $sum: 1 },
          },
        },
      ]);

      // Subscription revenue statistics
      const subscriptions = await Subscription.find({ status: 'active' });
      const monthlyRecurringRevenue = subscriptions.reduce((sum: number, sub: any) => {
        if (sub.billingCycle === 'monthly') {
          return sum + sub.amount;
        } else if (sub.billingCycle === 'yearly') {
          return sum + sub.amount / 12; // Convert yearly to monthly
        }
        return sum;
      }, 0);

      const totalRevenue = await Subscription.aggregate([
        {
          $match: { status: { $in: ['active', 'canceled'] } },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Project statistics
      const totalProjects = await Project.countDocuments();
      const activeProjects = await Project.countDocuments({ status: 'active' });
      const completedProjects = await Project.countDocuments({ status: 'completed' });

      const projectsByCategory = await Project.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const projectFundingStats = await Project.aggregate([
        {
          $group: {
            _id: null,
            totalTarget: { $sum: '$targetAmount' },
            totalFunded: { $sum: '$fundedAmount' },
            avgROI: { $avg: '$roiPercent' },
          },
        },
      ]);

      // Investment statistics
      const totalInvestments = await Investment.countDocuments();
      const investmentStats = await Investment.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            avgInvestment: { $avg: '$amount' },
          },
        },
      ]);

      const recentInvestments = await Investment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('projectId', 'title category');

      // Revenue by month (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const revenueByMonth = await Subscription.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // New users by month (last 12 months)
      const usersByMonth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Investments by month (last 12 months)
      const investmentsByMonth = await Investment.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Top performing projects
      const topProjects = await Project.find({ status: { $in: ['active', 'completed'] } })
        .sort({ fundedAmount: -1 })
        .limit(5)
        .select('title category fundedAmount targetAmount roiPercent status');

      logger.info('Analytics summary generated successfully');

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          byPlan: usersByPlan,
          growthByMonth: usersByMonth,
        },
        revenue: {
          monthlyRecurring: monthlyRecurringRevenue,
          total: totalRevenue[0]?.total || 0,
          byMonth: revenueByMonth,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          byCategory: projectsByCategory,
          fundingStats: projectFundingStats[0] || {
            totalTarget: 0,
            totalFunded: 0,
            avgROI: 0,
          },
          topPerforming: topProjects,
        },
        investments: {
          total: totalInvestments,
          totalAmount: investmentStats[0]?.totalAmount || 0,
          avgAmount: investmentStats[0]?.avgInvestment || 0,
          recent: recentInvestments,
          byMonth: investmentsByMonth,
        },
      };
    } catch (error: any) {
      logger.error('Failed to generate analytics summary', error);
      throw error;
    }
  }

  /**
   * Get user growth statistics
   */
  static async getUserGrowth(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const growth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return growth;
    } catch (error: any) {
      logger.error('Failed to get user growth', error);
      throw error;
    }
  }

  /**
   * Get investment trends
   */
  static async getInvestmentTrends(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await Investment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return trends;
    } catch (error: any) {
      logger.error('Failed to get investment trends', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel metrics
   */
  static async getConversionMetrics() {
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      const paidUsers = await User.countDocuments({ planKey: { $ne: 'free' } });
      const investedUsers = await Investment.distinct('userId');

      return {
        totalUsers,
        verifiedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        paidUsers,
        conversionRate: verifiedUsers > 0 ? (paidUsers / verifiedUsers) * 100 : 0,
        investedUsers: investedUsers.length,
        investmentRate: totalUsers > 0 ? (investedUsers.length / totalUsers) * 100 : 0,
      };
    } catch (error: any) {
      logger.error('Failed to get conversion metrics', error);
      throw error;
    }
  }
}
