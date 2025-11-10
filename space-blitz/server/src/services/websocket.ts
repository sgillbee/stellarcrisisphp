import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Game } from '../models';

/**
 * WebSocket service for real-time game updates
 */
export class WebSocketService {
  private io: SocketIOServer;
  private gameRooms: Map<string, Set<string>> = new Map(); // gameId -> Set of socket IDs

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Authenticate socket connection
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
          socket.data.userId = decoded.userId;
          socket.data.userName = decoded.name;
          console.log(`Socket ${socket.id} authenticated for user ${decoded.name}`);
        } catch (error) {
          socket.emit('authentication_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join game room
      socket.on('join_game', async (gameId: string) => {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          // Verify user is in the game
          const game = await Game.findById(gameId);
          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          // Check if user is a player in this game
          const isPlayer = game.players.some((playerId: any) =>
            playerId.toString() === socket.data.userId
          );

          if (!isPlayer) {
            socket.emit('error', { message: 'Not a player in this game' });
            return;
          }

          // Join the game room
          socket.join(`game_${gameId}`);

          // Track socket in game room
          if (!this.gameRooms.has(gameId)) {
            this.gameRooms.set(gameId, new Set());
          }
          this.gameRooms.get(gameId)!.add(socket.id);

          socket.emit('joined_game', { gameId });
          console.log(`User ${socket.data.userName} joined game ${gameId}`);

        } catch (error) {
          console.error('Error joining game:', error);
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      // Leave game room
      socket.on('leave_game', (gameId: string) => {
        socket.leave(`game_${gameId}`);

        // Remove from tracking
        const roomSockets = this.gameRooms.get(gameId);
        if (roomSockets) {
          roomSockets.delete(socket.id);
          if (roomSockets.size === 0) {
            this.gameRooms.delete(gameId);
          }
        }

        console.log(`User ${socket.data.userName} left game ${gameId}`);
      });

      // Game actions
      socket.on('game_action', async (data: { gameId: string; action: string; payload: any }) => {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { gameId, action, payload } = data;

        // Verify user is in the game room
        if (!socket.rooms.has(`game_${gameId}`)) {
          socket.emit('error', { message: 'Not in game room' });
          return;
        }

        try {
          // Process game action
          const result = await this.processGameAction(socket.data.userId, gameId, action, payload);

          if (result.success) {
            // Broadcast action result to all players in the game
            this.io.to(`game_${gameId}`).emit('game_update', {
              action,
              payload: result.data,
              timestamp: new Date()
            });
          } else {
            socket.emit('action_error', { message: result.message });
          }
        } catch (error) {
          console.error('Game action error:', error);
          socket.emit('error', { message: 'Action failed' });
        }
      });

      // Send message to game
      socket.on('send_message', async (data: { gameId: string; message: string; type?: string }) => {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { gameId, message, type = 'game' } = data;

        if (!socket.rooms.has(`game_${gameId}`)) {
          socket.emit('error', { message: 'Not in game room' });
          return;
        }

        // Broadcast message to game room
        this.io.to(`game_${gameId}`).emit('new_message', {
          sender: socket.data.userName,
          message,
          type,
          timestamp: new Date()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from all game rooms
        for (const [gameId, sockets] of this.gameRooms) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.gameRooms.delete(gameId);
            }
          }
        }
      });
    });
  }

  /**
   * Process a game action
   */
  private async processGameAction(userId: string, gameId: string, action: string, payload: any) {
    try {
      switch (action) {
        case 'end_turn':
          // TODO: Implement end turn logic
          return { success: true, data: { action: 'turn_ended', player: userId } };

        case 'move_ship':
          // TODO: Implement ship movement
          return { success: true, data: { action: 'ship_moved', shipId: payload.shipId, destination: payload.destination } };

        case 'build_ship':
          // TODO: Implement ship building
          return { success: true, data: { action: 'ship_built', systemId: payload.systemId, shipType: payload.shipType } };

        default:
          return { success: false, message: 'Unknown action' };
      }
    } catch (error) {
      console.error('Process game action error:', error);
      return { success: false, message: 'Action processing failed' };
    }
  }

  /**
   * Broadcast game update to all players in a game
   */
  broadcastToGame(gameId: string, event: string, data: any): void {
    this.io.to(`game_${gameId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId: string, event: string, data: any): void {
    // Find all sockets for this user
    const sockets = Array.from(this.io.sockets.sockets.values())
      .filter(socket => socket.data.userId === userId);

    sockets.forEach(socket => {
      socket.emit(event, {
        ...data,
        timestamp: new Date()
      });
    });
  }

  /**
   * Get connected players for a game
   */
  getConnectedPlayers(gameId: string): string[] {
    const roomSockets = this.gameRooms.get(gameId);
    if (!roomSockets) return [];

    const players = new Set<string>();
    for (const socketId of roomSockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket?.data.userName) {
        players.add(socket.data.userName);
      }
    }

    return Array.from(players);
  }
}