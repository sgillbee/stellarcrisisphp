import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Game, Series, Message } from '../models';

const router = express.Router();

// Middleware to verify authentication and admin status
const requireAdmin = async (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get admin dashboard data
router.get('/dashboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();
    const activeGames = await Game.countDocuments({ status: 'active' });
    const totalSeries = await Series.countDocuments();

    // Recent activity
    const recentGames = await Game.find()
      .populate('seriesId')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      stats: {
        totalUsers,
        totalGames,
        activeGames,
        totalSeries
      },
      recentGames,
      recentUsers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Manage series
router.get('/series', requireAdmin, async (req: Request, res: Response) => {
  try {
    const series = await Series.find().sort({ createdAt: -1 });
    return res.json({ series });
  } catch (error) {
    console.error('Get series error:', error);
    return res.status(500).json({ error: 'Failed to get series' });
  }
});

// Create/edit series
router.post('/series', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, ...seriesData } = req.body;

    if (id) {
      // Update existing series
      const series = await Series.findByIdAndUpdate(id, seriesData, { new: true });
      return res.json({ success: true, series });
    } else {
      // Create new series
      const series = new Series(seriesData);
      await series.save();
      return res.json({ success: true, series });
    }
  } catch (error) {
    console.error('Save series error:', error);
    return res.status(500).json({ error: 'Failed to save series' });
  }
});

// Halt/resume series
router.post('/series/:id/toggle-halt', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    series.halted = !series.halted;
    await series.save();

    return res.json({
      success: true,
      message: `Series ${series.halted ? 'halted' : 'resumed'}`,
      series
    });
  } catch (error) {
    console.error('Toggle series halt error:', error);
    return res.status(500).json({ error: 'Failed to toggle series status' });
  }
});

// Manage games
router.get('/games', requireAdmin, async (req: Request, res: Response) => {
  try {
    const games = await Game.find()
      .populate('seriesId')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    return res.status(500).json({ error: 'Failed to get games' });
  }
});

// Kill game
router.post('/games/:id/kill', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    game.status = 'cancelled';
    await game.save();

    return res.json({
      success: true,
      message: 'Game cancelled successfully',
      game
    });
  } catch (error) {
    console.error('Kill game error:', error);
    return res.status(500).json({ error: 'Failed to cancel game' });
  }
});

// Trigger game update (for testing)
router.post('/games/:id/update', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { GameUpdateService } = await import('../services/game-update.js');

    const result = await GameUpdateService.triggerGameUpdate(id);
    return res.json(result);
  } catch (error) {
    console.error('Trigger update error:', error);
    return res.status(500).json({ error: 'Failed to trigger game update' });
  }
});

// Manage users
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user admin status
router.post('/users/:id/toggle-admin', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.isAdmin ? 'granted' : 'revoked'} admin status`,
      user
    });
  } catch (error) {
    console.error('Toggle admin error:', error);
    return res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Set MOTD
router.post('/motd', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    // Delete existing MOTD
    await Message.deleteMany({ type: 'motd' });

    // Create new MOTD
    const motd = new Message({
      type: 'motd',
      text: text,
      time: new Date()
    });

    await motd.save();

    return res.json({
      success: true,
      message: 'MOTD updated successfully',
      motd
    });
  } catch (error) {
    console.error('Set MOTD error:', error);
    return res.status(500).json({ error: 'Failed to update MOTD' });
  }
});

export default router;