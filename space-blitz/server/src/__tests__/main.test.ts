import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import test utilities to setup global mocks
import '../__tests__/test-utils';
import { setupAuthenticatedApp, createAuthHeaders } from '../__tests__/test-utils';

import jwt from 'jsonwebtoken';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(() => 'hashed-password'),
    compare: vi.fn(() => true),
  },
}));

describe('Main Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import main router after mocks are set up
    const mainRouter = (await import('../routes/main')).default;
    
    app = express();
    app.use(express.json());
    app.use('/main', mainRouter);

    // Setup authenticated app with user
    setupAuthenticatedApp(app, 'test-user-id', 'TestUser');
  });

  describe('GET /main/page', () => {
    it('should return main page data', async () => {
      // Mock the required data
      const { User, Game, Message } = await import('../models');
      
      (User.countDocuments as any).mockResolvedValue(100);
      (Game.countDocuments as any).mockResolvedValue(25);
      
      const mockMotd = { type: 'motd', text: 'Welcome to Stellar Crisis!', createdAt: new Date() };
      (Message.findOne as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockMotd)
      });
      
      const mockGames = [
        { _id: 'game1', seriesId: 'series1', players: ['test-user-id'] },
        { _id: 'game2', seriesId: 'series2', players: ['test-user-id'] }
      ];
      
      const mockGameQuery = {
        populate: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockGames)
      };
      
      (Game.find as any).mockReturnValue(mockGameQuery);

      const response = await request(app)
        .get('/main/page')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.stats).toEqual({ totalPlayers: 100, activeGames: 25 });
      expect(response.body.motd).toBe('Welcome to Stellar Crisis!');
      expect(response.body.games).toEqual(mockGames);
    });
  });

  describe('GET /main/game-list', () => {
    it('should return game list', async () => {
      const { Series, Game } = await import('../models');
      
      const mockSeries = [
        { _id: 'series1', name: 'Test Series', halted: false },
        { _id: 'series2', name: 'Another Series', halted: false }
      ];
      
      (Series.find as any).mockResolvedValue(mockSeries);
      
      // Mock games for each series
      const mockGames1 = [{ _id: 'game1', seriesId: 'series1', status: 'active', playerCount: 4 }];
      const mockGames2 = [{ _id: 'game2', seriesId: 'series2', status: 'active', playerCount: 3 }];
      
      (Game.find as any).mockImplementation((query: any) => {
        if (query.seriesId === 'series1') {
          return {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(mockGames1)
          };
        } else if (query.seriesId === 'series2') {
          return {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(mockGames2)
          };
        }
        return { sort: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };
      });

      const response = await request(app)
        .get('/main/game-list')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.gameList).toHaveLength(2);
      expect(response.body.gameList[0].series).toEqual(mockSeries[0]);
      expect(response.body.gameList[0].games).toEqual(mockGames1);
    });
  });

  describe('POST /main/edit-profile', () => {
    it('should update user profile', async () => {
      const { User } = await import('../models');
      
      const mockUser = {
        _id: 'test-user-id',
        name: 'TestUser',
        icon: 'old-icon',
        drawBackground: false,
        backgroundAttachment: 'old-attachment',
        save: vi.fn().mockResolvedValue(true)
      };
      
      (User.findById as any).mockResolvedValue(mockUser);

      const updateData = {
        icon: 'new-icon',
        background: true,
        backgroundAttachment: 'new-attachment'
      };

      const response = await request(app)
        .post('/main/edit-profile')
        .set(createAuthHeaders('test-user-id', 'TestUser'))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUser.icon).toBe('new-icon');
      expect(mockUser.drawBackground).toBe(true);
      expect(mockUser.backgroundAttachment).toBe('new-attachment');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      const { User } = await import('../models');
      (User.findById as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/main/edit-profile')
        .set(createAuthHeaders('test-user-id', 'TestUser'))
        .send({ icon: 'new-icon' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /main/custom-series', () => {
    it('should return custom series', async () => {
      const { Series } = await import('../models');
      
      const mockSeries = [
        { _id: 'series1', name: 'Custom Series 1', custom: true, halted: false },
        { _id: 'series2', name: 'Custom Series 2', custom: true, halted: false }
      ];
      
      (Series.find as any).mockResolvedValue(mockSeries);

      const response = await request(app)
        .get('/main/custom-series')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.series).toEqual(mockSeries);
    });
  });

  describe('POST /main/create-series', () => {
    it('should create a custom series', async () => {
      const { Series } = await import('../models');
      
      const mockSeries = {
        _id: 'new-series-id',
        name: 'New Custom Series',
        custom: true,
        creator: 'TestUser',
        save: vi.fn().mockResolvedValue(true)
      };
      
      // Mock the Series constructor
      const SeriesMock = vi.fn(() => mockSeries);
      (Series as any).mockImplementation(SeriesMock);

      const seriesData = {
        name: 'New Custom Series',
        description: 'A test series'
      };

      const response = await request(app)
        .post('/main/create-series')
        .set(createAuthHeaders('test-user-id', 'TestUser'))
        .send(seriesData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.series).toEqual({
        _id: 'new-series-id',
        name: 'New Custom Series',
        custom: true,
        creator: 'TestUser'
      });
      expect(SeriesMock).toHaveBeenCalledWith({
        ...seriesData,
        creator: 'TestUser',
        custom: true
      });
      expect(mockSeries.save).toHaveBeenCalled();
    });
  });
});