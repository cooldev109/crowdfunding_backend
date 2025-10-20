import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'investment' | 'subscription' | 'project' | 'system' | 'payment';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: {
    investmentId?: string;
    projectId?: string;
    subscriptionId?: string;
    amount?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['investment', 'subscription', 'project', 'system', 'payment'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // Auto-delete after 90 days

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
