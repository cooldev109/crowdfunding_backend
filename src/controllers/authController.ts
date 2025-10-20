import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
import { AppError } from '../middlewares/errorHandler';
import { registerSchema, loginSchema } from '../utils/validation';
import { logger } from '../config/logger';

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
        isVerified: false,
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

      // Find user by email (include password field)
      const user = await User.findOne({ email: validatedData.email }).select(
        '+passwordHash'
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
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            planKey: user.planKey,
            planStatus: user.planStatus,
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
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
