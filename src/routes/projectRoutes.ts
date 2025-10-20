import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authGuard, adminGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   GET /api/projects/categories
 * @desc    Get all project categories
 * @access  Public
 */
router.get('/categories', ProjectController.getCategories);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Admin only
 */
router.get('/stats', authGuard, adminGuard, ProjectController.getProjectStats);

/**
 * @route   POST /api/projects/search
 * @desc    Advanced search with plan-based restrictions
 * @access  Authenticated users (plan restrictions apply)
 */
router.post('/search', authGuard, ProjectController.advancedSearch);

/**
 * @route   GET /api/projects/premium
 * @desc    Get all premium projects (requires premium/pro plan)
 * @access  Authenticated users with premium/pro plan
 */
router.get('/premium', authGuard, ProjectController.getPremiumProjects);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination and filters
 * @access  Public
 */
router.get('/', ProjectController.getAllProjects);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Admin only
 */
router.post('/', authGuard, adminGuard, ProjectController.createProject);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Public
 */
router.get('/:id', ProjectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project by ID
 * @access  Admin only
 */
router.put('/:id', authGuard, adminGuard, ProjectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project by ID
 * @access  Admin only
 */
router.delete('/:id', authGuard, adminGuard, ProjectController.deleteProject);

export default router;
