import mongoose from 'mongoose';
import { History } from '../../models';
import { IHistoryRepository } from '../IHistoryRepository';
import { HistoryCreate } from '../dto';

/**
 * MongoDB implementation of the History repository
 */
export class MongoHistoryRepository implements IHistoryRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await History.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await History.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const history = new History(entity);
    return await history.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await History.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await History.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await History.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findByGame(gameId: string): Promise<any[]> {
    return await History.find({ gameId }).session(this.session).sort({ timestamp: -1 });
  }

  async findBySeries(seriesId: string): Promise<any[]> {
    return await History.find({ seriesId }).session(this.session).sort({ timestamp: -1 });
  }

  async findByUpdateNumber(gameId: string, updateNumber: number): Promise<any[]> {
    return await History.find({ gameId, updateNumber }).session(this.session).sort({ timestamp: -1 });
  }

  async createHistoryEntry(entry: HistoryCreate): Promise<any> {
    const historyEntry = new History(entry);
    return await historyEntry.save({ session: this.session });
  }
}