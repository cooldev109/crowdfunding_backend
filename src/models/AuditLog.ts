import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetType: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
