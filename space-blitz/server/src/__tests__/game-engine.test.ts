import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameEngine } from '../game-engine';
import { IUnitOfWork } from '../repositories';

// Mock repositories
const mockUnitOfWork = {
  beginTransaction: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
  dispose: vi.fn().mockResolvedValue(undefined),
  games: {
    updateGameMetadata: vi.fn().mockResolvedValue(undefined),
    updateGameState: vi.fn().mockResolvedValue(undefined),
  },
  players: {
    findByGame: vi.fn(),
    updatePlayerResources: vi.fn().mockResolvedValue(undefined),
    updatePlayerTech: vi.fn().mockResolvedValue(undefined),
    updatePlayerStats: vi.fn().mockResolvedValue(undefined),
  },
  ships: {
    findShipsWithOrders: vi.fn(),
    findByGame: vi.fn(),
    findByOwner: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    destroyShips: vi.fn().mockResolvedValue(undefined),
  },
  systems: {
    findByOwner: vi.fn(),
    findByCoordinates: vi.fn(),
    colonizeSystem: vi.fn().mockResolvedValue(undefined),
  },
  messages: {
    createMessage: vi.fn().mockResolvedValue(undefined),
  },
  history: {
    createHistoryEntry: vi.fn().mockResolvedValue(undefined),
  },
};

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockGame: any;
  let mockSeries: any;
  let mockPlayers: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockUnitOfWork.beginTransaction.mockResolvedValue(undefined);
    mockUnitOfWork.commit.mockResolvedValue(undefined);
    mockUnitOfWork.rollback.mockResolvedValue(undefined);
    mockUnitOfWork.dispose.mockResolvedValue(undefined);

    gameEngine = new GameEngine(mockUnitOfWork as any);

    mockGame = {
      _id: 'game123',
      seriesId: 'series123',
      updateCount: 0,
      lastUpdate: new Date(),
    };

    mockSeries = {
      _id: 'series123',
      teamGame: false,
      techMultiple: 1.0,
    };

    mockPlayers = [
      {
        _id: 'player1',
        name: 'Player1',
        team: 1,
        mineral: 100,
        fuel: 50,
        agriculture: 25,
        population: 10,
        techLevel: 1,
        techs: [],
        maintenance: 0,
        build: 0,
        fuelUse: 0,
      },
      {
        _id: 'player2',
        name: 'Player2',
        team: 1,
        mineral: 100,
        fuel: 50,
        agriculture: 25,
        population: 10,
        techLevel: 1,
        techs: [],
        maintenance: 0,
        build: 0,
        fuelUse: 0,
      },
    ];

    // Setup default mock returns
    mockUnitOfWork.players.findByGame.mockResolvedValue(mockPlayers);
    mockUnitOfWork.ships.findShipsWithOrders.mockResolvedValue([]);
    mockUnitOfWork.ships.findByGame.mockResolvedValue([]);
    mockUnitOfWork.ships.findByOwner.mockResolvedValue([]);
    mockUnitOfWork.systems.findByOwner.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateGame', () => {
    it('should successfully update a game', async () => {
      const result = await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(true);
      expect(result.gameEnded).toBe(false);
      expect(mockUnitOfWork.games.updateGameMetadata).toHaveBeenCalledWith(
        'game123',
        { updateCount: 1, lastUpdate: expect.any(Date) }
      );
      expect(mockUnitOfWork.history.createHistoryEntry).toHaveBeenCalled();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should handle game end conditions', async () => {
      // Mock only one active player
      mockPlayers[0].team = -1; // Eliminated player

      const result = await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(true);
      expect(result.gameEnded).toBe(true);
      expect(mockUnitOfWork.games.updateGameState).toHaveBeenCalledWith('game123', {
        status: 'completed',
        phase: 'finished'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockUnitOfWork.games.updateGameMetadata.mockRejectedValue(new Error('Database error'));

      const result = await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(mockUnitOfWork.rollback).toHaveBeenCalled();
    });

    it('should process ship movements', async () => {
      const mockShips = [
        {
          _id: 'ship1',
          orders: 'move',
          orderArguments: 'system2',
          location: 'system1',
          fuel: 10,
          fuelCost: 2,
        },
      ];

      mockUnitOfWork.ships.findShipsWithOrders.mockResolvedValue(mockShips);

      await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockUnitOfWork.ships.update).toHaveBeenCalledWith('ship1', {
        _id: 'ship1',
        orders: 'move',
        orderArguments: 'system2',
        location: 'system2',
        fuel: 8,
        fuelCost: 2,
      });
    });

    it('should handle ship colonization', async () => {
      const mockShips = [
        {
          _id: 'ship1',
          orders: 'colonize',
          owner: 'Player1',
          location: 'system1',
        },
      ];

      const mockSystem = {
        _id: 'system1',
        owner: null,
        population: 0,
      };

      mockUnitOfWork.ships.findShipsWithOrders.mockResolvedValue(mockShips);
      mockUnitOfWork.systems.findByCoordinates.mockResolvedValue(mockSystem);

      await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockUnitOfWork.systems.colonizeSystem).toHaveBeenCalledWith('system1', 'Player1', 1);
      expect(mockUnitOfWork.ships.delete).toHaveBeenCalledWith('ship1');
    });

    it('should resolve combat between ships', async () => {
      const mockShips = [
        {
          _id: 'ship1',
          owner: 'Player1',
          location: 'system1',
          br: 5,
        },
        {
          _id: 'ship2',
          owner: 'Player2',
          location: 'system1',
          br: 3,
        },
      ];

      mockUnitOfWork.ships.findByGame.mockResolvedValue(mockShips);

      await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockUnitOfWork.ships.destroyShips).toHaveBeenCalledWith(['ship2']);
      expect(mockUnitOfWork.messages.createMessage).toHaveBeenCalled();
    });

    it('should calculate player economy', async () => {
      const mockSystems = [
        {
          owner: 'Player1',
          population: 5,
          mineral: 3,
          fuel: 4,
          agriculture: 2,
        },
      ];

      const mockShips = [
        {
          owner: 'Player1',
          orders: 'build',
          buildCost: 10,
          maintenanceCost: 5,
          fuelCost: 1,
        },
      ];

      mockUnitOfWork.systems.findByOwner.mockResolvedValue(mockSystems);
      mockUnitOfWork.ships.findByOwner.mockResolvedValue(mockShips);

      await gameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockUnitOfWork.players.updatePlayerResources).toHaveBeenCalled();
      expect(mockUnitOfWork.players.updatePlayerTech).toHaveBeenCalled();
    });
  });

  describe('processShipMovements', () => {
    it('should move ships to their destination', async () => {
      const mockShip = {
        _id: 'ship1',
        orders: 'move',
        orderArguments: 'system2',
        location: 'system1',
        fuel: 10,
        fuelCost: 2,
      };

      mockUnitOfWork.ships.findShipsWithOrders.mockResolvedValue([mockShip]);

      await gameEngine['processShipMovements'](mockGame, mockPlayers);

      expect(mockUnitOfWork.ships.update).toHaveBeenCalledWith('ship1', {
        _id: 'ship1',
        orders: 'move',
        orderArguments: 'system2',
        location: 'system2',
        fuel: 8,
        fuelCost: 2,
      });
    });

    it('should destroy ships that run out of fuel', async () => {
      const mockShip = {
        _id: 'ship1',
        orders: 'move',
        orderArguments: 'system2',
        location: 'system1',
        fuel: 1,
        fuelCost: 2,
      };

      mockUnitOfWork.ships.findShipsWithOrders.mockResolvedValue([mockShip]);

      await gameEngine['processShipMovements'](mockGame, mockPlayers);

      expect(mockUnitOfWork.ships.delete).toHaveBeenCalledWith('ship1');
    });
  });

  describe('processCombat', () => {
    it('should resolve battles between opposing ships', async () => {
      const mockShips = [
        { _id: 'ship1', owner: 'Player1', location: 'system1', br: 10 },
        { _id: 'ship2', owner: 'Player2', location: 'system1', br: 5 },
      ];

      mockUnitOfWork.ships.findByGame.mockResolvedValue(mockShips);

      await gameEngine['processCombat'](mockGame, mockPlayers);

      expect(mockUnitOfWork.ships.destroyShips).toHaveBeenCalledWith(['ship2']);
      expect(mockUnitOfWork.messages.createMessage).toHaveBeenCalled();
    });

    it('should handle ties by destroying all ships', async () => {
      const mockShips = [
        { _id: 'ship1', owner: 'Player1', location: 'system1', br: 5 },
        { _id: 'ship2', owner: 'Player2', location: 'system1', br: 5 },
      ];

      mockUnitOfWork.ships.findByGame.mockResolvedValue(mockShips);

      await gameEngine['processCombat'](mockGame, mockPlayers);

      expect(mockUnitOfWork.ships.destroyShips).toHaveBeenCalledWith(['ship1', 'ship2']);
    });
  });
});