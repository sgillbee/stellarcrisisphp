import express from 'express';
import { Request, Response } from 'express';
import { Tournament } from '../models';

const router = express.Router();

// Middleware to verify authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get tournament list
router.get('/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const tournaments = await Tournament.find({
      completed: false
    }).populate('series').sort({ startTime: -1 });

    return res.json({ tournaments });
  } catch (error) {
    console.error('Get tournament list error:', error);
    return res.status(500).json({ error: 'Failed to get tournaments' });
  }
});

// Get tournament details
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const tournament = await Tournament.findById(id).populate('seriesId');
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get entrants and games from embedded data
    const entrants = tournament.entrants || [];
    const games = tournament.games || [];

    // Check if user is registered
    const userEntrant = entrants.find((e: any) => e.empireId.toString() === user.userId);

    return res.json({
      tournament,
      entrants,
      games,
      isRegistered: !!userEntrant
    });
  } catch (error) {
    console.error('Get tournament details error:', error);
    return res.status(500).json({ error: 'Failed to get tournament details' });
  }
});

// Register for tournament
router.post('/:id/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if registration is open
    const now = new Date();
    const registrationDeadline = new Date(tournament.startTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before

    if (now > registrationDeadline) {
      return res.status(400).json({ error: 'Registration is closed' });
    }

    // Check if already registered
    const existingEntrant = tournament.entrants?.find((e: any) => e.empireId.toString() === user.userId);

    if (existingEntrant) {
      return res.status(400).json({ error: 'Already registered for this tournament' });
    }

    // Add entrant to tournament
    const newEntrant = {
      empireId: user.userId,
      empireName: user.name,
      eliminated: false,
      byes: 0
    };

    if (!tournament.entrants) {
      tournament.entrants = [];
    }
    tournament.entrants.push(newEntrant);

    await tournament.save();

    return res.json({
      success: true,
      message: 'Successfully registered for tournament',
      entrant: newEntrant
    });
  } catch (error) {
    console.error('Register for tournament error:', error);
    return res.status(500).json({ error: 'Failed to register for tournament' });
  }
});

// View tournament standings
router.get('/:id/standings', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get all games from embedded data
    const games = tournament.games || [];

    // Calculate standings based on wins
    const standings = new Map();

    for (const game of games) {
      if (game.winner) {
        const winner = game.winner.toString();
        if (!standings.has(winner)) {
          standings.set(winner, { name: winner, wins: 0, losses: 0 });
        }
        standings.get(winner).wins++;
      }

      // Also count losses
      if (game.firstEmpire && game.secondEmpire) {
        const loser = game.winner?.toString() === game.firstEmpire ? game.secondEmpire : game.firstEmpire;
        if (!standings.has(loser)) {
          standings.set(loser, { name: loser, wins: 0, losses: 0 });
        }
        standings.get(loser).losses++;
      }
    }

    const standingsArray = Array.from(standings.values())
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    return res.json({ standings: standingsArray });
  } catch (error) {
    console.error('Get tournament standings error:', error);
    return res.status(500).json({ error: 'Failed to get tournament standings' });
  }
});

export default router;