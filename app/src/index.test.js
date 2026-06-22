const request = require('supertest');
const app = require('./index');

describe('FinCorp API', () => {
  it('GET / returns app info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.app).toBe('FinCorp API');
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
