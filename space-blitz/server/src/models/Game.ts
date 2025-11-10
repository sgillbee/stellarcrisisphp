import mongoose, { Schema, Document } from 'mongoose';

export interface IShipTypeOption {
  shipType: string;
  status: string;
  rangeMultiplier: number;
  loss: number;
  buildCost: number;
  maintenanceCost: number;
}

export interface IGame extends Document {
  _id: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;
  seriesName: string;

  // Game state
  status: string; // 'active', 'completed', 'paused', 'cancelled'
  phase: string; // 'setup', 'active', 'finished'

  // Game settings (inherited from series but can be overridden)
  diplomacy: number;
  avgAg: number;
  avgFuel: number;
  avgMin: number;
  bridier: number;
  weekendUpdates: boolean;

  // Game metadata
  createdAt: Date;
  createdBy: string;
  lastUpdate: Date;
  updateCount: number;
  updateTime: number;

  // Passwords for joining
  password1: string;
  password2: string;

  // Current state
  processing: boolean;
  updating: boolean;
  onHold: boolean;
  closed: boolean;

  // Player management
  playerCount: number;
  maxAllies: number;

  // Version info
  version: string;

  // References to embedded collections
  players: mongoose.Types.ObjectId[];
  systems: mongoose.Types.ObjectId[];

  // Ship type options specific to this game
  shipTypeOptions: IShipTypeOption[];

  updatedAt: Date;
}

const ShipTypeOptionSchema = new Schema<IShipTypeOption>({
  shipType: { type: String, required: true },
  status: { type: String, required: true },
  rangeMultiplier: { type: Number, default: 1.0 },
  loss: { type: Number, default: 0.0 },
  buildCost: { type: Number, default: 0 },
  maintenanceCost: { type: Number, default: 0 }
});

const GameSchema = new Schema<IGame>({
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },
  seriesName: { type: String, required: true },

  // Game state
  status: { type: String, default: 'active', enum: ['active', 'completed', 'paused', 'cancelled'] },
  phase: { type: String, default: 'setup', enum: ['setup', 'active', 'finished'] },

  // Game settings
  diplomacy: { type: Number, default: 2, min: 0, max: 6 },
  avgAg: { type: Number, default: 30 },
  avgFuel: { type: Number, default: 30 },
  avgMin: { type: Number, default: 30 },
  bridier: { type: Number, default: -1 },
  weekendUpdates: { type: Boolean, default: true },

  // Game metadata
  createdBy: { type: String, required: true },
  lastUpdate: { type: Date, default: Date.now },
  updateCount: { type: Number, default: 0 },
  updateTime: { type: Number, default: 0 },

  // Passwords for joining
  password1: { type: String, default: '' },
  password2: { type: String, default: '' },

  // Current state
  processing: { type: Boolean, default: false },
  updating: { type: Boolean, default: false },
  onHold: { type: Boolean, default: false },
  closed: { type: Boolean, default: false },

  // Player management
  playerCount: { type: Number, default: 0 },
  maxAllies: { type: Number, default: null },

  // Version info
  version: { type: String, default: '' },

  // References to embedded collections
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  systems: [{ type: Schema.Types.ObjectId, ref: 'System' }],

  // Ship type options specific to this game
  shipTypeOptions: [ShipTypeOptionSchema]
}, {
  timestamps: true
});

// Indexes for performance
GameSchema.index({ seriesId: 1, gameNumber: 1 }, { unique: true });
GameSchema.index({ status: 1 });
GameSchema.index({ phase: 1 });

export const Game = mongoose.model<IGame>('Game', GameSchema);