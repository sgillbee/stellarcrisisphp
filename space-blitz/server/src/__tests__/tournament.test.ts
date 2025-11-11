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

describe('Tournament Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import tournament router after mocks are set up
    const tournamentRouter = (await import('../routes/tournament')).default;
    
    app = express();
    app.use(express.json());
    app.use('/tournament', tournamentRouter);

    // Setup authenticated app with user
    setupAuthenticatedApp(app, 'test-user-id', 'TestUser');
  });

  describe('GET /tournament/list', () => {
    it('should return all tournaments', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournaments = [
        { _id: 'tournament1', name: 'Spring Championship', completed: false },
        { _id: 'tournament2', name: 'Winter Cup', completed: false }
      ];
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockTournaments)
      };
      
      (Tournament.find as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/tournament/list')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.tournaments).toEqual(mockTournaments);
    });
  });

  describe('GET /tournament/:id', () => {
    it('should return tournament details', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournament = {
        _id: 'tournament123',
        name: 'Test Tournament',
        entrants: [
          { empireId: 'test-user-id', empireName: 'TestUser', eliminated: false },
          { empireId: 'other-user', empireName: 'OtherUser', eliminated: false }
        ],
        games: []
      };
      
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockTournament)
      };
      
      (Tournament.findById as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/tournament/tournament123')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.tournament).toEqual(mockTournament);
      expect(response.body.entrants).toEqual(mockTournament.entrants);
      expect(response.body.games).toEqual([]);
      expect(response.body.isRegistered).toBe(true);
    });

    it('should return 404 for non-existent tournament', async () => {
      const { Tournament } = await import('../models');
      
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(null)
      };
      
      (Tournament.findById as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/tournament/nonexistent')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Tournament not found');
    });
  });

  describe('POST /tournament/:id/register', () => {
    it('should register user for tournament', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournament = {
        _id: 'tournament123',
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        entrants: [],
        save: vi.fn().mockResolvedValue(true)
      };
      
      (Tournament.findById as any).mockResolvedValue(mockTournament);

      const response = await request(app)
        .post('/tournament/tournament123/register')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully registered for tournament');
      expect(mockTournament.entrants).toHaveLength(1);
      expect(mockTournament.entrants[0].empireId).toBe('test-user-id');
      expect(mockTournament.entrants[0].empireName).toBe('TestUser');
      expect(mockTournament.save).toHaveBeenCalled();
    });

    it('should prevent duplicate registration', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournament = {
        _id: 'tournament123',
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        entrants: [{ empireId: 'test-user-id', empireName: 'TestUser' }]
      };
      
      (Tournament.findById as any).mockResolvedValue(mockTournament);

      const response = await request(app)
        .post('/tournament/tournament123/register')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Already registered for this tournament');
    });

    it('should prevent registration when deadline passed', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournament = {
        _id: 'tournament123',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now (less than 1 week)
        entrants: []
      };
      
      (Tournament.findById as any).mockResolvedValue(mockTournament);

      const response = await request(app)
        .post('/tournament/tournament123/register')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Registration is closed');
    });
  });

  describe('GET /tournament/:id/standings', () => {
    it('should return tournament standings', async () => {
      const { Tournament } = await import('../models');
      
      const mockTournament = {
        _id: 'tournament123',
        games: [
          { winner: 'user1', firstEmpire: 'user1', secondEmpire: 'user2' },
          { winner: 'user3', firstEmpire: 'user3', secondEmpire: 'user4' },
          { winner: 'user1', firstEmpire: 'user1', secondEmpire: 'user3' }
        ]
      };
      
      (Tournament.findById as any).mockResolvedValue(mockTournament);

      const response = await request(app)
        .get('/tournament/tournament123/standings')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(200);
      expect(response.body.standings).toBeDefined();
      expect(Array.isArray(response.body.standings)).toBe(true);
      // user1 should have 2 wins, user3 should have 1 win, others should have losses
      const user1Standing = response.body.standings.find((s: any) => s.name === 'user1');
      expect(user1Standing.wins).toBe(2);
    });

    it('should return 404 for non-existent tournament', async () => {
      const { Tournament } = await import('../models');
      (Tournament.findById as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/tournament/nonexistent/standings')
        .set(createAuthHeaders('test-user-id', 'TestUser'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Tournament not found');
    });
  });
});