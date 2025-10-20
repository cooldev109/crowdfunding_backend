import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '../utils/projectValidation';
import { logger } from '../config/logger';

export class ProjectController {
  /**
   * Create a new project
   * POST /api/projects
   * @access Admin only
   */
  static async createProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = createProjectSchema.parse(req.body);

      const project = await ProjectService.createProject(
        validatedData,
        String(req.user!._id)
      );

      logger.info(`Project created: ${project.title} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all projects with pagination and filters
   * GET /api/projects
   * @access Public
   */
  static async getAllProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedQuery = projectQuerySchema.parse(req.query);

      const result = await ProjectService.getAllProjects(validatedQuery);

      res.status(200).json({
        success: true,
        data: {
          projects: result.projects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by ID
   * GET /api/projects/:id
   * @access Public
   */
  static async getProjectById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const project = await ProjectService.getProjectById(id);

      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update project by ID
   * PUT /api/projects/:id
   * @access Admin only
   */
  static async updateProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateProjectSchema.parse(req.body);

      const project = await ProjectService.updateProject(
        id,
        validatedData,
        String(req.user!._id)
      );

      logger.info(`Project updated: ${project.title} by ${req.user!.email}`);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete project by ID
   * DELETE /api/projects/:id
   * @access Admin only
   */
  static async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await ProjectService.deleteProject(id, String(req.user!._id));

      logger.info(`Project deleted: ${id} by ${req.user!.email}`);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project statistics
   * GET /api/projects/stats
   * @access Admin only
   */
  static async getProjectStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await ProjectService.getProjectStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories
   * GET /api/projects/categories
   * @access Public
   */
  static async getCategories(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await ProjectService.getCategories();

      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Advanced search with plan-based restrictions
   * POST /api/projects/search
   * @access Authenticated users (plan restrictions apply)
   */
  static async advancedSearch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userPlan = req.user?.planKey || 'free';

      const result = await ProjectService.advancedSearch(req.body, userPlan);

      res.status(200).json({
        success: true,
        data: {
          projects: result.projects,
          pagination: result.pagination,
          planFeatures: result.planFeatures,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get premium projects
   * GET /api/projects/premium
   * @access Authenticated users with premium/pro plan
   */
  static async getPremiumProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userPlan = req.user?.planKey || 'free';

      // Check if user has premium plan
      if (userPlan !== 'premium') {
        res.status(403).json({
          success: false,
          message: 'Premium plan required to access premium projects',
        });
        return;
      }

      const validatedQuery = projectQuerySchema.parse(req.query);

      const result = await ProjectService.getPremiumProjects(validatedQuery);

      res.status(200).json({
        success: true,
        data: {
          projects: result.projects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
