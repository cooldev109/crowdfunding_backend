import { z } from 'zod';

// Create project schema
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  category: z.string().min(1, 'Category is required').trim(),
  minInvestment: z
    .number()
    .positive('Minimum investment must be positive')
    .min(0, 'Minimum investment cannot be negative'),
  roiPercent: z
    .number()
    .positive('ROI must be positive')
    .min(0, 'ROI cannot be negative')
    .max(1000, 'ROI cannot exceed 1000%'),
  targetAmount: z
    .number()
    .positive('Target amount must be positive')
    .min(0, 'Target amount cannot be negative'),
  fundedAmount: z
    .number()
    .min(0, 'Funded amount cannot be negative')
    .optional()
    .default(0),
  durationMonths: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 month')
    .max(240, 'Duration cannot exceed 240 months'),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional().default('active'),
  imageUrl: z
    .string()
    .refine(
      (val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
      'Invalid image URL or base64 data'
    )
    .optional()
    .or(z.literal('')),
  documents: z
    .array(
      z.object({
        name: z.string().min(1, 'Document name is required'),
        data: z.string().min(1, 'Document data is required'),
        type: z.string().min(1, 'Document type is required'),
        size: z.number().positive('Document size must be positive'),
        title: z.string().optional(),
        subtitle: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

// Update project schema (all fields optional except what's being updated)
export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  category: z.string().min(1, 'Category is required').trim().optional(),
  location: z.string().trim().optional(),
  minInvestment: z
    .number()
    .min(0, 'Minimum investment must be positive')
    .optional(),
  roiPercent: z
    .number()
    .min(0, 'ROI must be positive')
    .max(1000, 'ROI cannot exceed 1000%')
    .optional(),
  roiMin: z.number().min(0).optional(),
  roiMax: z.number().min(0).optional(),
  targetAmount: z
    .number()
    .positive('Target amount must be positive')
    .optional(),
  fundedAmount: z.number().min(0, 'Funded amount cannot be negative').optional(),
  totalInvestors: z.number().min(0).optional(),
  totalUnits: z.number().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  durationMonths: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 month')
    .max(240, 'Duration cannot exceed 240 months')
    .optional(),
  investmentPeriodMin: z.number().min(1).optional(),
  investmentPeriodMax: z.number().min(1).optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  deadline: z.string().datetime().optional().or(z.date().optional()),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional(),
  isPremium: z.boolean().optional(),
  featured: z.boolean().optional(),
  imageUrl: z
    .string()
    .refine(
      (val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
      'Invalid image URL or base64 data'
    )
    .optional()
    .or(z.literal('')),
  galleryImages: z.array(z.string()).optional(),
  keyFeatures: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string().min(1, 'Document name is required'),
        data: z.string().min(1, 'Document data is required'),
        type: z.string().min(1, 'Document type is required'),
        size: z.number().positive('Document size must be positive'),
        title: z.string().optional(),
        subtitle: z.string().optional(),
      })
    )
    .optional(),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        date: z.string().datetime().or(z.date()),
        status: z.enum(['completed', 'in_progress', 'upcoming']).optional(),
      })
    )
    .optional(),
  // Auction-related fields
  code: z.string().optional(),
  city: z.string().optional(),
  auctionDate: z.string().datetime().optional().or(z.date().optional()),
  propertyType: z.string().optional(),
  judicialAppraisal: z.number().min(0).optional(),
  commercialValue: z.number().min(0).optional(),
  basePrice: z.number().min(0).optional(),
});

// Query/filter schema
export const projectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  category: z.string().optional(),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional(),
  minROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().optional(),
});

// Admin query schema - no pagination limit for getting all projects
export const adminProjectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('1000'),
  category: z.string().optional(),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional(),
  minROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().optional(),
});

// Premium projects query schema - higher default limit to show all premium projects
export const premiumProjectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('500'),
  category: z.string().optional(),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional(),
  minROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxROI: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().optional(),
});

// Advanced search schema
export const advancedSearchSchema = z.object({
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),

  // Basic filters (available to all plans)
  category: z.string().optional(),
  status: z.enum(['active', 'funded', 'completed', 'closed']).optional(),
  search: z.string().optional(),

  // Plus/Premium: Multiple categories
  categories: z.array(z.string()).optional(),

  // Basic+: ROI range filter
  minROI: z.number().min(0).max(1000).optional(),
  maxROI: z.number().min(0).max(1000).optional(),

  // Plus+: Amount range filter
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),

  // Plus+: Duration filter
  minDuration: z.number().int().min(1).optional(),
  maxDuration: z.number().int().min(1).optional(),

  // Premium: Advanced sorting
  sortBy: z
    .enum([
      'createdAt',
      'roiPercent',
      'targetAmount',
      'fundedAmount',
      'progress',
      'durationMonths',
    ])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type AdminProjectQuery = z.infer<typeof adminProjectQuerySchema>;
export type PremiumProjectQuery = z.infer<typeof premiumProjectQuerySchema>;
export type AdvancedSearchInput = z.infer<typeof advancedSearchSchema>;
