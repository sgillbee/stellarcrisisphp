import { IRepository } from './IRepository';
import { HistoryCreate } from './dto';

/**
 * History repository interface
 */
export interface IHistoryRepository extends IRepository<any> {
  // Queries
  findByGame(gameId: string): Promise<any[]>;
  findBySeries(seriesId: string): Promise<any[]>;
  findByUpdateNumber(gameId: string, updateNumber: number): Promise<any[]>;

  // Creation
  createHistoryEntry(entry: HistoryCreate): Promise<any>;
}