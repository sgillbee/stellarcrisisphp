import mongoose from 'mongoose';

/**
 * Data Transfer Objects for repository operations
 */

// Game DTOs
export interface GameWithPlayersDto {
  game: any;
  players: any[];
}

export interface GameWithSystemsDto {
  game: any;
  systems: any[];
}

export interface GameMetadataUpdate {
  updateCount?: number;
  lastUpdate?: Date;
  status?: string;
  phase?: string;
}

export interface GameStateUpdate {
  status?: string;
  phase?: string;
  processing?: boolean;
  updating?: boolean;
}

// Player DTOs
export interface PlayerWithSystemsDto {
  player: any;
  systems: any[];
}

export interface PlayerWithStatsDto {
  player: any;
  economicPower: number;
  militaryPower: number;
}

export interface ResourceUpdate {
  agriculture?: number;
  fuel?: number;
  mineral?: number;
  population?: number;
}

export interface PlayerStatsUpdate {
  economicPower?: number;
  militaryPower?: number;
  maintenance?: number;
  build?: number;
  fuelUse?: number;
}

export interface TechUpdate {
  techLevel?: number;
  techDevelopment?: number;
  techs?: string;
}

// Ship DTOs
export interface ShipOrders {
  orders: string;
  path?: string[];
  target?: string;
}

export interface ShipMovement {
  shipId: string;
  fromLocation: string;
  toLocation: string;
  fuelCost: number;
}

export interface Position {
  location: string;
  coordinates?: string;
}

// System DTOs
export interface SystemResources {
  mineral: number;
  fuel: number;
  agriculture: number;
}

export interface SystemColonization {
  owner: string;
  population: number;
}

// Message DTOs
export interface MessageCreate {
  gameId: mongoose.Types.ObjectId;
  type: string;
  text: string;
  time: Date;
  playerId?: mongoose.Types.ObjectId;
}

// History DTOs
export interface HistoryCreate {
  gameId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  updateNumber: number;
  timestamp: Date;
  type: string;
  description?: string;
}