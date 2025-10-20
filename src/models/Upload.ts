import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUpload extends Document {
  adminId: Types.ObjectId;
  fileName: string;
  importedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    importedCount: {
      type: Number,
      default: 0,
      min: [0, 'Imported count cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'partial', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
UploadSchema.index({ adminId: 1 });
UploadSchema.index({ status: 1 });
UploadSchema.index({ createdAt: -1 });

export const Upload = mongoose.model<IUpload>('Upload', UploadSchema);
