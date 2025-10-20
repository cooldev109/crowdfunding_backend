import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  amount: number;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'wallet';
  investmentDate: Date;
  expectedReturn: number;
  expectedReturnDate?: Date;
  actualReturn?: number;
  actualReturnDate?: Date;
  notes?: string;
  refundReason?: string;
  refundDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvestmentModel extends Model<IInvestment> {
  getTotalInvestedByUser(userId: string): Promise<number>;
  getTotalInvestedInProject(projectId: string): Promise<{
    total: number;
    count: number;
  }>;
}

const investmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [0, 'Investment amount must be positive'],
    },
    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'wallet'],
      required: [true, 'Payment method is required'],
    },
    investmentDate: {
      type: Date,
      default: Date.now,
    },
    expectedReturn: {
      type: Number,
      required: [true, 'Expected return is required'],
      min: [0, 'Expected return must be positive'],
    },
    expectedReturnDate: {
      type: Date,
    },
    actualReturn: {
      type: Number,
      min: [0, 'Actual return must be positive'],
    },
    actualReturnDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    refundReason: {
      type: String,
      maxlength: [500, 'Refund reason cannot exceed 500 characters'],
    },
    refundDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
investmentSchema.index({ userId: 1, createdAt: -1 });
investmentSchema.index({ projectId: 1, status: 1 });
investmentSchema.index({ status: 1, investmentDate: -1 });

// Virtual for ROI percentage
investmentSchema.virtual('roiPercentage').get(function () {
  if (this.actualReturn) {
    return ((this.actualReturn - this.amount) / this.amount) * 100;
  }
  return ((this.expectedReturn - this.amount) / this.amount) * 100;
});

// Static method to get total invested by user
investmentSchema.statics.getTotalInvestedByUser = async function (
  userId: string
) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);
  return result[0]?.total || 0;
};

// Static method to get total invested in project
investmentSchema.statics.getTotalInvestedInProject = async function (
  projectId: string
) {
  const result = await this.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0,
  };
};

export const Investment = mongoose.model<IInvestment, IInvestmentModel>(
  'Investment',
  investmentSchema
);
