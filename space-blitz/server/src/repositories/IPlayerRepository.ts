import { IRepository } from './IRepository';
import { PlayerWithSystemsDto, PlayerWithStatsDto, ResourceUpdate, PlayerStatsUpdate, TechUpdate } from './dto';

/**
 * Player repository interface
 */
export interface IPlayerRepository extends IRepository<any> {
  // Queries
  findByGame(gameId: string): Promise<any[]>;
  findByEmpire(empireId: string): Promise<any[]>;
  findActivePlayers(gameId: string): Promise<any[]>;

  // Complex operations
  getPlayerWithSystems(playerId: string): Promise<PlayerWithSystemsDto>;
  getPlayersWithStats(gameId: string): Promise<PlayerWithStatsDto[]>;

  // Updates
  updatePlayerResources(playerId: string, resources: ResourceUpdate): Promise<void>;
  updatePlayerStats(playerId: string, stats: PlayerStatsUpdate): Promise<void>;
  updatePlayerTech(playerId: string, tech: TechUpdate): Promise<void>;
}