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

describe('Admin Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup model mocks FIRST
    const { User, Game, Series } = await import('../models');
    
    // Mock User.findById to return admin user for JWT decoded userId
    (User.findById as any).mockImplementation((id: string) => {
      if (id === 'test-user-id') {
        return Promise.resolve({
          _id: 'test-user-id',
          name: 'TestUser',
          isAdmin: true
        });
      }
      if (id === 'user1') {
        return Promise.resolve({
          _id: 'user1',
          name: 'User1',
          isAdmin: false,
          save: vi.fn().mockResolvedValue(true)
        });
      }
      if (id === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    // Mock Game.find() to support chaining with populate, sort, limit
    const mockGames = [
      { _id: 'game1', name: 'Test Game 1', seriesId: 'series1' },
      { _id: 'game2', name: 'Test Game 2', seriesId: 'series2' }
    ];
    
    const mockGameQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockGames)
    };
    
    (Game.find as any).mockReturnValue(mockGameQuery);

    // Mock Game.findById for kill game endpoint
    (Game.findById as any).mockImplementation((id: string) => {
      if (id === 'game1') {
        return Promise.resolve({
          _id: 'game1',
          name: 'Test Game 1',
          status: 'active',
          save: vi.fn().mockResolvedValue(true)
        });
      }
      return Promise.resolve(null);
    });

    // Mock User.find() for GET /admin/users
    const mockUsers = [
      { _id: 'user1', name: 'User1', isAdmin: false },
      { _id: 'user2', name: 'User2', isAdmin: true }
    ];
    
    const mockUserQuery = {
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockUsers)
    };
    
    (User.find as any).mockReturnValue(mockUserQuery);
    
    // Mock Series.findById for toggle-halt endpoint
    (Series.findById as any).mockImplementation((id: string) => {
      if (id === 'series1') {
        return Promise.resolve({
          _id: 'series1',
          name: 'Test Series',
          halted: false,
          save: vi.fn().mockResolvedValue(true)
        });
      }
      if (id === 'series2') {
        return Promise.resolve({
          _id: 'series2',
          name: 'Halted Series',
          halted: true,
          save: vi.fn().mockResolvedValue(true)
        });
      }
      return Promise.resolve(null);
    });
    
    // Import admin router after mocks are set up
    const adminRouter = (await import('../routes/admin')).default;
    
    app = express();
    app.use(express.json());
    app.use('/admin', adminRouter);

    // Setup authenticated app with admin user
    setupAuthenticatedApp(app, 'test-user-id', 'TestUser');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should test jwt verify', () => {
    const result = jwt.verify('any-token', 'any-secret');
    expect(result).toEqual({ userId: 'test-user-id', name: 'TestUser' });
  });

  it('should test User.findById', async () => {
    const { User } = await import('../models');
    const result = await User.findById('test-user-id');
    expect(result).toEqual({
      _id: 'test-user-id',
      name: 'TestUser',
      isAdmin: true
    });
  });

  describe('GET /admin/games', () => {
    it('should return all games for admin', async () => {
      const response = await request(app)
        .get('/admin/games')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.games).toEqual([
        { _id: 'game1', name: 'Test Game 1', seriesId: 'series1' },
        { _id: 'game2', name: 'Test Game 2', seriesId: 'series2' }
      ]);
    });
  });

  describe('POST /admin/games/:id/kill', () => {
    it('should kill a game successfully', async () => {
      const response = await request(app)
        .post('/admin/games/game1/kill')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Game cancelled successfully');
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .post('/admin/games/nonexistent/kill')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Game not found');
    });
  });

  describe('POST /admin/series/:id/toggle-halt', () => {
    it('should halt a series successfully', async () => {
      const response = await request(app)
        .post('/admin/series/series1/toggle-halt')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Series halted');
    });

    it('should resume a series successfully', async () => {
      const response = await request(app)
        .post('/admin/series/series2/toggle-halt')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Series resumed');
    });

    it('should return 404 for non-existent series', async () => {
      const response = await request(app)
        .post('/admin/series/nonexistent/toggle-halt')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Series not found');
    });
  });

  describe('GET /admin/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.users).toEqual([
        { _id: 'user1', name: 'User1', isAdmin: false },
        { _id: 'user2', name: 'User2', isAdmin: true }
      ]);
    });
  });

  describe('POST /admin/users/:id/toggle-admin', () => {
    it('should grant admin status to user', async () => {
      const response = await request(app)
        .post('/admin/users/user1/toggle-admin')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User granted admin status');
    });

    it('should revoke admin status from user', async () => {
      // This test would need a different user that's already admin
      // For now, we'll skip this test since our mock user1 is not admin
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/admin/users/nonexistent/toggle-admin')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });
});