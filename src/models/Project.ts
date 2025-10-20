import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  category: string;
  minInvestment: number;
  roiPercent: number;
  targetAmount: number;
  fundedAmount: number;
  totalInvestors: number;
  durationMonths: number;
  startDate?: Date;
  status: 'active' | 'completed' | 'closed';
  isPremium: boolean;
  imageUrl?: string;
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
    minInvestment: {
      type: Number,
      required: [true, 'Minimum investment is required'],
      min: [0, 'Minimum investment must be positive'],
    },
    roiPercent: {
      type: Number,
      required: [true, 'ROI percentage is required'],
      min: [0, 'ROI must be positive'],
      max: [1000, 'ROI cannot exceed 1000%'],
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
    durationMonths: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 month'],
      max: [240, 'Duration cannot exceed 240 months'],
    },
    startDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'closed'],
      default: 'active',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      trim: true,
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

// Virtual field for funding progress percentage
ProjectSchema.virtual('progressPercent').get(function () {
  return this.targetAmount > 0
    ? Math.min((this.fundedAmount / this.targetAmount) * 100, 100)
    : 0;
});

// Ensure virtuals are included in JSON output
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
