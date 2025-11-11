import { IUnitOfWork } from '../repositories';
import { GameUpdateResult } from './types';

/**
 * Core game engine for Space Blitz
 * Ports the PHP update_game function and related mechanics
 */
export class GameEngine {
  constructor(private unitOfWork: IUnitOfWork) {}

  /**
   * Main game update function - equivalent to PHP update_game()
   */
  async updateGame(series: any, game: any, updateTime: Date): Promise<GameUpdateResult> {
    try {
      await this.unitOfWork.beginTransaction();

      // Update game metadata
      game.updateCount += 1;
      game.lastUpdate = updateTime;
      await this.unitOfWork.games.updateGameMetadata(game._id, {
        updateCount: game.updateCount,
        lastUpdate: updateTime
      });

      // Create history entry
      await this.unitOfWork.history.createHistoryEntry({
        gameId: game._id,
        seriesId: series._id,
        updateNumber: game.updateCount,
        timestamp: updateTime,
        type: 'update'
      });

      // Get all players in the game
      const players = await this.unitOfWork.players.findByGame(game._id);

      // Process ship movements and orders
      await this.processShipMovements(game, players);

      // Process combat
      await this.processCombat(game, players);

      // Process production and economy
      await this.processEconomy(game, players, series);

      // Check for game end conditions
      const gameEndResult = await this.checkGameEndConditions(game, players);
      if (gameEndResult.gameEnded) {
        await this.unitOfWork.commit();
        return { success: true, gameEnded: true, message: gameEndResult.message };
      }

      // Update player statistics
      await this.updatePlayerStats(game, players);

      await this.unitOfWork.commit();
      return { success: true, gameEnded: false };

    } catch (error) {
      await this.unitOfWork.rollback();
      console.error('Game update error:', error);
      return {
        success: false,
        gameEnded: false,
        error: error instanceof Error ? error.message : 'Unknown error during game update'
      };
    }
  }

  /**
   * Process ship movements and orders
   */
  private async processShipMovements(game: any, players: any[]) {
    const ships = await this.unitOfWork.ships.findShipsWithOrders(game._id);
    for (const ship of ships) {
      await this.processShipOrder(ship, game);
    }
  }

  /**
   * Process individual ship orders
   */
  private async processShipOrder(ship: any, game: any) {
    switch (ship.orders) {
      case 'move':
        await this.moveShip(ship);
        break;
      case 'colonize':
        await this.colonizeSystem(ship, game);
        break;
    }
  }

  /**
   * Move a ship to its destination
   */
  private async moveShip(ship: any) {
    if (!ship.orderArguments) return;
    const destination = ship.orderArguments;
    ship.location = destination;
    if (ship.fuelCost > 0) {
      ship.fuel -= ship.fuelCost;
      if (ship.fuel < 0) {
        await this.unitOfWork.ships.delete(ship._id);
        return;
      }
    }
    await this.unitOfWork.ships.update(ship._id, ship);
  }

  /**
   * Colonize a system
   */
  private async colonizeSystem(ship: any, game: any) {
    const system = await this.unitOfWork.systems.findByCoordinates(game._id, ship.location);
    if (!system || system.owner) return;
    await this.unitOfWork.systems.colonizeSystem(system._id, ship.owner, 1);
    await this.unitOfWork.ships.delete(ship._id);
  }

  /**
   * Process combat between ships in the same system
   */
  private async processCombat(game: any, players: any[]) {
    const shipsByLocation = new Map<string, any[]>();
    const allShips = await this.unitOfWork.ships.findByGame(game._id);
    for (const ship of allShips) {
      if (!shipsByLocation.has(ship.location)) {
        shipsByLocation.set(ship.location, []);
      }
      shipsByLocation.get(ship.location)!.push(ship);
    }

    for (const [location, ships] of shipsByLocation) {
      if (ships.length > 1) {
        const owners = new Set(ships.map(s => s.owner));
        if (owners.size > 1) {
          await this.resolveCombat(ships, location, game);
        }
      }
    }
  }

