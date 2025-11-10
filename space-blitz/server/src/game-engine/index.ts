import { Game, Series, Player, System, Ship, Message, History } from '../models';
import mongoose from 'mongoose';

/**
 * Core game engine for Space Blitz
 * Ports the PHP update_game function and related mechanics
 */

export interface GameUpdateResult {
  success: boolean;
  gameEnded: boolean;
  message?: string;
  error?: string;
}

export class GameEngine {
  /**
   * Main game update function - equivalent to PHP update_game()
   * Return values:
   * - 0: The game has updated and is now over
   * - 1: Regular update has occurred
   */
  static async updateGame(series: any, game: any, updateTime: Date): Promise<GameUpdateResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update game metadata
      game.updateCount += 1;
      game.lastUpdate = updateTime;

      await game.save({ session });

      // Create history entry
      const historyEntry = new History({
        gameId: game._id,
        seriesId: series._id,
        updateNumber: game.updateCount,
        timestamp: updateTime,
        type: 'update'
      });
      await historyEntry.save({ session });

      // Get all players in the game
      const players = await Player.find({ gameId: game._id }).session(session);

      // Check for team diplomacy (draw/surrender)
      if (series.teamGame) {
        const teamDiplomacyResult = await this.checkTeamDiplomacy(game, players, session);
        if (teamDiplomacyResult.gameEnded) {
          await session.commitTransaction();
          return { success: true, gameEnded: true, message: teamDiplomacyResult.message };
        }
      }

      // Process ship movements and orders
      await this.processShipMovements(game, players, session);

      // Process combat
      await this.processCombat(game, players, session);

      // Process production and economy
      await this.processEconomy(game, players, series, session);

      // Process technology development
      await this.processTechnology(game, players, series, session);

      // Check for game end conditions
      const gameEndResult = await this.checkGameEndConditions(game, players, session);
      if (gameEndResult.gameEnded) {
        await session.commitTransaction();
        return { success: true, gameEnded: true, message: gameEndResult.message };
      }

      // Update player statistics
      await this.updatePlayerStats(game, players, session);

