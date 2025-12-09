import mongoose, { Document, Schema, Types } from 'mongoose';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Payment method enum
export enum PaymentMethod {
  CARD = 'card',
  PSE = 'pse',
  BANCOLOMBIA = 'bancolombia',
  NEQUI = 'nequi',
  BANK_TRANSFER = 'bank_transfer',
}

// Payment gateway enum
export enum PaymentGateway {
  WOMPI = 'wompi',
  PAYU = 'payu',
}

export interface IPayment extends Document {
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  investmentId?: Types.ObjectId;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  gatewayReference?: string;
  metadata?: {
    wompiTransactionId?: string;
    paymentMethodType?: string;
    financialInstitutionCode?: string;
    lastWebhookEvent?: string;
    lastWebhookTimestamp?: number;
    statusMessage?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
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
    },
    investmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Investment',
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
      default: 'COP',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: Object.values(PaymentMethod),
      trim: true,
    },
    paymentGateway: {
      type: String,
      required: [true, 'Payment gateway is required'],
      enum: Object.values(PaymentGateway),
      default: PaymentGateway.WOMPI,
    },
    gatewayReference: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ investmentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentGateway: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ gatewayReference: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
