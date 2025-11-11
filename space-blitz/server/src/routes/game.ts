import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Game, Player, Series, System, Ship, Message } from '../models';

const router = express.Router();

// Middleware to verify authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get game list for user
router.get('/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Find all games where the user is a player
    const players = await Player.find({ name: user.name }).populate('gameId');
    const games = players.map(p => p.gameId).filter(g => g);

    return res.json({ games });
  } catch (error) {
    console.error('Get game list error:', error);
    return res.status(500).json({ error: 'Failed to get game list' });
  }
});

// Get game details
router.get('/:gameId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const user = (req as any).user;

    const game = await Game.findById(gameId).populate('seriesId');
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = await Player.findOne({ gameId, name: user.name });
    if (!player) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    // Get game data
    const systems = await System.find({ gameId });
    const ships = await Ship.find({ gameId });
    const messages = await Message.find({ gameId }).sort({ time: -1 }).limit(50);

    return res.json({
      game,
      player,
      systems,
      ships,
      messages
    });
  } catch (error) {
    console.error('Get game details error:', error);
    return res.status(500).json({ error: 'Failed to get game details' });
  }
});

// Join a game
router.post('/:gameId/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const user = (req as any).user;

    const game = await Game.findById(gameId).populate('seriesId');
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is already in the game
    const existingPlayer = await Player.findOne({ gameId, name: user.name });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Already in this game' });
    }

    // Check if game is full
    const playerCount = await Player.countDocuments({ gameId });
    const series = game.seriesId as any; // Populated series
    if (playerCount >= series.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Create player record
    const player = new Player({
      gameId,
      name: user.name,
      team: playerCount + 1, // Simple team assignment
      // Other player fields will be initialized by game logic
    });

    await player.save();

    // Update game player count
    game.playerCount = playerCount + 1;
    await game.save();

    return res.json({
      success: true,
      message: 'Joined game successfully',
      player
    });
  } catch (error) {
    console.error('Join game error:', error);
    return res.status(500).json({ error: 'Failed to join game' });
  }
});

// Submit game action (move ships, build, etc.)
router.post('/:gameId/action', requireAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { action, data } = req.body;
    const user = (req as any).user;

    const game = await Game.findById(gameId);
    const player = await Player.findOne({ gameId, name: user.name });

    if (!game || !player) {
      return res.status(404).json({ error: 'Game or player not found' });
    }

    // TODO: Implement game action logic based on action type
    // This will be expanded as we port the PHP game logic

    switch (action) {
      case 'endTurn':
        player.endedTurn = true;
        await player.save();
        break;
      case 'moveShip':
        // TODO: Implement ship movement
        break;
      case 'buildShip':
        // TODO: Implement ship building
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    return res.json({ success: true, message: 'Action processed' });
  } catch (error) {
    console.error('Game action error:', error);
    return res.status(500).json({ error: 'Failed to process action' });
  }
});

export default router;