import mongoose from 'mongoose';
import { IUnitOfWork } from '../IUnitOfWork';
import { IGameRepository } from '../IGameRepository';
import { IPlayerRepository } from '../IPlayerRepository';
import { IShipRepository } from '../IShipRepository';
import { ISystemRepository } from '../ISystemRepository';
import { IMessageRepository } from '../IMessageRepository';
import { IHistoryRepository } from '../IHistoryRepository';
import { MongoGameRepository } from './MongoGameRepository';
import { MongoPlayerRepository } from './MongoPlayerRepository';
import { MongoShipRepository } from './MongoShipRepository';
import { MongoSystemRepository } from './MongoSystemRepository';
import { MongoMessageRepository } from './MongoMessageRepository';
import { MongoHistoryRepository } from './MongoHistoryRepository';

/**
 * MongoDB implementation of the Unit of Work pattern
 */
export class MongoUnitOfWork implements IUnitOfWork {
  private _session: mongoose.ClientSession | null = null;
  private _isInTransaction = false;

  // Repository instances
  private _games: IGameRepository | null = null;
  private _players: IPlayerRepository | null = null;
  private _ships: IShipRepository | null = null;
  private _systems: ISystemRepository | null = null;
  private _messages: IMessageRepository | null = null;
  private _history: IHistoryRepository | null = null;

  async beginTransaction(): Promise<void> {
    if (this._isInTransaction) {
      throw new Error('Transaction already in progress');
    }

    this._session = await mongoose.startSession();
    this._session.startTransaction();
    this._isInTransaction = true;

    // Reset repository instances to use the new session
    this._games = null;
    this._players = null;
    this._ships = null;
    this._systems = null;
    this._messages = null;
    this._history = null;
  }

  async commit(): Promise<void> {
    if (!this._isInTransaction || !this._session) {
      throw new Error('No active transaction to commit');
    }

    await this._session.commitTransaction();
    this._isInTransaction = false;
    await this._session.endSession();
    this._session = null;
  }

  async rollback(): Promise<void> {
    if (!this._isInTransaction || !this._session) {
      throw new Error('No active transaction to rollback');
    }

    await this._session.abortTransaction();
    this._isInTransaction = false;
    await this._session.endSession();
    this._session = null;
  }

  async dispose(): Promise<void> {
    if (this._session) {
      if (this._isInTransaction) {
        await this.rollback();
      } else {
        await this._session.endSession();
      }
      this._session = null;
    }
  }

  isInTransaction(): boolean {
    return this._isInTransaction;
  }

  get games(): IGameRepository {
    if (!this._games) {
      this._games = new MongoGameRepository(this._session || undefined);
    }
    return this._games;
  }

  get players(): IPlayerRepository {
    if (!this._players) {
      this._players = new MongoPlayerRepository(this._session || undefined);
    }
    return this._players;
  }

  get ships(): IShipRepository {
    if (!this._ships) {
      this._ships = new MongoShipRepository(this._session || undefined);
    }
    return this._ships;
  }

  get systems(): ISystemRepository {
    if (!this._systems) {
      this._systems = new MongoSystemRepository(this._session || undefined);
    }
    return this._systems;
  }

  get messages(): IMessageRepository {
    if (!this._messages) {
      this._messages = new MongoMessageRepository(this._session || undefined);
    }
    return this._messages;
  }

  get history(): IHistoryRepository {
    if (!this._history) {
      this._history = new MongoHistoryRepository(this._session || undefined);
    }
    return this._history;
  }
}