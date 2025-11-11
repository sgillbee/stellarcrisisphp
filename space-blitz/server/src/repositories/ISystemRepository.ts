import { IRepository } from './IRepository';
import { SystemResources, SystemColonization } from './dto';

/**
 * System repository interface
 */
export interface ISystemRepository extends IRepository<any> {
  // Queries
  findByGame(gameId: string): Promise<any[]>;
  findByOwner(gameId: string, owner: string): Promise<any[]>;
  findByCoordinates(gameId: string, coordinates: string): Promise<any | null>;
  findUnownedSystems(gameId: string): Promise<any[]>;

  // Updates
  colonizeSystem(systemId: string, owner: string, population?: number): Promise<void>;
  updateSystemResources(systemId: string, resources: SystemResources): Promise<void>;
  updateSystemPopulation(systemId: string, population: number): Promise<void>;
}