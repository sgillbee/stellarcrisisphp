import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Game, Series, Message } from '../models';

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

// Get main page data (game list, stats, MOTD)
router.get('/page', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get quick stats
    const totalPlayers = await User.countDocuments();
    const activeGames = await Game.countDocuments({ status: 'active' });

    // Get MOTD (Message of the Day)
    const motd = await Message.findOne({ type: 'motd' }).sort({ createdAt: -1 });

    // Get user's games
    const userGames = await Game.find({
      players: { $in: [user.userId] }
    }).populate('seriesId').limit(20);

    return res.json({
      stats: {
        totalPlayers,
        activeGames
      },
      motd: motd ? motd.text : null,
      games: userGames
    });
  } catch (error) {
    console.error('Get main page error:', error);
    return res.status(500).json({ error: 'Failed to get main page data' });
  }
});

// Get game list
router.get('/game-list', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get all series
    const series = await Series.find({ halted: false });

    // Get games for each series
    const gameList = [];
    for (const s of series) {
      const games = await Game.find({
        seriesId: s._id,
        status: 'active',
        playerCount: { $gt: 0 }
      }).sort({ gameNumber: -1 }).limit(5);

      gameList.push({
        series: s,
        games: games
      });
    }

    return res.json({ gameList });
  } catch (error) {
    console.error('Get game list error:', error);
    return res.status(500).json({ error: 'Failed to get game list' });
  }
});

// Edit profile
router.post('/edit-profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { icon, background, backgroundAttachment } = req.body;

    const userDoc = await User.findById(user.userId);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (icon) userDoc.icon = icon;
    if (background !== undefined) userDoc.drawBackground = background;
    if (backgroundAttachment) userDoc.backgroundAttachment = backgroundAttachment;

    await userDoc.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userDoc
    });
  } catch (error) {
    console.error('Edit profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get custom series
router.get('/custom-series', requireAuth, async (req: Request, res: Response) => {
  try {
    const customSeries = await Series.find({ custom: true, halted: false });
    return res.json({ series: customSeries });
  } catch (error) {
    console.error('Get custom series error:', error);
    return res.status(500).json({ error: 'Failed to get custom series' });
  }
});

// Create custom series
router.post('/create-series', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const seriesData = req.body;

    const series = new Series({
      ...seriesData,
      creator: user.name,
      custom: true
    });

    await series.save();

    return res.json({
      success: true,
      message: 'Series created successfully',
      series
    });
  } catch (error) {
    console.error('Create series error:', error);
    return res.status(500).json({ error: 'Failed to create series' });
  }
});

export default router;