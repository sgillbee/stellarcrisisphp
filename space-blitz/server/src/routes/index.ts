import express from 'express';
import { Request, Response } from 'express';
import authRouter from './auth';
import gameRouter from './game';
import adminRouter from './admin';
import mainRouter from './main';
import tournamentRouter from './tournament';

const router = express.Router();

// Main API router that handles different sections like the PHP switch statement
router.use('/auth', authRouter);
router.use('/game', gameRouter);
router.use('/admin', adminRouter);
router.use('/main', mainRouter);
router.use('/tournament', tournamentRouter);

// Legacy route compatibility - maps section-based POST requests to appropriate routes
router.post('/', (req: Request, res: Response) => {
  const { section } = req.body;

  // This is a compatibility layer for the old PHP-style section-based routing
  // In a real implementation, we'd redirect to the appropriate endpoint
  // For now, just return an error asking clients to use the new API
  return res.status(400).json({
    error: 'Legacy API not implemented',
    message: 'Please use the new REST API endpoints instead of section-based routing',
    availableEndpoints: {
      auth: '/api/auth',
      games: '/api/game',
      admin: '/api/admin',
      main: '/api/main',
      tournaments: '/api/tournament'
    }
  });
});

export default router;