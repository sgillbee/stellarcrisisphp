import mongoose, { Schema, Document } from 'mongoose';

export interface IScoutingReport extends Document {
  _id: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;

  // Location
  coordinates: string;
  name: string;
  owner: string;

  // Resources
  agriculture: number;
  fuel: number;
  mineral: number;
  population: number;

  // Ships
  ships: string; // JSON string of ship data

  // State
  annihilated: boolean;
  comment: string;
  jumps: string;

  createdAt: Date;
  updatedAt: Date;
}

const ScoutingReportSchema = new Schema<IScoutingReport>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },

  // Location
  coordinates: { type: String, required: true },
  name: { type: String, required: true },
  owner: { type: String, default: '' },

  // Resources
  agriculture: { type: Number, default: 0 },
  fuel: { type: Number, default: 0 },
  mineral: { type: Number, default: 0 },
  population: { type: Number, default: 0 },

  // Ships
  ships: { type: String, default: '' },

  // State
  annihilated: { type: Boolean, default: false },
  comment: { type: String, default: '' },
  jumps: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
ScoutingReportSchema.index({ playerId: 1, coordinates: 1 }, { unique: true });

export const ScoutingReport = mongoose.model<IScoutingReport>('ScoutingReport', ScoutingReportSchema);