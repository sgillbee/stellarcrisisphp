import mongoose, { Schema, Document } from 'mongoose';

export interface ISystem extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Location
  coordinates: string;
  name: string;

  // Resources
  agriculture: number;
  fuel: number;
  mineral: number;

  // Population
  population: number;
  maxPopulation: number;

  // Ownership
  owner: string;
  playerNumber: number;

  // State
  systemActive: boolean;
  annihilated: boolean;

  // Homeworld info
  homeworld: string;

  // Jump connections
  jumps: string;

  createdAt: Date;
  updatedAt: Date;
}

const SystemSchema = new Schema<ISystem>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Location
  coordinates: { type: String, required: true },
  name: { type: String, required: true },

  // Resources
  agriculture: { type: Number, default: 0 },
  fuel: { type: Number, default: 0 },
  mineral: { type: Number, default: 0 },

  // Population
  population: { type: Number, default: 0 },
  maxPopulation: { type: Number, default: 0 },

  // Ownership
  owner: { type: String, default: '' },
  playerNumber: { type: Number, default: 0 },

  // State
  systemActive: { type: Boolean, default: true },
  annihilated: { type: Boolean, default: false },

  // Homeworld info
  homeworld: { type: String, default: '' },

  // Jump connections
  jumps: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
SystemSchema.index({ gameId: 1, coordinates: 1 }, { unique: true });
SystemSchema.index({ seriesId: 1, gameNumber: 1 });
SystemSchema.index({ owner: 1 });

export const System = mongoose.model<ISystem>('System', SystemSchema);