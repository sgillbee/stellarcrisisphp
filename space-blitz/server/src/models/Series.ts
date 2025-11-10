import mongoose, { Schema, Document } from 'mongoose';

export interface IShipTypeOption {
  shipType: string;
  status: string;
  rangeMultiplier: number;
  loss: number;
  buildCost: number;
  maintenanceCost: number;
}

export interface ISeries extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  gameType: string;
  creator: string;
  custom: boolean;

  // Game settings
  diplomacy: number;
  averageResources: number;
  avgAg: number;
  avgFuel: number;
  avgMin: number;
  techMultiple: number;
  updateTime: number;
  weekendUpdates: boolean;

  // Series configuration
  maxPlayers: number;
  maxWins: number;
  minWins: number;
  systemsPerPlayer: number;
  teamGame: boolean;
  mapType: string;
  mapCompression: number;
  mapVisible: boolean;
  bridierAllowed: boolean;

  // Build settings
  buildCloakersCloaked: boolean;
  cloakersAsAttacks: boolean;
  visibleBuilds: boolean;

  // Game end conditions
  canDraw: boolean;
  canSurrender: boolean;

  // Status
  halted: boolean;
  gameCount: number;

  // Ship type options
  shipTypeOptions: IShipTypeOption[];

  createdAt: Date;
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

const SeriesSchema = new Schema<ISeries>({
  name: { type: String, required: true, unique: true, index: true },
  gameType: { type: String, default: 'v2' },
  creator: { type: String, required: true },
  custom: { type: Boolean, default: false },

  // Game settings
  diplomacy: { type: Number, default: 2, min: 0, max: 6 },
  averageResources: { type: Number, default: 30 },
  avgAg: { type: Number, default: 30 },
  avgFuel: { type: Number, default: 30 },
  avgMin: { type: Number, default: 30 },
  techMultiple: { type: Number, default: 0 },
  updateTime: { type: Number, default: 0 },
  weekendUpdates: { type: Boolean, default: true },

  // Series configuration
  maxPlayers: { type: Number, default: 0 },
  maxWins: { type: Number, default: -1 },
  minWins: { type: Number, default: 0 },
  systemsPerPlayer: { type: Number, default: 0 },
  teamGame: { type: Boolean, default: false },
  mapType: { type: String, default: 'standard' },
  mapCompression: { type: Number, default: 0.001 },
  mapVisible: { type: Boolean, default: false },
  bridierAllowed: { type: Boolean, default: false },

  // Build settings
  buildCloakersCloaked: { type: Boolean, default: false },
  cloakersAsAttacks: { type: Boolean, default: false },
  visibleBuilds: { type: Boolean, default: false },

  // Game end conditions
  canDraw: { type: Boolean, default: false },
  canSurrender: { type: Boolean, default: false },

  // Status
  halted: { type: Boolean, default: false },
  gameCount: { type: Number, default: 0 },

  // Ship type options
  shipTypeOptions: [ShipTypeOptionSchema]
}, {
  timestamps: true
});

// Indexes for performance
SeriesSchema.index({ name: 1 }); // Already indexed as unique

export const Series = mongoose.model<ISeries>('Series', SeriesSchema);