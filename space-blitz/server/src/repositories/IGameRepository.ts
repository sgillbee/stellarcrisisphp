import { IRepository } from './IRepository';
import { GameWithPlayersDto, GameWithSystemsDto, GameMetadataUpdate, GameStateUpdate } from './dto';

/**
 * Game repository interface
 */
export interface IGameRepository extends IRepository<any> {
  // Core queries
  findBySeries(seriesId: string): Promise<any[]>;
  findActiveGames(): Promise<any[]>;
  findGamesNeedingUpdate(): Promise<any[]>;

  // Complex operations
  getGameWithPlayers(gameId: string): Promise<GameWithPlayersDto>;
  getGameWithSystems(gameId: string): Promise<GameWithSystemsDto>;

  // Updates
  updateGameMetadata(gameId: string, metadata: GameMetadataUpdate): Promise<void>;
  updateGameState(gameId: string, state: GameStateUpdate): Promise<void>;
  incrementUpdateCount(gameId: string): Promise<void>;
}