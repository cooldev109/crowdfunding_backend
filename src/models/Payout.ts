import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayout extends Document {
  investmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  amount: number;
  type: 'roi' | 'principal' | 'partial' | 'bonus';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'wompi';
  transactionId?: string;
  paymentReference?: string;
  scheduledDate: Date;
  processedDate?: Date;
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutModel extends Model<IPayout> {
  getTotalPayoutsByUser(userId: string): Promise<number>;
  getPendingPayoutsForProject(projectId: string): Promise<IPayout[]>;
  getPayoutStatistics(): Promise<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    count: number;
  }>;
}

const payoutSchema = new Schema<IPayout>(
  {
    investmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Investment ID is required'],
      index: true,
    },
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
      required: [true, 'Payout amount is required'],
      min: [0, 'Payout amount must be positive'],
    },
    type: {
      type: String,
      enum: ['roi', 'principal', 'partial', 'bonus'],
      required: [true, 'Payout type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'wompi'],
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },
    paymentReference: {
      type: String,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    processedDate: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutSchema.index({ userId: 1, status: 1 });
payoutSchema.index({ projectId: 1, status: 1 });
payoutSchema.index({ scheduledDate: 1, status: 1 });
payoutSchema.index({ status: 1, scheduledDate: 1 });

// Static method to get total payouts by user
payoutSchema.statics.getTotalPayoutsByUser = async function (userId: string) {
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

// Static method to get pending payouts for project
payoutSchema.statics.getPendingPayoutsForProject = async function (
  projectId: string
) {
  return this.find({
    projectId: new mongoose.Types.ObjectId(projectId),
    status: { $in: ['pending', 'processing'] },
  })
    .populate('userId', 'name email')
    .populate('investmentId', 'amount expectedReturn')
    .sort({ scheduledDate: 1 });
};

// Static method to get payout statistics
payoutSchema.statics.getPayoutStatistics = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0,
    count: 0,
  };

  result.forEach((item: { _id: string; total: number; count: number }) => {
    stats.count += item.count;
    if (item._id === 'completed') {
      stats.totalPaid = item.total;
    } else if (item._id === 'pending' || item._id === 'processing') {
      stats.totalPending += item.total;
    } else if (item._id === 'failed') {
      stats.totalFailed = item.total;
    }
  });

  return stats;
};

export const Payout = mongoose.model<IPayout, IPayoutModel>(
  'Payout',
  payoutSchema
);
