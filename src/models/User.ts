import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: 'admin' | 'investor';
  planKey: 'free' | 'basic' | 'plus' | 'premium';
  planStatus: 'active' | 'expired' | 'trial';
  planRenewal?: Date;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isVerified: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'investor'],
      default: 'investor',
    },
    planKey: {
      type: String,
      enum: ['free', 'basic', 'plus', 'premium'],
      default: 'free',
    },
    planStatus: {
      type: String,
      enum: ['active', 'expired', 'trial'],
      default: 'active',
    },
    planRenewal: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ planKey: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
