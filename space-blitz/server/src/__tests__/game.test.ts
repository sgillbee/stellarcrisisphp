import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import test utilities FIRST to setup global mocks
import '../__tests__/test-utils';
import { createAuthHeaders } from '../__tests__/test-utils';
import { Game, Player, System, Ship, Message } from '../models';

import gameRouter from '../routes/game';

describe('Game Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/game', gameRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /game/list', () => {
    it('should return user\'s games', async () => {
      const mockGames = [
        { _id: 'game1', seriesName: 'Test Series', status: 'active' },
        { _id: 'game2', seriesName: 'Another Series', status: 'active' },
      ];

      // Mock the populate chain
      const mockPopulate = vi.fn().mockResolvedValue([
        { gameId: mockGames[0] },
        { gameId: mockGames[1] },
      ]);
      const mockFind = vi.fn().mockReturnValue({ populate: mockPopulate });

      (Player.find as any).mockImplementation(mockFind);

      const response = await request(app)
        .get('/game/list')
        .set(createAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.games).toEqual(mockGames);
    });
  });

  describe('GET /game/:gameId', () => {
    it('should return game details for valid player', async () => {
      const mockGame = {
        _id: 'game123',
        seriesId: 'series123',
        status: 'active',
      };

      const mockPlayer = {
        _id: 'player123',
        name: 'TestUser',
        team: 1,
      };

      const mockSystems = [{ _id: 'system1', name: 'Test System' }];
      const mockShips = [{ _id: 'ship1', type: 'Scout' }];
      const mockMessages = [{ _id: 'msg1', text: 'Test message' }];

      // Mock Game.findById().populate()
      const mockGamePopulate = vi.fn().mockResolvedValue(mockGame);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      (Player.findOne as any).mockResolvedValue(mockPlayer);
      (System.find as any).mockResolvedValue(mockSystems);
      (Ship.find as any).mockResolvedValue(mockShips);
      // Mock Message.find().sort().limit()
      const mockLimit = vi.fn().mockResolvedValue(mockMessages);
      const mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
      (Message.find as any).mockReturnValue({ sort: mockSort });

      const response = await request(app)
        .get('/game/game123')
        .set(createAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.game).toEqual(mockGame);
      expect(response.body.player).toEqual(mockPlayer);
      expect(response.body.systems).toEqual(mockSystems);
      expect(response.body.ships).toEqual(mockShips);
      expect(response.body.messages).toEqual(mockMessages);
    });

    it('should return 404 for non-existent game', async () => {
      // Mock Game.findById().populate() returning null
      const mockGamePopulate = vi.fn().mockResolvedValue(null);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      const response = await request(app)
        .get('/game/nonexistent')
        .set(createAuthHeaders());

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Game not found');
    });

    it('should return 403 for non-player', async () => {
      const mockGame = { _id: 'game123' };

      // Mock Game.findById().populate()
      const mockGamePopulate = vi.fn().mockResolvedValue(mockGame);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      (Player.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/game/game123')
        .set(createAuthHeaders());

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not a player in this game');
    });
  });

  describe('POST /game/:gameId/join', () => {
    it('should allow joining an open game', async () => {
      const mockGame = {
        _id: 'game123',
        seriesId: { maxPlayers: 8 },
        playerCount: 2,
        players: [],
        save: vi.fn().mockResolvedValue(undefined),
      };

      const mockPlayer = {
        _id: 'player123',
        gameId: 'game123',
        name: 'TestUser',
        team: 3,
        save: vi.fn().mockResolvedValue(undefined),
      };

      // Mock Game.findById().populate()
      const mockGamePopulate = vi.fn().mockResolvedValue(mockGame);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      (Player.findOne as any).mockResolvedValue(null);
      (Player.countDocuments as any).mockResolvedValue(2);
      // Player constructor will be called by the route, so we don't need to mock it

      const response = await request(app)
        .post('/game/game123/join')
        .set(createAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Joined game successfully');
    });

    it('should prevent joining full games', async () => {
      const mockGame = {
        _id: 'game123',
        seriesId: { maxPlayers: 4 },
      };

      // Mock Game.findById().populate()
      const mockGamePopulate = vi.fn().mockResolvedValue(mockGame);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      (Player.countDocuments as any).mockResolvedValue(4);

      const response = await request(app)
        .post('/game/game123/join')
        .set(createAuthHeaders());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Game is full');
    });

    it('should prevent rejoining games', async () => {
      const mockGame = { _id: 'game123' };
      const existingPlayer = { _id: 'player123', name: 'TestUser' };

      // Mock Game.findById().populate()
      const mockGamePopulate = vi.fn().mockResolvedValue(mockGame);
      (Game.findById as any).mockReturnValue({ populate: mockGamePopulate });

      (Player.findOne as any).mockResolvedValue(existingPlayer);

      const response = await request(app)
        .post('/game/game123/join')
        .set(createAuthHeaders());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Already in this game');
    });
  });

  describe('POST /game/:gameId/action', () => {
    it('should process valid game actions', async () => {
      const mockGame = { _id: 'game123', status: 'active' };
      const mockPlayer = { 
        _id: 'player123', 
        name: 'TestUser', 
        endedTurn: false,
        save: vi.fn().mockResolvedValue(undefined)
      };

      (Game.findById as any).mockResolvedValue(mockGame);
      (Player.findOne as any).mockResolvedValue(mockPlayer);

      const response = await request(app)
        .post('/game/game123/action')
        .set(createAuthHeaders())
        .send({ action: 'endTurn', data: {} });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid actions', async () => {
      const mockGame = { _id: 'game123', status: 'active' };
      const mockPlayer = { 
        _id: 'player123', 
        name: 'TestUser',
        save: vi.fn().mockResolvedValue(undefined)
      };

      (Game.findById as any).mockResolvedValue(mockGame);
      (Player.findOne as any).mockResolvedValue(mockPlayer);

      const response = await request(app)
        .post('/game/game123/action')
        .set(createAuthHeaders())
        .send({ action: 'invalidAction', data: {} });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Unknown action');
    });
  });
});
