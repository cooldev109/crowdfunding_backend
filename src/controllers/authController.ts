import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
import { TwoFactorService } from '../services/twoFactorService';
import { AppError } from '../middlewares/errorHandler';
import { registerSchema, loginSchema } from '../utils/validation';
import { logger } from '../config/logger';
import { EmailService } from '../services/emailService';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(
        validatedData.password
      );

      // Create new user
      const user = await User.create({
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        phone: validatedData.phone,
        role: validatedData.role || 'investor',
        planKey: 'free',
        planStatus: 'active',
        isVerified: true, // Auto-verify since email verification is disabled
      });

      // Generate JWT token
      const token = AuthService.generateToken(user);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`New user registered: ${user.email}`);

      // Send welcome email (non-blocking)
      EmailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
        logger.error(`Failed to send welcome email: ${err.message}`);
      });

      // Return user data (without password)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            planKey: user.planKey,
            planStatus: user.planStatus,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Find user by email (include password field and 2FA secret)
      const user = await User.findOne({ email: validatedData.email }).select(
        '+passwordHash +twoFactorSecret'
      );

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Compare passwords
      const isPasswordValid = await AuthService.comparePassword(
        validatedData.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate a temporary token for 2FA verification
        const tempToken = AuthService.generateTempToken(user);

        res.status(200).json({
          success: true,
          message: '2FA verification required',
          data: {
            requires2FA: true,
            tempToken,
          },
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = AuthService.generateToken(user);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          requires2FA: false,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            planKey: user.planKey,
            planStatus: user.planStatus,
            isVerified: user.isVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Clear cookie
      res.clearCookie('token');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      // Fetch fresh user data
      const user = await User.findById(req.user._id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            planKey: user.planKey,
            planStatus: user.planStatus,
            planRenewal: user.planRenewal,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isVerified: user.isVerified,
            twoFactorEnabled: user.twoFactorEnabled,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      // Always return success to prevent email enumeration
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent',
        });
        return;
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Send email
      try {
        await EmailService.sendPasswordResetEmail(user.email, user.name, resetToken);
        logger.info(`Password reset email sent to: ${user.email}`);
      } catch (error) {
        // Reset the token if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new AppError('Failed to send password reset email. Please try again later.', 500);
      }

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password/:token
   */
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Hash the token to compare with database
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password
      user.passwordHash = await AuthService.hashPassword(password);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (authenticated user)
   * POST /api/auth/change-password
   */
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
      }

      // Get user with password
      const user = await User.findById(req.user._id).select('+passwordHash');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await AuthService.comparePassword(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Update password
      user.passwordHash = await AuthService.hashPassword(newPassword);
      await user.save();

      logger.info(`Password changed for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup 2FA - Generate secret and QR code
   * POST /api/auth/2fa/setup
   */
  static async setup2FA(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      // Select +twoFactorSecret to ensure Mongoose properly tracks changes to this field
      const user = await User.findById(req.user._id).select('+twoFactorSecret');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.twoFactorEnabled) {
        throw new AppError('2FA is already enabled', 400);
      }

      // Generate new secret
      const { secret, otpauthUrl } = TwoFactorService.generateSecret(user.email);

      // Generate QR code
      const qrCode = await TwoFactorService.generateQRCode(otpauthUrl);

      // Store secret temporarily (not enabled yet)
      user.twoFactorSecret = secret;
      await user.save();

      logger.info(`2FA setup initiated for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: '2FA setup initiated',
        data: {
          qrCode,
          secret, // For manual entry in authenticator app
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable 2FA - Verify token and activate 2FA
   * POST /api/auth/2fa/enable
   */
  static async enable2FA(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { token } = req.body;

      if (!token) {
        throw new AppError('Verification code is required', 400);
      }

      const user = await User.findById(req.user._id).select('+twoFactorSecret');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.twoFactorEnabled) {
        throw new AppError('2FA is already enabled', 400);
      }

      if (!user.twoFactorSecret) {
        throw new AppError('Please setup 2FA first', 400);
      }

      // Verify the token
      const isValid = TwoFactorService.verifyToken(token, user.twoFactorSecret);

      if (!isValid) {
        throw new AppError('Invalid verification code', 400);
      }

      // Generate backup codes
      const backupCodes = TwoFactorService.generateBackupCodes();
      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes);

      // Enable 2FA
      user.twoFactorEnabled = true;
      user.twoFactorBackupCodes = hashedBackupCodes;
      await user.save();

      logger.info(`2FA enabled for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes, // Show backup codes only once
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   * POST /api/auth/2fa/disable
   */
  static async disable2FA(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { password, token } = req.body;

      if (!password) {
        throw new AppError('Password is required', 400);
      }

      const user = await User.findById(req.user._id).select(
        '+passwordHash +twoFactorSecret'
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled', 400);
      }

      // Verify password
      const isPasswordValid = await AuthService.comparePassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid password', 401);
      }

      // Verify 2FA token if provided
      if (token && user.twoFactorSecret) {
        const isValid = TwoFactorService.verifyToken(token, user.twoFactorSecret);
        if (!isValid) {
          throw new AppError('Invalid verification code', 400);
        }
      }

      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = undefined;
      await user.save();

      logger.info(`2FA disabled for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify 2FA during login
   * POST /api/auth/2fa/verify
   */
  static async verify2FA(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tempToken, token, backupCode } = req.body;

      if (!tempToken) {
        throw new AppError('Temporary token is required', 400);
      }

      if (!token && !backupCode) {
        throw new AppError('Verification code or backup code is required', 400);
      }

      // Verify temp token and get user ID
      const decoded = AuthService.verifyTempToken(tempToken);

      const user = await User.findById(decoded.userId).select(
        '+twoFactorSecret +twoFactorBackupCodes'
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled for this account', 400);
      }

      let isValid = false;

      if (token) {
        // Verify TOTP token
        if (!user.twoFactorSecret) {
          throw new AppError('2FA configuration error', 500);
        }
        isValid = TwoFactorService.verifyToken(token, user.twoFactorSecret);
      } else if (backupCode) {
        // Verify backup code
        if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
          throw new AppError('No backup codes available', 400);
        }

        const codeIndex = TwoFactorService.verifyBackupCode(
          backupCode,
          user.twoFactorBackupCodes
        );

        if (codeIndex !== -1) {
          isValid = true;
          // Remove used backup code
          user.twoFactorBackupCodes.splice(codeIndex, 1);
          await user.save();
        }
      }

      if (!isValid) {
        throw new AppError('Invalid verification code', 401);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate full JWT token
      const fullToken = AuthService.generateToken(user);

      // Set HTTP-only cookie
      res.cookie('token', fullToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User logged in with 2FA: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            planKey: user.planKey,
            planStatus: user.planStatus,
            isVerified: user.isVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          },
          token: fullToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get 2FA status
   * GET /api/auth/2fa/status
   */
  static async get2FAStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          enabled: user.twoFactorEnabled,
          backupCodesRemaining: user.twoFactorBackupCodes?.length || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate backup codes
   * POST /api/auth/2fa/backup-codes
   */
  static async regenerateBackupCodes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { password } = req.body;

      if (!password) {
        throw new AppError('Password is required', 400);
      }

      const user = await User.findById(req.user._id).select('+passwordHash');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled', 400);
      }

      // Verify password
      const isPasswordValid = await AuthService.comparePassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid password', 401);
      }

      // Generate new backup codes
      const backupCodes = TwoFactorService.generateBackupCodes();
      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes);

      user.twoFactorBackupCodes = hashedBackupCodes;
      await user.save();

      logger.info(`Backup codes regenerated for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Backup codes regenerated',
        data: {
          backupCodes,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
