import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISimulation extends Document {
  userId: Types.ObjectId;
  investment: number;
  roiPercent: number;
  months: number;
  expectedReturn: number;
  createdAt: Date;
}

const SimulationSchema = new Schema<ISimulation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    investment: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [0, 'Investment must be positive'],
    },
    roiPercent: {
      type: Number,
      required: [true, 'ROI percentage is required'],
      min: [0, 'ROI must be positive'],
    },
    months: {
      type: Number,
      required: [true, 'Duration in months is required'],
      min: [1, 'Duration must be at least 1 month'],
    },
    expectedReturn: {
      type: Number,
      required: [true, 'Expected return is required'],
      min: [0, 'Expected return cannot be negative'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
SimulationSchema.index({ userId: 1 });
SimulationSchema.index({ createdAt: -1 });

export const Simulation = mongoose.model<ISimulation>(
  'Simulation',
  SimulationSchema
);
