import request from 'supertest'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Create a minimal app for testing
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Basic routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Space Blitz server is running' });
  });

  return app;
};

const app = createTestApp();

describe('Server', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Space Blitz server is running'
    })
  })

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route')
    expect(response.status).toBe(404)
  })
})