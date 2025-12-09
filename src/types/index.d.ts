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
export type PlanKey = 'free' | 'esencial' | 'pro' | 'prime';
export type PlanStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type ProjectStatus = 'active' | 'funded' | 'completed' | 'closed';
export type PaymentGateway = 'wompi' | 'pagseguro';
export type InvestmentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutType = 'principal' | 'roi' | 'dividend';
