import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameEngine } from '../game-engine';
import { Game, Series, Player, System, Ship } from '../models';

// Import test utilities to setup global mocks
import '../__tests__/test-utils';

// Mock mongoose models with proper chaining support
vi.mock('../models', () => ({
  Game: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
  Series: {
    findById: vi.fn(),
  },
  Player: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
  System: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
  Ship: {
    find: vi.fn(() => ({
      session: vi.fn().mockReturnThis(),
    })),
    findByIdAndDelete: vi.fn((id) => ({
      session: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

describe('GameEngine', () => {
  let mockGame: any;
  let mockSeries: any;
  let mockPlayers: any[];
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    };

    mockGame = {
      _id: 'game123',
      seriesId: 'series123',
      updateCount: 0,
      lastUpdate: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
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
        endedTurn: false,
        save: vi.fn().mockResolvedValue(undefined),
      },
    ];

    // Setup default mocks
    (Game.findById as any).mockResolvedValue(mockGame);
    (Series.findById as any).mockResolvedValue(mockSeries);
    (Player.find as any).mockResolvedValue(mockPlayers);
    
    // Mock Ship.find to return a query that supports .session()
    const mockShipQuery = {
      session: vi.fn().mockResolvedValue([]),
    };
    (Ship.find as any).mockReturnValue(mockShipQuery);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateGame', () => {
    it('should successfully update a game', async () => {
      const result = await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(true);
      expect(result.gameEnded).toBe(false);
      expect(mockGame.updateCount).toBe(1);
      expect(mockGame.save).toHaveBeenCalled();
    });

    it('should handle game end conditions', async () => {
      // Mock only one active player
      mockPlayers[0].team = -1; // Eliminated player

      const result = await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(true);
      expect(result.gameEnded).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockGame.save.mockRejectedValue(new Error('Database error'));

      const result = await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should process ship movements', async () => {
      const mockShips = [
        {
          _id: 'ship1',
          orders: 'move',
          path: ['system1', 'system2'],
          location: 'system1',
          fuel: 10,
          fuelCost: 2,
          save: vi.fn().mockResolvedValue(undefined),
        },
      ];

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);

      await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockShips[0].location).toBe('system2');
      expect(mockShips[0].fuel).toBe(8);
      expect(mockShips[0].save).toHaveBeenCalled();
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
        owner: null,
        population: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (System.findOne as any).mockResolvedValue(mockSystem);

      await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockSystem.owner).toBe('Player1');
      expect(mockSystem.population).toBe(1);
      expect(mockSystem.save).toHaveBeenCalled();
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

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (Ship.findByIdAndDelete as any).mockResolvedValue(undefined);

      await GameEngine.updateGame(mockSeries, mockGame, new Date());

      // The weaker ship should be destroyed
      expect(Ship.findByIdAndDelete).toHaveBeenCalledWith('ship2');
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
        },
      ];

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (System.find as any).mockResolvedValue(mockSystems);

      await GameEngine.updateGame(mockSeries, mockGame, new Date());

      expect(mockPlayers[0].mineral).toBeDefined();
      expect(mockPlayers[0].fuel).toBeDefined();
      expect(mockPlayers[0].agriculture).toBeDefined();
      expect(mockPlayers[0].save).toHaveBeenCalled();
    });
  });

  describe('processShipMovements', () => {
    it('should move ships along their path', async () => {
      const mockShip = {
        _id: 'ship1',
        orders: 'move',
        path: ['system1', 'system2', 'system3'],
        location: 'system1',
        fuel: 10,
        fuelCost: 2,
        save: vi.fn().mockResolvedValue(undefined),
      };

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue([mockShip]),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);

      await (GameEngine as any).processShipMovements(mockGame, mockPlayers, mockSession);

      expect(mockShip.location).toBe('system2');
      expect(mockShip.fuel).toBe(8);
      expect(mockShip.save).toHaveBeenCalled();
    });

    it('should destroy ships that run out of fuel', async () => {
      const mockShip = {
        _id: 'ship1',
        orders: 'move',
        path: ['system1', 'system2'],
        location: 'system1',
        fuel: 1,
        fuelCost: 2,
        save: vi.fn().mockResolvedValue(undefined),
      };

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue([mockShip]),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (Ship.findByIdAndDelete as any).mockResolvedValue(undefined);

      await (GameEngine as any).processShipMovements(mockGame, mockPlayers, mockSession);

      expect(Ship.findByIdAndDelete).toHaveBeenCalledWith('ship1');
    });
  });

  describe('processCombat', () => {
    it('should resolve battles between opposing ships', async () => {
      const mockShips = [
        { _id: 'ship1', owner: 'Player1', location: 'system1', br: 10 },
        { _id: 'ship2', owner: 'Player2', location: 'system1', br: 5 },
      ];

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (Ship.findByIdAndDelete as any).mockResolvedValue(undefined);

      await (GameEngine as any).processCombat(mockGame, mockPlayers, mockSession);

      expect(Ship.findByIdAndDelete).toHaveBeenCalledWith('ship2');
    });

    it('should handle ties by destroying all ships', async () => {
      const mockShips = [
        { _id: 'ship1', owner: 'Player1', location: 'system1', br: 5 },
        { _id: 'ship2', owner: 'Player2', location: 'system1', br: 5 },
      ];

      // Mock Ship.find to return ships with session
      const mockShipQuery = {
        session: vi.fn().mockResolvedValue(mockShips),
      };
      (Ship.find as any).mockReturnValue(mockShipQuery);
      
      (Ship.findByIdAndDelete as any).mockResolvedValue(undefined);

      await (GameEngine as any).processCombat(mockGame, mockPlayers, mockSession);

      expect(Ship.findByIdAndDelete).toHaveBeenCalledTimes(2);
    });
  });
});