  /**
   * Resolve combat between ships in a system
   */
  private async resolveCombat(ships: any[], location: string, game: any) {
    const shipsByOwner = new Map<string, any[]>();
    for (const ship of ships) {
      if (!shipsByOwner.has(ship.owner)) {
        shipsByOwner.set(ship.owner, []);
      }
      shipsByOwner.get(ship.owner)!.push(ship);
    }

    const owners = Array.from(shipsByOwner.keys());
    if (owners.length === 2) {
      const [owner1, owner2] = owners;
      const ships1 = shipsByOwner.get(owner1)!;
      const ships2 = shipsByOwner.get(owner2)!;

      const br1 = ships1.reduce((sum: number, ship: any) => sum + ship.br, 0);
      const br2 = ships2.reduce((sum: number, ship: any) => sum + ship.br, 0);

      if (br1 > br2) {
        await this.unitOfWork.ships.destroyShips(ships2.map(s => s._id));
        await this.unitOfWork.messages.createMessage({
          gameId: game._id,
          type: 'combat',
          text: `Combat in ${location}: ${owner1} defeated ${owner2}`,
          time: new Date(),
        });
      } else if (br2 > br1) {
        await this.unitOfWork.ships.destroyShips(ships1.map(s => s._id));
        await this.unitOfWork.messages.createMessage({
          gameId: game._id,
          type: 'combat',
          text: `Combat in ${location}: ${owner2} defeated ${owner1}`,
          time: new Date(),
        });
      } else {
        await this.unitOfWork.ships.destroyShips(ships.map(s => s._id));
        await this.unitOfWork.messages.createMessage({
          gameId: game._id,
          type: 'combat',
          text: `Combat in ${location}: Mutual destruction between ${owner1} and ${owner2}`,
          time: new Date(),
        });
      }
    }
  }

  /**
   * Process economy (production, maintenance, etc.)
   */
  private async processEconomy(game: any, players: any[], series: any) {
    for (const player of players) {
      await this.calculatePlayerEconomy(player, game, series);
    }
  }

  /**
   * Calculate economy for a player
   */
  private async calculatePlayerEconomy(player: any, game: any, series: any) {
    const systems = await this.unitOfWork.systems.findByOwner(game._id, player.name);

    let totalMineral = 0;
    let totalFuel = 0;
    let totalAgriculture = 0;
    let totalPopulation = 0;

    for (const system of systems) {
      const production = Math.min(system.population, system.mineral);
      totalMineral += production;
      const fuelProduction = Math.min(system.population, system.fuel);
      totalFuel += fuelProduction;
      totalAgriculture += system.agriculture;
      totalPopulation += system.population;
    }

    const ships = await this.unitOfWork.ships.findByOwner(game._id, player.name);

    let buildCost = 0;
    let maintenanceCost = 0;
    let fuelUse = 0;

    for (const ship of ships) {
      if (ship.orders === 'build') {
        buildCost += ship.buildCost;
      } else {
        maintenanceCost += ship.maintenanceCost;
        fuelUse += ship.fuelCost || 0;
      }
    }

    const resourceUpdate = {
      mineral: Math.max(0, totalMineral - buildCost - maintenanceCost),
      fuel: Math.max(0, totalFuel - fuelUse),
      agriculture: totalAgriculture,
      population: totalPopulation
    };

    await this.unitOfWork.players.updatePlayerResources(player._id, resourceUpdate);

    const resourceTotal = totalMineral + totalFuel;
    const techDevelopment = resourceTotal > 0 ?
      ((resourceTotal - buildCost - maintenanceCost - fuelUse) / resourceTotal) * series.techMultiple : 0;

    await this.unitOfWork.players.updatePlayerTech(player._id, {
      techLevel: player.techLevel,
      techDevelopment,
      techs: player.techs
    });
  }

  /**
   * Check for game end conditions
   */
  private async checkGameEndConditions(game: any, players: any[]): Promise<{ gameEnded: boolean; message?: string }> {
    const activePlayers = players.filter(p => p.team > 0);

    if (activePlayers.length <= 1) {
      await this.unitOfWork.games.updateGameState(game._id, {
        status: 'completed',
        phase: 'finished'
      });

      const winner = activePlayers.length === 1 ? activePlayers[0].name : 'Draw';
      return {
        gameEnded: true,
        message: `Game ended. Winner: ${winner}`
      };
    }

    return { gameEnded: false };
  }

  /**
   * Update player statistics
   */
  private async updatePlayerStats(game: any, players: any[]) {
    for (const player of players) {
      const economicPower = Math.floor((player.mineral + player.fuel + player.agriculture) / 100);

      const ships = await this.unitOfWork.ships.findByOwner(game._id, player.name);
      const militaryShips = ships.filter((ship: any) => ship.orders !== 'build');
      const militaryPower = Math.floor(militaryShips.reduce((sum: number, ship: any) => sum + (ship.br * ship.br), 0) / 50);

      await this.unitOfWork.players.updatePlayerStats(player._id, {
        economicPower,
        militaryPower,
        maintenance: player.maintenance,
        build: player.build,
        fuelUse: player.fuelUse
      });
    }
  }
}
