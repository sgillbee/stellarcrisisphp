import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  gameNumber: number;

  // Invitation details
  empire: string;
  message: string;
  status: string; // 'Accepted', 'Declined', 'None'
  team: number;

  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
  gameNumber: { type: Number, required: true },

  // Invitation details
  empire: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    required: true,
    enum: ['Accepted', 'Declined', 'None'],
    default: 'None'
  },
  team: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for performance
InvitationSchema.index({ seriesId: 1, gameNumber: 1, empire: 1 }, { unique: true });

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);