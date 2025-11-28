import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRole = 'admin' | 'investor';
export type PlanKey = 'free' | 'premium';
export type PlanStatus = 'active' | 'expired' | 'cancelled';
export type ProjectStatus = 'active' | 'completed' | 'closed';
export type PaymentGateway = 'stripe' | 'pagseguro';
