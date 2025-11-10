import mongoose, { Schema, Document } from 'mongoose';

export interface IBridierRanking extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesName: string;
  gameNumber: number;

  // Match data
  empire1: string;
  startingRank1: number;
  startingIndex1: number;
  endingRank1: number;

  empire2: string;
  startingRank2: number;
  startingIndex2: number;
  endingRank2: number;

  // Result
  winner: number; // 0, 1, or 2
  startTime: Date;
  endTime: Date;

  createdAt: Date;
}

const BridierRankingSchema = new Schema<IBridierRanking>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesName: { type: String, required: true },
  gameNumber: { type: Number, required: true },

  // Match data
  empire1: { type: String, required: true },
  startingRank1: { type: Number, required: true },
  startingIndex1: { type: Number, required: true },
  endingRank1: { type: Number, required: true },

  empire2: { type: String, required: true },
  startingRank2: { type: Number, required: true },
  startingIndex2: { type: Number, required: true },
  endingRank2: { type: Number, required: true },

  // Result
  winner: { type: Number, required: true, min: 0, max: 2 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
BridierRankingSchema.index({ gameId: 1 });
BridierRankingSchema.index({ endTime: -1 });
BridierRankingSchema.index({ empire1: 1, empire2: 1 });

export const BridierRanking = mongoose.model<IBridierRanking>('BridierRanking', BridierRankingSchema);