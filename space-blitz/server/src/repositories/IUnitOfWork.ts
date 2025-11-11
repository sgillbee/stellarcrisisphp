import { IGameRepository } from './IGameRepository';
import { IPlayerRepository } from './IPlayerRepository';
import { IShipRepository } from './IShipRepository';
import { ISystemRepository } from './ISystemRepository';
import { IMessageRepository } from './IMessageRepository';
import { IHistoryRepository } from './IHistoryRepository';

/**
 * Unit of Work interface for managing transactions and repository access
 */
export interface IUnitOfWork {
  /**
   * Begin a new transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Dispose of the unit of work and clean up resources
   */
  dispose(): Promise<void>;

  /**
   * Check if a transaction is currently active
   */
  isInTransaction(): boolean;

  // Repository access within the transaction context
  games: IGameRepository;
  players: IPlayerRepository;
  ships: IShipRepository;
  systems: ISystemRepository;
  messages: IMessageRepository;
  history: IHistoryRepository;
}