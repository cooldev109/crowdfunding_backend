import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription ID is required'],
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      default: 'BRL',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
