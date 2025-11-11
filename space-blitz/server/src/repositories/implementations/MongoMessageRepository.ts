import mongoose from 'mongoose';
import { Message } from '../../models';
import { IMessageRepository } from '../IMessageRepository';
import { MessageCreate } from '../dto';

/**
 * MongoDB implementation of the Message repository
 */
export class MongoMessageRepository implements IMessageRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await Message.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await Message.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const message = new Message(entity);
    return await message.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await Message.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Message.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await Message.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findByGame(gameId: string, limit?: number): Promise<any[]> {
    const query = Message.find({ gameId }).session(this.session).sort({ time: -1 });
    if (limit) {
      query.limit(limit);
    }
    return await query;
  }

  async findByType(gameId: string, type: string): Promise<any[]> {
    return await Message.find({ gameId, type }).session(this.session).sort({ time: -1 });
  }

  async findRecentMessages(gameId: string, since: Date): Promise<any[]> {
    return await Message.find({
      gameId,
      time: { $gte: since }
    }).session(this.session).sort({ time: -1 });
  }

  async createMessage(message: MessageCreate): Promise<any> {
    const newMessage = new Message(message);
    return await newMessage.save({ session: this.session });
  }
}