import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  realName: string;
  isAdmin: boolean;
  joinDate: Date;
  lastLogin: Date;
  lastIp: string;
  tosAccepted: boolean;
  validationInfo: string;

  // Profile settings
  backgroundAttachment: string;
  drawBackground: boolean;
  customBgUrl: string;
  showCoordinates: boolean;
  showIcons: boolean;
  listShipsBySystem: boolean;
  mapOrigin: string;

  // Game stats
  wins: number;
  nuked: number;
  nukes: number;
  ruined: number;
  maxEconomicPower: number;
  maxMilitaryPower: number;

  // Bridier ranking system
  bridier: {
    index: number;
    rank: number;
    delta: number;
    update: Date;
  };

  // Preferences
  canCreateCustomSeries: boolean;
  comment: string;
  emailVisible: boolean;
  icon: string;
  url: string;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  realName: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  joinDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  lastIp: { type: String, default: '' },
  tosAccepted: { type: Boolean, default: false },
  validationInfo: { type: String, default: '' },

  // Profile settings
  backgroundAttachment: { type: String, default: 'scroll' },
  drawBackground: { type: Boolean, default: true },
  customBgUrl: { type: String, default: '' },
  showCoordinates: { type: Boolean, default: true },
  showIcons: { type: Boolean, default: false },
  listShipsBySystem: { type: Boolean, default: false },
  mapOrigin: { type: String, default: '0,0' },

  // Game stats
  wins: { type: Number, default: 0 },
  nuked: { type: Number, default: 0 },
  nukes: { type: Number, default: 0 },
  ruined: { type: Number, default: 0 },
  maxEconomicPower: { type: Number, default: 0 },
  maxMilitaryPower: { type: Number, default: 0 },

  // Bridier ranking system
  bridier: {
    index: { type: Number, default: 500 },
    rank: { type: Number, default: 500 },
    delta: { type: Number, default: 0 },
    update: { type: Date, default: null }
  },

  // Preferences
  canCreateCustomSeries: { type: Boolean, default: false },
  comment: { type: String, default: '' },
  emailVisible: { type: Boolean, default: false },
  icon: { type: String, default: 'alien1.gif' },
  url: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ name: 1 }); // Already indexed as unique
UserSchema.index({ 'bridier.index': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);