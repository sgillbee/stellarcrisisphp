import mongoose, { Schema, Document } from 'mongoose';

export interface ITournamentEntrant {
  empireId: mongoose.Types.ObjectId;
  empireName: string;
  eliminated: boolean;
  byes: number;
}

export interface ITournamentGame {
  gameId: mongoose.Types.ObjectId;
  round: number;
  firstEmpire: string;
  secondEmpire: string;
  winner: mongoose.Types.ObjectId; // empire ID
}

export interface ITournament extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  seriesId: mongoose.Types.ObjectId;

  // Status
  completed: boolean;
  startTime: Date;

  // Participants
  entrants: ITournamentEntrant[];

  // Games
  games: ITournamentGame[];

  createdAt: Date;
  updatedAt: Date;
}

const TournamentEntrantSchema = new Schema<ITournamentEntrant>({
  empireId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  empireName: { type: String, required: true },
  eliminated: { type: Boolean, default: false },
  byes: { type: Number, default: 0 }
});

const TournamentGameSchema = new Schema<ITournamentGame>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  round: { type: Number, required: true },
  firstEmpire: { type: String, required: true },
  secondEmpire: { type: String, required: true },
  winner: { type: Schema.Types.ObjectId, ref: 'User' }
});

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },

  // Status
  completed: { type: Boolean, default: false },
  startTime: { type: Date, required: true },

  // Participants
  entrants: [TournamentEntrantSchema],

  // Games
  games: [TournamentGameSchema]
}, {
  timestamps: true
});

// Indexes for performance
TournamentSchema.index({ seriesId: 1 });
TournamentSchema.index({ completed: 1 });

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);