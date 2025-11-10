import mongoose, { Schema, Document } from 'mongoose';

export interface IGameLog extends Document {
  _id: mongoose.Types.ObjectId;

  // Game info
  name: string;
  result: string; // 'win', 'draw', 'abandoned', 'no winner'
  bridier: boolean;

  // End state
  endDate: Date;
  empsLeft: string;
  empsNuked: string;

  createdAt: Date;
}

const GameLogSchema = new Schema<IGameLog>({
  // Game info
  name: { type: String, required: true },
  result: {
    type: String,
    required: true,
    enum: ['win', 'draw', 'abandoned', 'no winner']
  },
  bridier: { type: Boolean, default: false },

  // End state
  endDate: { type: Date, default: null },
  empsLeft: { type: String, default: '' },
  empsNuked: { type: String, default: '' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
GameLogSchema.index({ bridier: 1 });
GameLogSchema.index({ endDate: -1 });

export const GameLog = mongoose.model<IGameLog>('GameLog', GameLogSchema);