import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;

  // Content
  text: string;
  type: string; // 'instant', 'motd', 'private', 'broadcast', 'team', 'update', 'scout', 'game_message'

  // Metadata
  time: Date;
  sender: string; // empire name
  recipient: string; // can be multiple recipients

  // References
  playerId: mongoose.Types.ObjectId;
  empireId: mongoose.Types.ObjectId;

  // State
  flag: boolean; // read/unread

  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  // Content
  text: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['instant', 'motd', 'private', 'broadcast', 'team', 'update', 'scout', 'game_message']
  },

  // Metadata
  time: { type: Date, default: Date.now },
  sender: { type: String, required: true },
  recipient: { type: String, default: '' },

  // References
  playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
  empireId: { type: Schema.Types.ObjectId, ref: 'User' },

  // State
  flag: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
MessageSchema.index({ playerId: 1, flag: 1, type: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ empireId: 1 });
MessageSchema.index({ time: -1 }); // For chronological ordering

export const Message = mongoose.model<IMessage>('Message', MessageSchema);