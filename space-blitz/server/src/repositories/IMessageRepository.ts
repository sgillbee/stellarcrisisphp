import { IRepository } from './IRepository';
import { MessageCreate } from './dto';

/**
 * Message repository interface
 */
export interface IMessageRepository extends IRepository<any> {
  // Queries
  findByGame(gameId: string, limit?: number): Promise<any[]>;
  findByType(gameId: string, type: string): Promise<any[]>;
  findRecentMessages(gameId: string, since: Date): Promise<any[]>;

  // Creation
  createMessage(message: MessageCreate): Promise<any>;
}