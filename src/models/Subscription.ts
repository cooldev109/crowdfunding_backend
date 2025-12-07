import mongoose, { Document, Schema, Types } from 'mongoose';

export type PlanKey = 'free' | 'esencial' | 'pro' | 'prime';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planKey: PlanKey;
  price: number;
  startDate: Date;
  renewalDate: Date;
  paymentGateway: 'stripe' | 'pagseguro' | 'wompi';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  lastInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    planKey: {
      type: String,
      enum: ['free', 'esencial', 'pro', 'prime'],
      required: [true, 'Plan key is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      required: [true, 'Renewal date is required'],
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'pagseguro', 'wompi'],
      required: [true, 'Payment gateway is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    lastInvoiceId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ renewalDate: 1 });

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);
