export interface Ship {
  _id: string;
  name: string;
  type: string;
  location: string;
  orders: string;
  orderArguments?: string;
  fuel: number;
  maxFuel: number;
  br: number; // Battle Rating
  owner: string;
  buildCost?: number;
  maintenanceCost?: number;
  fuelCost?: number;
}

export interface Game {
  _id: string;
  name: string;
  series: string;
  status: 'waiting' | 'active' | 'finished';
  players: Player[];
  currentTurn: number;
  maxTurns: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  _id: string;
  name: string;
  empire: string;
  isActive: boolean;
  ships: Ship[];
}

export interface System {
  _id: string;
  name: string;
  x: number;
  y: number;
  owner?: string;
  planets: Planet[];
  ships: Ship[];
}

export interface Planet {
  _id: string;
  name: string;
  type: 'terrestrial' | 'gas-giant' | 'asteroid';
  population?: number;
  resources: number;
}

export interface Tournament {
  _id: string;
  name: string;
  series: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  maxPlayers: number;
  currentPlayers: number;
  prizePool: number;
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Series {
  _id: string;
  name: string;
  description: string;
  gameType: string;
  maxPlayers: number;
  shipTypeOptions: ShipTypeOption[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipTypeOption {
  type: string;
  name: string;
  description: string;
  cost: number;
  br: number;
  fuelCapacity: number;
  maintenanceCost: number;
}