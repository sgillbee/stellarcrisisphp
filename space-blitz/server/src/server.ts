import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/space-blitz';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error);
    console.log('Server will continue without database connection');
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Space Blitz server is running' });
});

// API routes
import apiRouter from './routes/index.js';
app.use('/api', apiRouter);

// Start game update scheduler
import { GameUpdateService } from './services/game-update.js';
import { WebSocketService } from './services/websocket.js';
import { createApolloServer } from './graphql/server.js';

// Initialize services
const wsService = new WebSocketService(io);
let apolloServer: any;

// WebSocket handling is now managed by WebSocketService
// The service is initialized above and handles all socket connections

if (process.env.NODE_ENV !== 'test') {
  // Start server
  server.listen(PORT, () => {
    console.log(`Space Blitz server running on port ${PORT}`);
  });

  // Connect to database asynchronously
  connectDB().then(async () => {
    // Initialize Apollo Server
    apolloServer = await createApolloServer();

    // Start game update scheduler after DB connection
    GameUpdateService.startScheduler();
  }).catch((err) => {
    console.error('Database connection failed:', err);
  });
}