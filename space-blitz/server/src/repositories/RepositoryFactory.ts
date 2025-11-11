import { IUnitOfWork } from './IUnitOfWork';
import { IGameRepository } from './IGameRepository';
import { IPlayerRepository } from './IPlayerRepository';
import { IShipRepository } from './IShipRepository';
import { ISystemRepository } from './ISystemRepository';
import { IMessageRepository } from './IMessageRepository';
import { IHistoryRepository } from './IHistoryRepository';
import { MongoUnitOfWork } from './implementations/MongoUnitOfWork';
import { MongoGameRepository } from './implementations/MongoGameRepository';
import { MongoPlayerRepository } from './implementations/MongoPlayerRepository';
import { MongoShipRepository } from './implementations/MongoShipRepository';
import { MongoSystemRepository } from './implementations/MongoSystemRepository';
import { MongoMessageRepository } from './implementations/MongoMessageRepository';
import { MongoHistoryRepository } from './implementations/MongoHistoryRepository';

/**
 * Factory for creating repository instances
 */
export class RepositoryFactory {
  /**
   * Create a new Unit of Work instance
   */
  static createUnitOfWork(): IUnitOfWork {
    return new MongoUnitOfWork();
  }

  /**
   * Create individual repository instances (without transaction context)
   */
  static createGameRepository(): IGameRepository {
    return new MongoGameRepository();
  }

  static createPlayerRepository(): IPlayerRepository {
    return new MongoPlayerRepository();
  }

  static createShipRepository(): IShipRepository {
    return new MongoShipRepository();
  }

  static createSystemRepository(): ISystemRepository {
    return new MongoSystemRepository();
  }

  static createMessageRepository(): IMessageRepository {
    return new MongoMessageRepository();
  }

  static createHistoryRepository(): IHistoryRepository {
    return new MongoHistoryRepository();
  }
}