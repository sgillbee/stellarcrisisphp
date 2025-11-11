import mongoose from 'mongoose';
import { System } from '../../models';
import { ISystemRepository } from '../ISystemRepository';
import { SystemResources, SystemColonization } from '../dto';

/**
 * MongoDB implementation of the System repository
 */
export class MongoSystemRepository implements ISystemRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await System.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await System.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const system = new System(entity);
    return await system.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await System.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await System.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await System.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findByGame(gameId: string): Promise<any[]> {
    return await System.find({ gameId }).session(this.session);
  }

  async findByOwner(gameId: string, owner: string): Promise<any[]> {
    return await System.find({ gameId, owner }).session(this.session);
  }

  async findByCoordinates(gameId: string, coordinates: string): Promise<any | null> {
    return await System.findOne({ gameId, coordinates }).session(this.session);
  }

  async findUnownedSystems(gameId: string): Promise<any[]> {
    return await System.find({ gameId, owner: { $exists: false } }).session(this.session);
  }

  async colonizeSystem(systemId: string, owner: string, population: number = 1): Promise<void> {
    await System.findByIdAndUpdate(systemId, {
      owner,
      population
    }, { session: this.session });
  }

  async updateSystemResources(systemId: string, resources: SystemResources): Promise<void> {
    await System.findByIdAndUpdate(systemId, resources, { session: this.session });
  }

  async updateSystemPopulation(systemId: string, population: number): Promise<void> {
    await System.findByIdAndUpdate(systemId, { population }, { session: this.session });
  }
}