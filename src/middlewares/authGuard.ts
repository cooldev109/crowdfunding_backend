import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { User } from '../models/User';
import { AppError } from './errorHandler';
import { UserRole } from '../types';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    let token: string | undefined;

    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authenticated. Please login.', 401);
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found or token invalid', 401);
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
export const roleGuard = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new AppError(
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const adminGuard = roleGuard('admin');

/**
 * Middleware to check subscription plan
 */
export const planGuard = (...allowedPlans: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (
      !allowedPlans.includes(req.user.planKey) &&
      req.user.planStatus !== 'active'
    ) {
      throw new AppError(
        'Upgrade your subscription plan to access this resource',
        403
      );
    }

    next();
  };
};
