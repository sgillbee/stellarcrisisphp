import mongoose, { Schema, Document } from 'mongoose';

export interface IExplored extends Document {
  _id: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Location
  coordinates: string;
  empire: string;

  // State
  updateExplored: number;
  fromSharedHq: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ExploredSchema = new Schema<IExplored>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Location
  coordinates: { type: String, required: true },
  empire: { type: String, required: true },

  // State
  updateExplored: { type: Number, default: 0 },
  fromSharedHq: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
ExploredSchema.index({ playerId: 1, coordinates: 1 }, { unique: true });
ExploredSchema.index({ seriesId: 1, gameNumber: 1 });

export const Explored = mongoose.model<IExplored>('Explored', ExploredSchema);