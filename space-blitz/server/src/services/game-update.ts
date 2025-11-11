import { Game, Series } from '../models';
import { GameEngine } from '../game-engine';
import { RepositoryFactory } from '../repositories';

/**
 * Service for managing game updates and scheduling
 */
export class GameUpdateService {
  /**
   * Check for games that need updating and process them
   */
  static async checkForUpdates(): Promise<void> {
    try {
      // Find games that need updating
      const gamesNeedingUpdate = await Game.find({
        status: 'active',
        playerCount: { $gt: 1 },
        $expr: {
          $gt: [
            { $add: ['$lastUpdate', { $multiply: ['$updateTime', 1000] }] },
            new Date()
          ]
        }
      }).populate('seriesId');

      for (const game of gamesNeedingUpdate) {
        await this.processGameUpdate(game);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Process a single game update
   */
  static async processGameUpdate(game: any): Promise<void> {
    const unitOfWork = RepositoryFactory.createUnitOfWork();
    const gameEngine = new GameEngine(unitOfWork);

    try {
      const series = game.seriesId;
      const updateTime = new Date();

      console.log(`Processing update for game ${game._id} (${game.seriesName} ${game.gameNumber})`);

      const result = await gameEngine.updateGame(series, game, updateTime);

      if (result.success) {
        if (result.gameEnded) {
          console.log(`Game ${game._id} has ended: ${result.message}`);
        } else {
          console.log(`Game ${game._id} updated successfully`);
        }
      } else {
        console.error(`Game ${game._id} update failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error processing game ${game._id}:`, error);
    } finally {
      await unitOfWork.dispose();
    }
  }

  /**
   * Manually trigger an update for a specific game (for testing/admin purposes)
   */
  static async triggerGameUpdate(gameId: string): Promise<{ success: boolean; message: string }> {
    const unitOfWork = RepositoryFactory.createUnitOfWork();
    const gameEngine = new GameEngine(unitOfWork);

    try {
      const game = await Game.findById(gameId).populate('seriesId');
      if (!game) {
        return { success: false, message: 'Game not found' };
      }

      if (game.status !== 'active') {
        return { success: false, message: 'Game is not active' };
      }

      await this.processGameUpdate(game);
      return { success: true, message: 'Game update triggered successfully' };
    } catch (error) {
      console.error('Error triggering game update:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await unitOfWork.dispose();
    }
  }

  /**
   * Get games that are ready for update
   */
  static async getPendingUpdates(): Promise<any[]> {
    try {
      const now = new Date();
      const games = await Game.find({
        status: 'active',
        playerCount: { $gt: 1 },
        $expr: {
          $lt: ['$lastUpdate', { $subtract: [now, { $multiply: ['$updateTime', 1000] }] }]
        }
      }).populate('seriesId');

      return games;
    } catch (error) {
      console.error('Error getting pending updates:', error);
      return [];
    }
  }

  /**
   * Start the automatic update scheduler
   */
  static startScheduler(): void {
    // Check for updates every minute
    setInterval(() => {
      this.checkForUpdates();
    }, 60 * 1000);

    console.log('Game update scheduler started');
  }
}