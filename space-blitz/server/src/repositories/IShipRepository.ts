import { IRepository } from './IRepository';
import { ShipOrders, ShipMovement, Position } from './dto';

/**
 * Ship repository interface
 */
export interface IShipRepository extends IRepository<any> {
  // Queries
  findByGame(gameId: string): Promise<any[]>;
  findByOwner(gameId: string, owner: string): Promise<any[]>;
  findByLocation(gameId: string, location: string): Promise<any[]>;
  findShipsWithOrders(gameId: string): Promise<any[]>;
  findShipsByType(gameId: string, shipType: string): Promise<any[]>;

  // Updates
  updateShipOrders(shipId: string, orders: ShipOrders): Promise<void>;
  updateShipPosition(shipId: string, position: Position): Promise<void>;
  updateShipFuel(shipId: string, fuel: number): Promise<void>;

  // Bulk operations
  destroyShips(shipIds: string[]): Promise<void>;
  moveShips(movements: ShipMovement[]): Promise<void>;
}