      await session.commitTransaction();
      return { success: true, gameEnded: false };

    } catch (error) {
      await session.abortTransaction();
      console.error('Game update error:', error);
      return {
        success: false,
        gameEnded: false,
        error: error instanceof Error ? error.message : 'Unknown error during game update'
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Check for team diplomacy actions (draw/surrender)
   */
  private static async checkTeamDiplomacy(game: any, players: any[], session: any): Promise<{ gameEnded: boolean; message?: string }> {
    // Group players by team
    const teams = new Map<number, any[]>();
    for (const player of players) {
      if (!teams.has(player.team)) {
        teams.set(player.team, []);
      }
      teams.get(player.team)!.push(player);
    }

    // Check diplomacy offers between teams
    // This is a simplified version - full implementation would check diplomacy table
    const teamOffers = new Map<number, number>();

    // For now, assume no team diplomacy actions
    // TODO: Implement full diplomacy checking

    return { gameEnded: false };
  }

  /**
   * Process ship movements and orders
   */
  private static async processShipMovements(game: any, players: any[], session: any) {
    // Get all ships with orders
    const ships = await Ship.find({
      gameId: game._id,
      orders: { $ne: null }
    }).session(session);

    for (const ship of ships) {
      await this.processShipOrder(ship, game, session);
    }
  }

  /**
   * Process individual ship orders
   */
  private static async processShipOrder(ship: any, game: any, session: any) {
    switch (ship.orders) {
      case 'move':
        await this.moveShip(ship, session);
        break;
      case 'attack':
        // Combat is handled separately
        break;
      case 'build':
        // Building is handled in economy processing
        break;
      case 'colonize':
        await this.colonizeSystem(ship, game, session);
        break;
      default:
        // Unknown order - do nothing
        break;
    }
  }

  /**
   * Move a ship along its path
   */
  private static async moveShip(ship: any, session: any) {
    if (!ship.path || ship.path.length === 0) {
      return;
    }

    // Move to next system in path
    const nextSystem = ship.path.shift();
    ship.location = nextSystem;

    // Consume fuel
    if (ship.fuelCost > 0) {
      ship.fuel -= ship.fuelCost;
      if (ship.fuel < 0) {
        // Ship runs out of fuel - destroy it
        await Ship.findByIdAndDelete(ship._id).session(session);
        return;
      }
    }

    await ship.save({ session });
  }

  /**
   * Colonize a system
   */
  private static async colonizeSystem(ship: any, game: any, session: any) {
    // Check if system exists and is empty
    const system = await System.findOne({
      gameId: game._id,
      coordinates: ship.location
    }).session(session);

    if (!system || system.owner) {
      return; // Can't colonize
    }

    // Colonize the system
    system.owner = ship.owner;
    system.population = 1; // Start with 1 population
    await system.save({ session });

    // Destroy the colony ship
    await Ship.findByIdAndDelete(ship._id).session(session);
  }

  /**
   * Process combat between ships in the same system
   */
  private static async processCombat(game: any, players: any[], session: any) {
    // Group ships by location
    const shipsByLocation = new Map<string, any[]>();

    const allShips = await Ship.find({ gameId: game._id }).session(session);
    for (const ship of allShips) {
      const location = ship.location;
      if (!shipsByLocation.has(location)) {
        shipsByLocation.set(location, []);
      }
      shipsByLocation.get(location)!.push(ship);
    }

    // Process combat in each system
    for (const [location, ships] of shipsByLocation) {
      if (ships.length > 1) {
        // Check if there are ships from different players
        const owners = new Set(ships.map(s => s.owner));
        if (owners.size > 1) {
          await this.resolveCombat(ships, location, game, session);
        }
      }
    }
  }

  /**
   * Resolve combat between ships in a system
   */
  private static async resolveCombat(ships: any[], location: string, game: any, session: any) {
    // Group ships by owner
    const shipsByOwner = new Map<string, any[]>();
    for (const ship of ships) {
      if (!shipsByOwner.has(ship.owner)) {
        shipsByOwner.set(ship.owner, []);
      }
      shipsByOwner.get(ship.owner)!.push(ship);
    }

    // Simple combat resolution - destroy all ships from losing sides
    // TODO: Implement proper combat mechanics with BR, damage, etc.
    const owners = Array.from(shipsByOwner.keys());
    if (owners.length === 2) {
      const [owner1, owner2] = owners;
      const ships1 = shipsByOwner.get(owner1)!;
      const ships2 = shipsByOwner.get(owner2)!;

      // Calculate total BR for each side
      const br1 = ships1.reduce((sum, ship) => sum + ship.br, 0);
      const br2 = ships2.reduce((sum, ship) => sum + ship.br, 0);

      let winner: string;
      let loser: string;

      if (br1 > br2) {
        winner = owner1;
        loser = owner2;
      } else if (br2 > br1) {
        winner = owner2;
        loser = owner1;
      } else {
        // Tie - both sides lose
        await this.destroyShips(ships, session);
        return;
      }

      // Destroy losing ships
      const losingShips = shipsByOwner.get(loser)!;
      await this.destroyShips(losingShips, session);

      // Create battle report message
      const message = new Message({
        gameId: game._id,
        type: 'update',
        text: `Combat in ${location}: ${winner} defeated ${loser}`,
        time: new Date()
      });
      await message.save({ session });
    }
  }

  /**
   * Destroy ships
   */
  private static async destroyShips(ships: any[], session: any) {
    for (const ship of ships) {
      await Ship.findByIdAndDelete(ship._id).session(session);
    }
  }

  /**
   * Process economy (production, maintenance, etc.)
   */
  private static async processEconomy(game: any, players: any[], series: any, session: any) {
    for (const player of players) {
      await this.calculatePlayerEconomy(player, game, series, session);
    }
  }

  /**
   * Calculate economy for a player
   */
  private static async calculatePlayerEconomy(player: any, game: any, series: any, session: any) {
    // Get player's systems
    const systems = await System.find({
      gameId: game._id,
      owner: player.name
    }).session(session);

    let totalMineral = 0;
    let totalFuel = 0;
    let totalAgriculture = 0;
    let totalPopulation = 0;

    for (const system of systems) {
      // Calculate production based on population and resources
      const production = Math.min(system.population, system.mineral);
      totalMineral += production;

      const fuelProduction = Math.min(system.population, system.fuel);
      totalFuel += fuelProduction;

      totalAgriculture += system.agriculture;
      totalPopulation += system.population;
    }

    // Apply trade agreements (simplified)
    // TODO: Implement diplomacy-based trade bonuses

    // Calculate ship costs
    const ships = await Ship.find({
      gameId: game._id,
      owner: player.name
    }).session(session);

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

    // Update player economy stats
    player.mineral = Math.max(0, totalMineral - buildCost - maintenanceCost);
    player.fuel = Math.max(0, totalFuel - fuelUse);
    player.agriculture = totalAgriculture;
    player.population = totalPopulation;

    // Calculate ratios
    const totalResourceUse = buildCost + maintenanceCost + fuelUse;
    player.mineralRatio = totalResourceUse > 0 ? totalMineral / totalResourceUse : null;
    player.fuelRatio = fuelUse > 0 ? totalFuel / fuelUse : null;
    player.agricultureRatio = totalPopulation > 0 ? totalAgriculture / totalPopulation : 1;

    // Calculate tech development
    const resourceTotal = totalMineral + totalFuel;
    player.techDevelopment = resourceTotal > 0 ?
      ((resourceTotal - buildCost - maintenanceCost - fuelUse) / resourceTotal) * series.techMultiple : 0;

    await player.save({ session });
  }

  /**
   * Process technology development
   */
  private static async processTechnology(game: any, players: any[], series: any, session: any) {
    for (const player of players) {
      // Technology development is calculated in economy processing
      // Additional tech logic can be added here
    }
  }

  /**
   * Check for game end conditions
   */
  private static async checkGameEndConditions(game: any, players: any[], session: any): Promise<{ gameEnded: boolean; message?: string }> {
    // Check if only one player remains
    const activePlayers = players.filter(p => p.team > 0);

    if (activePlayers.length <= 1) {
      game.status = 'completed';
      game.phase = 'finished';
      await game.save({ session });

      const winner = activePlayers.length === 1 ? activePlayers[0].name : 'Draw';
      return {
        gameEnded: true,
        message: `Game ended. Winner: ${winner}`
      };
    }

    // Check for turn limits, etc.
    // TODO: Implement additional end conditions

    return { gameEnded: false };
  }

  /**
   * Update player statistics
   */
  private static async updatePlayerStats(game: any, players: any[], session: any) {
    for (const player of players) {
      // Calculate economic and military power
      player.economicPower = Math.floor((player.mineral + player.fuel + player.agriculture) / 100);

      // Calculate military power from ships
      const ships = await Ship.find({
        gameId: game._id,
        owner: player.name,
        orders: { $ne: 'build' }
      }).session(session);

      player.militaryPower = Math.floor(ships.reduce((sum, ship) => sum + (ship.br * ship.br), 0) / 50);

      await player.save({ session });
    }
  }
}