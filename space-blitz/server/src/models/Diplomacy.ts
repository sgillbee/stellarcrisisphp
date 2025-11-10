import mongoose, { Schema, Document } from 'mongoose';

export interface IDiplomacy extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Relationship
  empire: string;
  opponent: string;

  // Status
  offer: number; // 0-6 scale
  status: number; // 0-6 scale

  createdAt: Date;
  updatedAt: Date;
}

const DiplomacySchema = new Schema<IDiplomacy>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Relationship
  empire: { type: String, required: true },
  opponent: { type: String, required: true },

  // Status
  offer: { type: Number, required: true, min: 0, max: 6 },
  status: { type: Number, required: true, min: 0, max: 6 }
}, {
  timestamps: true
});

// Indexes for performance
DiplomacySchema.index({ gameId: 1, empire: 1, opponent: 1 }, { unique: true });

export const Diplomacy = mongoose.model<IDiplomacy>('Diplomacy', DiplomacySchema);