import mongoose from 'mongoose';
import { Player } from '../../models';
import { IPlayerRepository } from '../IPlayerRepository';
import { PlayerWithSystemsDto, PlayerWithStatsDto, ResourceUpdate, PlayerStatsUpdate, TechUpdate } from '../dto';

/**
 * MongoDB implementation of the Player repository
 */
export class MongoPlayerRepository implements IPlayerRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await Player.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await Player.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const player = new Player(entity);
    return await player.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await Player.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Player.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await Player.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findByGame(gameId: string): Promise<any[]> {
    return await Player.find({ gameId }).session(this.session);
  }

  async findByEmpire(empireId: string): Promise<any[]> {
    return await Player.find({ empireId }).session(this.session);
  }

  async findActivePlayers(gameId: string): Promise<any[]> {
    return await Player.find({ gameId, team: { $gt: 0 } }).session(this.session);
  }

  async getPlayerWithSystems(playerId: string): Promise<PlayerWithSystemsDto> {
    const player = await Player.findById(playerId).session(this.session);
    if (!player) {
      throw new Error('Player not found');
    }

    // Import System model here to avoid circular dependencies
    const { System } = await import('../../models');
    const systems = await System.find({ gameId: player.gameId, owner: player.empireName }).session(this.session);

    return {
      player,
      systems
    };
  }

  async getPlayersWithStats(gameId: string): Promise<PlayerWithStatsDto[]> {
    const players = await Player.find({ gameId }).session(this.session);

    return players.map(player => ({
      player,
      economicPower: Math.floor((player.mineral + player.fuel + player.agriculture) / 100),
      militaryPower: Math.floor(player.militaryPower || 0)
    }));
  }

  async updatePlayerResources(playerId: string, resources: ResourceUpdate): Promise<void> {
    await Player.findByIdAndUpdate(playerId, resources, { session: this.session });
  }

  async updatePlayerStats(playerId: string, stats: PlayerStatsUpdate): Promise<void> {
    await Player.findByIdAndUpdate(playerId, stats, { session: this.session });
  }

  async updatePlayerTech(playerId: string, tech: TechUpdate): Promise<void> {
    await Player.findByIdAndUpdate(playerId, tech, { session: this.session });
  }
}