import { vi } from 'vitest';

// Global test utilities for mocking common dependencies

// Mock JWT globally
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(() => ({ userId: 'test-user-id', name: 'TestUser' })),
  },
}));

// Mock bcrypt globally
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(() => 'hashed-password'),
    compare: vi.fn(() => true),
  },
}));

// Mock Socket.IO server
vi.mock('socket.io', () => ({
  Server: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
    sockets: {
      sockets: new Map(),
      adapter: {
        rooms: new Map(),
      },
    },
  })),
}));

// Mock Mongoose models with proper constructor support
export const createMockModel = () => {
  const mockInstance = {
    save: vi.fn(),
    remove: vi.fn(),
    toObject: vi.fn(),
    populate: vi.fn().mockReturnThis(),
  };

  const mockModel = Object.assign(vi.fn(() => mockInstance), {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    session: vi.fn().mockReturnThis(),
  });

  return mockModel;
};

// Mock all models
vi.mock('../models', () => ({
  User: createMockModel(),
  Game: createMockModel(),
  Player: createMockModel(),
  Series: createMockModel(),
  System: createMockModel(),
  Ship: createMockModel(),
  Message: createMockModel(),
  Tournament: createMockModel(),
}));

// Helper to create authenticated request headers
export const createAuthHeaders = (userId = 'test-user-id', name = 'TestUser') => ({
  Authorization: `Bearer mock-jwt-token-${userId}-${name}`,
});

// Helper to setup authenticated app for testing
export const setupAuthenticatedApp = (app: any, userId = 'test-user-id', name = 'TestUser') => {
  // JWT is already globally mocked, just return the app
  return app;
};