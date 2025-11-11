import mongoose from 'mongoose';
import { Ship } from '../../models';
import { IShipRepository } from '../IShipRepository';
import { ShipOrders, ShipMovement, Position } from '../dto';

/**
 * MongoDB implementation of the Ship repository
 */
export class MongoShipRepository implements IShipRepository {
  private session: mongoose.ClientSession | null = null;

  constructor(session?: mongoose.ClientSession) {
    this.session = session || null;
  }

  async findById(id: string): Promise<any | null> {
    return await Ship.findById(id).session(this.session);
  }

  async findAll(): Promise<any[]> {
    return await Ship.find().session(this.session);
  }

  async create(entity: any): Promise<any> {
    const ship = new Ship(entity);
    return await ship.save({ session: this.session });
  }

  async update(id: string, entity: Partial<any>): Promise<any | null> {
    return await Ship.findByIdAndUpdate(id, entity, {
      new: true,
      session: this.session
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Ship.findByIdAndDelete(id).session(this.session);
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const count = await Ship.countDocuments({ _id: id }).session(this.session);
    return count > 0;
  }

  async findByGame(gameId: string): Promise<any[]> {
    return await Ship.find({ gameId }).session(this.session);
  }

  async findByOwner(gameId: string, owner: string): Promise<any[]> {
    return await Ship.find({ gameId, owner }).session(this.session);
  }

  async findByLocation(gameId: string, location: string): Promise<any[]> {
    return await Ship.find({ gameId, location }).session(this.session);
  }

  async findShipsWithOrders(gameId: string): Promise<any[]> {
    return await Ship.find({ gameId, orders: { $ne: null } }).session(this.session);
  }

  async findShipsByType(gameId: string, shipType: string): Promise<any[]> {
    return await Ship.find({ gameId, type: shipType }).session(this.session);
  }

  async updateShipOrders(shipId: string, orders: ShipOrders): Promise<void> {
    await Ship.findByIdAndUpdate(shipId, orders, { session: this.session });
  }

  async updateShipPosition(shipId: string, position: Position): Promise<void> {
    await Ship.findByIdAndUpdate(shipId, position, { session: this.session });
  }

  async updateShipFuel(shipId: string, fuel: number): Promise<void> {
    await Ship.findByIdAndUpdate(shipId, { fuel }, { session: this.session });
  }

  async destroyShips(shipIds: string[]): Promise<void> {
    await Ship.deleteMany({ _id: { $in: shipIds } }).session(this.session);
  }

  async moveShips(movements: ShipMovement[]): Promise<void> {
    const bulkOps = movements.map(movement => ({
      updateOne: {
        filter: { _id: movement.shipId },
        update: {
          location: movement.toLocation,
          $inc: { fuel: -movement.fuelCost }
        }
      }
    }));

    const options: any = {};
    if (this.session) {
      options.session = this.session;
    }

    await Ship.bulkWrite(bulkOps, options);
  }
}