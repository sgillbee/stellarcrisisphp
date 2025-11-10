import request from 'supertest'
import app from '../src/server'

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