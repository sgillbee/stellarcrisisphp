import mongoose, { Schema, Document } from 'mongoose';

export interface IFleet extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Identity
  name: string;
  owner: string;
  playerId: mongoose.Types.ObjectId;

  // State
  collapsed: boolean;
  location: string;

  // Orders
  orders: string;
  orderArguments: string;

  createdAt: Date;
  updatedAt: Date;
}

const FleetSchema = new Schema<IFleet>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Identity
  name: { type: String, required: true },
  owner: { type: String, required: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },

  // State
  collapsed: { type: Boolean, default: false },
  location: { type: String, required: true },

  // Orders
  orders: { type: String, default: '' },
  orderArguments: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
FleetSchema.index({ gameId: 1 });
FleetSchema.index({ playerId: 1 });
FleetSchema.index({ seriesId: 1, gameNumber: 1 });
FleetSchema.index({ owner: 1 });

export const Fleet = mongoose.model<IFleet>('Fleet', FleetSchema);