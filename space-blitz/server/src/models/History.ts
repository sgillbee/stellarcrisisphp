import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;

  // Event data
  empire: string;
  coordinates: string;
  event: string;
  info: string;
  updateNo: number;

  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },

  // Event data
  empire: { type: String, required: true },
  coordinates: { type: String, required: true },
  event: { type: String, required: true },
  info: { type: String, required: true },
  updateNo: { type: Number, required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
HistorySchema.index({ gameId: 1, updateNo: 1 });
HistorySchema.index({ empire: 1 });

export const History = mongoose.model<IHistory>('History', HistorySchema);