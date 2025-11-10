import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;
  seriesName: string;

  // Player identity
  empireName: string;
  empireId: mongoose.Types.ObjectId;

  // Resources
  agriculture: number;
  fuel: number;
  mineral: number;
  population: number;

  // Ratios
  agricultureRatio: number;
  fuelRatio: number;
  mineralRatio: number;

  // Economic state
  economicPower: number;
  militaryPower: number;
  maintenance: number;
  build: number;
  fuelUse: number;

  // Technology
  techLevel: number;
  techDevelopment: number;
  techs: string;

  // Game state
  endedTurn: boolean;
  lastUpdate: number;
  tradedIn: number;

  // Team information
  team: number;
  teamSpot: string;

  // UI preferences
  mapOrigin: string;
  maxPopulation: number;
  notes: string;

  // Network info
  ip: string;
  lastAccess: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },
  seriesName: { type: String, required: true },

  // Player identity
  empireName: { type: String, required: true },
  empireId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Resources
  agriculture: { type: Number, default: 0 },
  fuel: { type: Number, default: 0 },
  mineral: { type: Number, default: 0 },
  population: { type: Number, default: 0 },

  // Ratios
  agricultureRatio: { type: Number, default: 1.0 },
  fuelRatio: { type: Number, default: null },
  mineralRatio: { type: Number, default: null },

  // Economic state
  economicPower: { type: Number, default: 0 },
  militaryPower: { type: Number, default: 0 },
  maintenance: { type: Number, default: 0 },
  build: { type: Number, default: 0 },
  fuelUse: { type: Number, default: 0 },

  // Technology
  techLevel: { type: Number, default: 0 },
  techDevelopment: { type: Number, default: 0 },
  techs: { type: String, default: '' },

  // Game state
  endedTurn: { type: Boolean, default: false },
  lastUpdate: { type: Number, default: 0 },
  tradedIn: { type: Number, default: 0 },

  // Team information
  team: { type: Number, default: 0 },
  teamSpot: { type: String, default: '' },

  // UI preferences
  mapOrigin: { type: String, default: '0,0' },
  maxPopulation: { type: Number, default: 0 },
  notes: { type: String, default: '' },

  // Network info
  ip: { type: String, default: '' },
  lastAccess: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
PlayerSchema.index({ gameId: 1, empireName: 1 }, { unique: true });
PlayerSchema.index({ empireId: 1 });
PlayerSchema.index({ seriesId: 1, gameNumber: 1 });

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);