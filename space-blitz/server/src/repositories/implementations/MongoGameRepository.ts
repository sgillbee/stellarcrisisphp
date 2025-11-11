import mongoose from 'mongoose';
import { Game } from '../../models';
import { IGameRepository } from '../IGameRepository';
import { GameWithPlayersDto, GameWithSystemsDto, GameMetadataUpdate, GameStateUpdate } from '../dto';

/**
 * MongoDB implementation of the Game repository
 */
export class MongoGameRepository implements IGameRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await Game.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await Game.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const game = new Game(entity);
    return await game.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await Game.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Game.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await Game.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findBySeries(seriesId: string): Promise<any[]> {
    return await Game.find({ seriesId }).session(this.session);
  }

  async findActiveGames(): Promise<any[]> {
    return await Game.find({ status: 'active' }).session(this.session);
  }

  async findGamesNeedingUpdate(): Promise<any[]> {
    const now = new Date();
    return await Game.find({
      status: 'active',
      playerCount: { $gt: 1 },
      $expr: {
        $lt: ['$lastUpdate', { $subtract: [now, { $multiply: ['$updateTime', 1000] }] }]
      }
    }).session(this.session);
  }

  async getGameWithPlayers(gameId: string): Promise<GameWithPlayersDto> {
    const game = await Game.findById(gameId).session(this.session);
    if (!game) {
      throw new Error('Game not found');
    }

    // Import Player model here to avoid circular dependencies
    const { Player } = await import('../../models');
    const players = await Player.find({ gameId }).session(this.session);

    return {
      game,
      players
    };
  }

  async getGameWithSystems(gameId: string): Promise<GameWithSystemsDto> {
    const game = await Game.findById(gameId).session(this.session);
    if (!game) {
      throw new Error('Game not found');
    }

    // Import System model here to avoid circular dependencies
    const { System } = await import('../../models');
    const systems = await System.find({ gameId }).session(this.session);

    return {
      game,
      systems
    };
  }

  async updateGameMetadata(gameId: string, metadata: GameMetadataUpdate): Promise<void> {
    await Game.findByIdAndUpdate(gameId, metadata, { session: this.session });
  }

  async updateGameState(gameId: string, state: GameStateUpdate): Promise<void> {
    await Game.findByIdAndUpdate(gameId, state, { session: this.session });
  }

  async incrementUpdateCount(gameId: string): Promise<void> {
    await Game.findByIdAndUpdate(gameId, { $inc: { updateCount: 1 } }, { session: this.session });
  }
}