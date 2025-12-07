import { Router } from 'express';
import multer from 'multer';
import { VerificationController } from '../controllers/verificationController';
import { authGuard, adminGuard } from '../middlewares/authGuard';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  },
});

// ===== User Routes =====

/**
 * @route   GET /api/verification/status
 * @desc    Get current user's verification status
 * @access  Authenticated user
 */
router.get('/status', authGuard, VerificationController.getVerificationStatus);

/**
 * @route   POST /api/verification/upload
 * @desc    Upload a verification document
 * @access  Authenticated user
 */
router.post(
  '/upload',
  authGuard,
  upload.single('document'),
  VerificationController.uploadDocument
);

/**
 * @route   POST /api/verification/submit
 * @desc    Submit verification for review
 * @access  Authenticated user
 */
router.post('/submit', authGuard, VerificationController.submitVerification);

// ===== Admin Routes =====

/**
 * @route   GET /api/verification/admin/stats
 * @desc    Get verification statistics
 * @access  Admin only
 */
router.get('/admin/stats', authGuard, adminGuard, VerificationController.getVerificationStats);

/**
 * @route   GET /api/verification/admin/pending
 * @desc    Get all pending verifications
 * @access  Admin only
 */
router.get('/admin/pending', authGuard, adminGuard, VerificationController.getPendingVerifications);

/**
 * @route   GET /api/verification/admin/all
 * @desc    Get all verifications with filters
 * @access  Admin only
 */
router.get('/admin/all', authGuard, adminGuard, VerificationController.getAllVerifications);

/**
 * @route   GET /api/verification/admin/document/:filename
 * @desc    Get a verification document file
 * @access  Admin only
 */
router.get('/admin/document/:filename', authGuard, adminGuard, VerificationController.getDocument);

/**
 * @route   POST /api/verification/admin/:userId/approve
 * @desc    Approve a user's verification
 * @access  Admin only
 */
router.post('/admin/:userId/approve', authGuard, adminGuard, VerificationController.approveVerification);

/**
 * @route   POST /api/verification/admin/:userId/reject
 * @desc    Reject a user's verification
 * @access  Admin only
 */
router.post('/admin/:userId/reject', authGuard, adminGuard, VerificationController.rejectVerification);

export default router;
