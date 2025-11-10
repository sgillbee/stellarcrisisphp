import mongoose, { Schema, Document } from 'mongoose';

export interface IShip extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Identity
  name: string;
  type: string;
  owner: string;
  playerId: mongoose.Types.ObjectId;

  // Location
  location: string;

  // Fleet membership
  fleetId: mongoose.Types.ObjectId;

  // Combat stats
  br: number;
  maxBr: number;

  // Costs
  buildCost: number;
  maintenanceCost: number;
  fuelCost: number;

  // State
  cloaked: boolean;

  // Orders
  orders: string;
  orderArguments: string;

  createdAt: Date;
  updatedAt: Date;
}

const ShipSchema = new Schema<IShip>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Identity
  name: { type: String, required: true },
  type: { type: String, required: true },
  owner: { type: String, required: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },

  // Location
  location: { type: String, required: true },

  // Fleet membership
  fleetId: { type: Schema.Types.ObjectId, ref: 'Fleet' },

  // Combat stats
  br: { type: Number, default: 0 },
  maxBr: { type: Number, default: 0 },

  // Costs
  buildCost: { type: Number, default: 0 },
  maintenanceCost: { type: Number, default: 0 },
  fuelCost: { type: Number, default: 0 },

  // State
  cloaked: { type: Boolean, default: false },

  // Orders
  orders: { type: String, default: '' },
  orderArguments: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
ShipSchema.index({ gameId: 1, owner: 1 });
ShipSchema.index({ playerId: 1 });
ShipSchema.index({ fleetId: 1 });
ShipSchema.index({ seriesId: 1, gameNumber: 1 });
ShipSchema.index({ location: 1 });

export const Ship = mongoose.model<IShip>('Ship', ShipSchema);