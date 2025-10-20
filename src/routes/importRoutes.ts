import { Router } from 'express';
import { ImportController } from '../controllers/importController';
import { authGuard, adminGuard } from '../middlewares/authGuard';
import { uploadExcel } from '../config/multer';

const router = Router();

/**
 * @route   POST /api/import/projects
 * @desc    Import projects from Excel file
 * @access  Admin only
 */
router.post(
  '/projects',
  authGuard,
  adminGuard,
  uploadExcel.single('file'),
  ImportController.importProjects
);

/**
 * @route   GET /api/import/template
 * @desc    Download Excel template for importing projects
 * @access  Admin only
 */
router.get('/template', authGuard, adminGuard, ImportController.downloadTemplate);

/**
 * @route   GET /api/import/history
 * @desc    Get import history
 * @access  Admin only
 */
router.get('/history', authGuard, adminGuard, ImportController.getImportHistory);

export default router;
