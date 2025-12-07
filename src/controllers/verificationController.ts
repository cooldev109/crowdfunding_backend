import { Request, Response, NextFunction } from 'express';
import { User, IIdentityDocument } from '../models/User';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/verification');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class VerificationController {
  /**
   * Get current user's verification status
   * GET /api/verification/status
   * @access Authenticated user
   */
  static async getVerificationStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await User.findById(userId).select('identityVerification isVerified');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          isVerified: user.isVerified,
          identityVerification: user.identityVerification || {
            status: 'not_submitted',
            documents: [],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload verification document
   * POST /api/verification/upload
   * @access Authenticated user
   */
  static async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const file = (req as any).file;
      const { documentType } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      if (!['id_front', 'id_back', 'proof_of_address', 'selfie'].includes(documentType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid document type',
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Generate unique filename
      const ext = path.extname(file.originalname);
      const filename = `${userId}_${documentType}_${crypto.randomBytes(8).toString('hex')}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Save file
      fs.writeFileSync(filepath, file.buffer);

      // Create document record
      const newDocument: IIdentityDocument = {
        type: documentType,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        url: `/uploads/verification/${filename}`,
      };

      // Initialize identityVerification if needed
      if (!user.identityVerification) {
        user.identityVerification = {
          status: 'not_submitted',
          documents: [],
        };
      }

      // Remove existing document of same type
      user.identityVerification.documents = user.identityVerification.documents.filter(
        (doc) => doc.type !== documentType
      );

      // Add new document
      user.identityVerification.documents.push(newDocument);

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          document: newDocument,
        },
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit verification for review
   * POST /api/verification/submit
   * @access Authenticated user
   */
  static async submitVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const { documentType, documentNumber } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!user.identityVerification || user.identityVerification.documents.length < 3) {
        res.status(400).json({
          success: false,
          message: 'Please upload all required documents (ID front, ID back, and proof of address)',
        });
        return;
      }

      // Check if already pending or approved
      if (user.identityVerification.status === 'pending') {
        res.status(400).json({
          success: false,
          message: 'Verification already submitted and pending review',
        });
        return;
      }

      if (user.identityVerification.status === 'approved') {
        res.status(400).json({
          success: false,
          message: 'Account is already verified',
        });
        return;
      }

      // Update verification status
      user.identityVerification.status = 'pending';
      user.identityVerification.documentType = documentType;
      user.identityVerification.documentNumber = documentNumber;
      user.identityVerification.submittedAt = new Date();
      user.identityVerification.rejectionReason = undefined;

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          status: user.identityVerification.status,
          submittedAt: user.identityVerification.submittedAt,
        },
        message: 'Verification submitted successfully. We will review your documents within 24-48 hours.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pending verifications (Admin)
   * GET /api/verification/admin/pending
   * @access Admin only
   */
  static async getPendingVerifications(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await User.find({
        'identityVerification.status': 'pending',
      }).select('name email phone identityVerification createdAt');

      res.status(200).json({
        success: true,
        data: {
          verifications: users.map((user) => ({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            identityVerification: user.identityVerification,
            createdAt: user.createdAt,
          })),
          count: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all verifications with filters (Admin)
   * GET /api/verification/admin/all
   * @access Admin only
   */
  static async getAllVerifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const filter: any = {};
      if (status && status !== 'all') {
        filter['identityVerification.status'] = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('name email phone identityVerification createdAt isVerified')
          .sort({ 'identityVerification.submittedAt': -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          verifications: users.map((user) => ({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            identityVerification: user.identityVerification || {
              status: 'not_submitted',
              documents: [],
            },
            createdAt: user.createdAt,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve user verification (Admin)
   * POST /api/verification/admin/:userId/approve
   * @access Admin only
   */
  static async approveVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = (req as any).user?._id;
      const { notes } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!user.identityVerification || user.identityVerification.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'No pending verification to approve',
        });
        return;
      }

      user.identityVerification.status = 'approved';
      user.identityVerification.reviewedAt = new Date();
      user.identityVerification.reviewedBy = adminId;
      user.identityVerification.notes = notes;
      user.isVerified = true;

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          userId: user._id,
          status: user.identityVerification.status,
          reviewedAt: user.identityVerification.reviewedAt,
        },
        message: 'Verification approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject user verification (Admin)
   * POST /api/verification/admin/:userId/reject
   * @access Admin only
   */
  static async rejectVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = (req as any).user?._id;
      const { reason, notes } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!user.identityVerification || user.identityVerification.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'No pending verification to reject',
        });
        return;
      }

      user.identityVerification.status = 'rejected';
      user.identityVerification.reviewedAt = new Date();
      user.identityVerification.reviewedBy = adminId;
      user.identityVerification.rejectionReason = reason;
      user.identityVerification.notes = notes;

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          userId: user._id,
          status: user.identityVerification.status,
          reviewedAt: user.identityVerification.reviewedAt,
          rejectionReason: reason,
        },
        message: 'Verification rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verification document file (Admin)
   * GET /api/verification/admin/document/:filename
   * @access Admin only
   */
  static async getDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { filename } = req.params;
      const filepath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(filepath)) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      res.sendFile(filepath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verification stats (Admin)
   * GET /api/verification/admin/stats
   * @access Admin only
   */
  static async getVerificationStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const statusCounts = await User.aggregate([
        {
          $group: {
            _id: '$identityVerification.status',
            count: { $sum: 1 },
          },
        },
      ]);

      const result: Record<string, number> = {
        not_submitted: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      statusCounts.forEach((item) => {
        if (item._id) {
          result[item._id] = item.count;
        } else {
          result.not_submitted += item.count;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          stats: result,
          total: Object.values(result).reduce((a, b) => a + b, 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
