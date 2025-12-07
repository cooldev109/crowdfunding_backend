import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { IUser } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TempTokenPayload {
  userId: string;
  purpose: '2fa';
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare plain password with hashed password
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate refresh token (optional, for future use)
   */
  static generateRefreshToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '30d',
    } as jwt.SignOptions);
  }

  /**
   * Generate temporary token for 2FA verification
   * Short-lived token (5 minutes) used during 2FA login flow
   */
  static generateTempToken(user: IUser): string {
    const payload: TempTokenPayload = {
      userId: String(user._id),
      purpose: '2fa',
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '5m', // Short-lived for security
    } as jwt.SignOptions);
  }

  /**
   * Verify temporary token for 2FA
   */
  static verifyTempToken(token: string): TempTokenPayload {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as TempTokenPayload;

      if (decoded.purpose !== '2fa') {
        throw new Error('Invalid token purpose');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired temporary token');
    }
  }
}
