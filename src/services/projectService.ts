import { Project, IProject } from '../models/Project';
import { AppError } from '../middlewares/errorHandler';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  AdvancedSearchInput,
  advancedSearchSchema,
} from '../utils/projectValidation';
import { Types } from 'mongoose';
import { getPlanFeatures, hasFeatureAccess } from '../config/planFeatures';

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    data: CreateProjectInput,
    adminId: string
  ): Promise<IProject> {
    const project = await Project.create({
      ...data,
      createdBy: new Types.ObjectId(adminId),
    });

    return project;
  }

  /**
   * Get all projects with pagination and filters
   */
  static async getAllProjects(query: ProjectQuery) {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      minROI,
      maxROI,
      search,
    } = query;

    // Build filter object - exclude premium projects by default
    const filter: any = { isPremium: { $ne: true } };

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (minROI !== undefined || maxROI !== undefined) {
      filter.roiPercent = {};
      if (minROI !== undefined) {
        filter.roiPercent.$gte = minROI;
      }
      if (maxROI !== undefined) {
        filter.roiPercent.$lte = maxROI;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<IProject> {
    const project = await Project.findById(id).populate('createdBy', 'name email');

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  }

  /**
   * Update project by ID
   */
  static async updateProject(
    id: string,
    data: UpdateProjectInput,
    _adminId: string
  ): Promise<IProject> {
    const project = await Project.findById(id);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Update fields
    Object.assign(project, data);

    await project.save();

    return project;
  }

  /**
   * Delete project by ID
   */
  static async deleteProject(id: string, _adminId: string): Promise<void> {
    const project = await Project.findById(id);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await Project.findByIdAndDelete(id);
  }

  /**
   * Get project statistics
   */
  static async getProjectStats() {
    // Calculate growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalProjects, activeProjects, completedProjects, totalFunding, totalLastMonth] =
      await Promise.all([
        Project.countDocuments(),
        Project.countDocuments({ status: 'active' }),
        Project.countDocuments({ status: 'completed' }),
        Project.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$fundedAmount' },
            },
          },
        ]),
        Project.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
      ]);

    const growth = totalLastMonth > 0
      ? ((totalProjects - totalLastMonth) / totalLastMonth) * 100
      : 0;

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      totalFunding: totalFunding[0]?.total || 0,
      growth: parseFloat(growth.toFixed(2)),
    };
  }

  /**
   * Get categories
   */
  static async getCategories(): Promise<string[]> {
    const categories = await Project.distinct('category');
    return categories;
  }

  /**
   * Advanced search with plan-based restrictions
   */
  static async advancedSearch(searchInput: any, userPlan: string) {
    // Validate input
    const validatedInput: AdvancedSearchInput = advancedSearchSchema.parse(searchInput);

    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      categories,
      minROI,
      maxROI,
      minAmount,
      maxAmount,
      minDuration,
      maxDuration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = validatedInput;

    // Get user's plan features
    const planFeatures = getPlanFeatures(userPlan);

    // Build filter object based on plan restrictions
    // Premium database should only show premium projects
    const filter: any = { isPremium: true };

    // Basic filters (available to all plans)
    if (category && hasFeatureAccess(userPlan, 'basicFilters')) {
      filter.category = category;
    }

    if (status && hasFeatureAccess(userPlan, 'basicFilters')) {
      filter.status = status;
    }

    if (search && hasFeatureAccess(userPlan, 'basicFilters')) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Multiple categories (Plus/Premium only)
    if (categories && categories.length > 0) {
      if (!hasFeatureAccess(userPlan, 'multipleCategories')) {
        throw new AppError(
          'Multiple category selection requires Plus or Premium plan',
          403
        );
      }
      filter.category = { $in: categories };
    }

    // ROI range filter (Basic+)
    if (minROI !== undefined || maxROI !== undefined) {
      if (!hasFeatureAccess(userPlan, 'roiRange')) {
        throw new AppError('ROI range filter requires Basic plan or higher', 403);
      }
      filter.roiPercent = {};
      if (minROI !== undefined) {
        filter.roiPercent.$gte = minROI;
      }
      if (maxROI !== undefined) {
        filter.roiPercent.$lte = maxROI;
      }
    }

    // Amount range filter (Plus+)
    if (minAmount !== undefined || maxAmount !== undefined) {
      if (!hasFeatureAccess(userPlan, 'amountRange')) {
        throw new AppError('Amount range filter requires Plus plan or higher', 403);
      }
      filter.targetAmount = {};
      if (minAmount !== undefined) {
        filter.targetAmount.$gte = minAmount;
      }
      if (maxAmount !== undefined) {
        filter.targetAmount.$lte = maxAmount;
      }
    }

    // Duration filter (Plus+)
    if (minDuration !== undefined || maxDuration !== undefined) {
      if (!hasFeatureAccess(userPlan, 'durationFilter')) {
        throw new AppError('Duration filter requires Plus plan or higher', 403);
      }
      filter.durationMonths = {};
      if (minDuration !== undefined) {
        filter.durationMonths.$gte = minDuration;
      }
      if (maxDuration !== undefined) {
        filter.durationMonths.$lte = maxDuration;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sortObject: any = {};

    // Advanced sorting (Premium only)
    if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
      if (!hasFeatureAccess(userPlan, 'advancedSort')) {
        throw new AppError('Advanced sorting requires Premium plan', 403);
      }

      // Handle special case for 'progress' sorting
      if (sortBy === 'progress') {
        // We'll need to calculate this using aggregation
        // For now, fall back to default sorting
        sortObject = { createdAt: -1 };
      } else {
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }
    } else {
      sortObject = { createdAt: -1 };
    }

    // Execute query
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      planFeatures,
    };
  }

  /**
   * Get premium projects only
   */
  static async getPremiumProjects(query: ProjectQuery) {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      minROI,
      maxROI,
      search,
    } = query;

    // Build filter object - must be premium projects
    const filter: any = { isPremium: true };

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (minROI !== undefined || maxROI !== undefined) {
      filter.roiPercent = {};
      if (minROI !== undefined) {
        filter.roiPercent.$gte = minROI;
      }
      if (maxROI !== undefined) {
        filter.roiPercent.$lte = maxROI;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
