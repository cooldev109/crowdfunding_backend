import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export type PlanKey = 'free' | 'esencial' | 'pro' | 'prime';

export type IdentityVerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface IIdentityDocument {
  type: 'id_front' | 'id_back' | 'proof_of_address' | 'selfie';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  url?: string;
}

export interface IIdentityVerification {
  status: IdentityVerificationStatus;
  documents: IIdentityDocument[];
  documentType?: string; // CC, CE, passport, etc.
  documentNumber?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

// Bank account for receiving payouts
export interface IBankAccount {
  bankCode: string; // Código del banco (ej: "007" para Bancolombia)
  bankName: string;
  accountType: 'savings' | 'checking'; // Ahorros o Corriente
  accountNumber: string;
  accountHolderName: string;
  documentType: string; // CC, CE, NIT, etc.
  documentNumber: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: 'admin' | 'investor';
  planKey: PlanKey;
  planStatus: 'active' | 'expired' | 'cancelled';
  planRenewal?: Date;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isVerified: boolean;
  // Identity verification
  identityVerification: IIdentityVerification;
  // Bank account for payouts
  bankAccount?: IBankAccount;
  // Password reset
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // 2FA
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes?: string[];
  // Methods
  createPasswordResetToken(): string;
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
      enum: ['free', 'esencial', 'pro', 'prime'],
      default: 'free',
    },
    planStatus: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
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
    // Identity verification
    identityVerification: {
      status: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted',
      },
      documents: [{
        type: {
          type: String,
          enum: ['id_front', 'id_back', 'proof_of_address', 'selfie'],
        },
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedAt: Date,
        url: String,
      }],
      documentType: String,
      documentNumber: String,
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: String,
      rejectionReason: String,
      notes: String,
    },
    // Bank account for payouts
    bankAccount: {
      bankCode: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      accountType: {
        type: String,
        enum: ['savings', 'checking'],
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      accountHolderName: {
        type: String,
        trim: true,
      },
      documentType: {
        type: String,
        trim: true,
      },
      documentNumber: {
        type: String,
        trim: true,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
    },
    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // 2FA
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to create password reset token
UserSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return resetToken;
};

// Indexes
// Note: email index is created automatically by unique: true in schema
UserSchema.index({ role: 1 });
UserSchema.index({ planKey: 1 });
UserSchema.index({ passwordResetToken: 1 });
UserSchema.index({ 'identityVerification.status': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
