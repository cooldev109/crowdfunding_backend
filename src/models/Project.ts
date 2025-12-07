import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  category: string;
  location?: string;
  minInvestment: number;
  // ROI range (roiPercent kept for backward compatibility)
  roiPercent: number;
  roiMin?: number;
  roiMax?: number;
  // Target and funding
  targetAmount: number;
  fundedAmount: number;
  totalInvestors: number;
  // Units
  totalUnits: number;
  unitPrice?: number;
  // Investment period range (durationMonths kept for backward compatibility)
  durationMonths: number;
  investmentPeriodMin?: number;
  investmentPeriodMax?: number;
  // Dates
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  // Status and flags
  status: 'active' | 'funded' | 'completed' | 'closed';
  isPremium: boolean;
  featured: boolean;
  // Media
  imageUrl: string;
  galleryImages?: string[];
  // Key features for display
  keyFeatures?: Array<{
    title: string;
    description: string;
  }>;
  // Documents
  documents?: Array<{
    name: string;
    data: string;
    type: string;
    size: number;
    title?: string;
    subtitle?: string;
  }>;
  // Timeline/Milestones
  milestones?: Array<{
    title: string;
    description: string;
    date: Date;
    status: 'completed' | 'in_progress' | 'upcoming';
  }>;
  // Auction-related fields for premium properties
  code?: string;
  city?: string;
  auctionDate?: Date;
  propertyType?: string;
  judicialAppraisal?: number;
  commercialValue?: number;
  basePrice?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Global',
    },
    minInvestment: {
      type: Number,
      required: [true, 'Minimum investment is required'],
      min: [0, 'Minimum investment must be positive'],
    },
    // ROI range (roiPercent kept for backward compatibility)
    roiPercent: {
      type: Number,
      required: [true, 'ROI percentage is required'],
      min: [0, 'ROI must be positive'],
      max: [1000, 'ROI cannot exceed 1000%'],
    },
    roiMin: {
      type: Number,
      min: [0, 'Minimum ROI must be positive'],
    },
    roiMax: {
      type: Number,
      min: [0, 'Maximum ROI must be positive'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0, 'Target amount must be positive'],
    },
    fundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Funded amount cannot be negative'],
    },
    totalInvestors: {
      type: Number,
      default: 0,
      min: [0, 'Total investors cannot be negative'],
    },
    // Units
    totalUnits: {
      type: Number,
      default: 100,
      min: [1, 'Total units must be at least 1'],
    },
    unitPrice: {
      type: Number,
      min: [0, 'Unit price must be positive'],
    },
    // Investment period range (durationMonths kept for backward compatibility)
    durationMonths: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 month'],
      max: [240, 'Duration cannot exceed 240 months'],
    },
    investmentPeriodMin: {
      type: Number,
      min: [1, 'Minimum investment period must be at least 1 month'],
    },
    investmentPeriodMax: {
      type: Number,
      min: [1, 'Maximum investment period must be at least 1 month'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'funded', 'completed', 'closed'],
      default: 'active',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      required: [true, 'Project image is required'],
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    keyFeatures: {
      type: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
      }],
      default: [],
    },
    documents: {
      type: [{
        name: { type: String, required: true },
        data: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
        title: { type: String },
        subtitle: { type: String },
      }],
      default: [],
    },
    milestones: {
      type: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['completed', 'in_progress', 'upcoming'], default: 'upcoming' },
      }],
      default: [],
    },
    // Auction-related fields for premium properties
    code: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    auctionDate: {
      type: Date,
    },
    propertyType: {
      type: String,
      trim: true,
    },
    judicialAppraisal: {
      type: Number,
      min: [0, 'Judicial appraisal must be positive'],
    },
    commercialValue: {
      type: Number,
      min: [0, 'Commercial value must be positive'],
    },
    basePrice: {
      type: Number,
      min: [0, 'Base price must be positive'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ roiPercent: -1 });
ProjectSchema.index({ isPremium: 1 });
ProjectSchema.index({ featured: 1 });
ProjectSchema.index({ deadline: 1 });

// Virtual fields
ProjectSchema.virtual('progressPercent').get(function () {
  return this.targetAmount > 0
    ? Math.min((this.fundedAmount / this.targetAmount) * 100, 100)
    : 0;
});

// Admin dashboard compatibility virtuals
ProjectSchema.virtual('projectName').get(function () {
  return this.title;
});

ProjectSchema.virtual('fundingGoal').get(function () {
  return this.targetAmount;
});

ProjectSchema.virtual('moneyRaised').get(function () {
  return this.fundedAmount;
});

ProjectSchema.virtual('investorsCount').get(function () {
  return this.totalInvestors;
});

// Calculate available units
ProjectSchema.virtual('unitsAvailable').get(function () {
  const totalUnits = this.totalUnits || 100;
  const unitPrice = this.unitPrice || Math.floor(this.targetAmount / totalUnits);
  const soldUnits = Math.floor(this.fundedAmount / unitPrice);
  return Math.max(0, totalUnits - soldUnits);
});

// Ensure virtuals are included in JSON output
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
