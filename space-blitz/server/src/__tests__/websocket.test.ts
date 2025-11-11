import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import test utilities to setup global mocks
import '../__tests__/test-utils';

// Import after mocks
import { WebSocketService } from '../services/websocket';

describe('WebSocketService', () => {
  let mockIo: any;
  let wsService: WebSocketService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a simple mock IO server
    mockIo = {
      on: vi.fn(),
      to: vi.fn(() => ({ emit: vi.fn() })),
      emit: vi.fn(),
      sockets: {
        sockets: new Map(),
        adapter: {
          rooms: new Map(),
        },
      },
    };
    wsService = new WebSocketService(mockIo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with socket.io server', () => {
      expect(wsService).toBeDefined();
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('broadcastToGame', () => {
    it('should broadcast message to game room', () => {
      wsService.broadcastToGame('game123', 'test_event', { data: 'test' });

      expect(mockIo.to).toHaveBeenCalledWith('game_game123');
    });
  });

  describe('notifyUser', () => {
    it('should send notification to specific user', () => {
      const mockSocket = {
        id: 'socket123',
        data: { userId: 'user123' },
        emit: vi.fn(),
      };

      // Add socket to the mock server
      mockIo.sockets.sockets.set('socket123', mockSocket);

      wsService.notifyUser('user123', 'notification', { message: 'test' });

      expect(mockSocket.emit).toHaveBeenCalledWith('notification', expect.objectContaining({ message: 'test' }));
    });
  });

  describe('getConnectedPlayers', () => {
    it('should return connected players for a game', () => {
      const mockSocket1 = {
        id: 'socket1',
        data: { userId: 'user1', userName: 'User1' },
        rooms: new Set(['game_game123']),
      };
      const mockSocket2 = {
        id: 'socket2',
        data: { userId: 'user2', userName: 'User2' },
        rooms: new Set(['game_game123']),
      };

      mockIo.sockets.sockets.set('socket1', mockSocket1);
      mockIo.sockets.sockets.set('socket2', mockSocket2);

      // Manually add to gameRooms since the join_game logic isn't mocked
      (wsService as any).gameRooms.set('game123', new Set(['socket1', 'socket2']));

      const connectedPlayers = wsService.getConnectedPlayers('game123');

      expect(connectedPlayers).toHaveLength(2);
      expect(connectedPlayers).toContain('User1');
      expect(connectedPlayers).toContain('User2');
    });

    it('should return empty array for game with no connected players', () => {
      const connectedPlayers = wsService.getConnectedPlayers('emptygame');

      expect(connectedPlayers).toEqual([]);
    });
  });
});