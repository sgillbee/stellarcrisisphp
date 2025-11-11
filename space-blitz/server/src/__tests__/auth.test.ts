import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import test utilities to setup global mocks
import '../__tests__/test-utils';
import { createAuthHeaders } from '../__tests__/test-utils';

import authRouter from '../routes/auth';
import { User } from '../models';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'TestUser',
        password: 'hashedPassword',
        icon: 'alien1.gif',
        isAdmin: false,
        lastLogin: new Date(),
        save: vi.fn().mockResolvedValue(undefined),
      };

      (User.findOne as any).mockResolvedValue(mockUser);
      (jwt.sign as any).mockReturnValue('mockToken');

      const response = await request(app)
        .post('/auth/login')
        .send({ name: 'TestUser', pass: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mockToken');
      expect(response.body.user.name).toBe('TestUser');
    });

    it('should return error for non-existent user', async () => {
      (User.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({ name: 'NonExistentUser', pass: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('createEmpire');
    });

    it('should return error for invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'TestUser',
        password: 'hashedPassword',
      };

      (User.findOne as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({ name: 'TestUser', pass: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid password');
    });

    it('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing credentials');
    });
  });

  describe('POST /auth/create-empire', () => {
    it('should create new empire successfully', async () => {
      const mockUser = new User({
        _id: 'user123',
        name: 'NewUser',
        password: 'hashedPassword',
        icon: 'alien1.gif',
        isAdmin: false,
        save: vi.fn().mockResolvedValue(undefined),
      });

      (User.findOne as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      (jwt.sign as any).mockReturnValue('mockToken');

      const response = await request(app)
        .post('/auth/create-empire')
        .send({ name: 'NewUser', pass: 'password123', email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('NewUser');
    });

    it('should return error for existing empire name', async () => {
      const existingUser = { _id: 'user123', name: 'ExistingUser' };
      (User.findOne as any).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/auth/create-empire')
        .send({ name: 'ExistingUser', pass: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Empire exists');
    });
  });

  describe('POST /auth/logout', () => {
    it('should handle logout request', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});