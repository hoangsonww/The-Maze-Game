/**
 * @jest-environment node
 */
const request = require('supertest');
const express = require('express');
const authRoutes = require('../../server/routes/auth');
const userRoutes = require('../../server/routes/user');
const errorHandler = require('../../server/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use(errorHandler);

const creds = { username: 'mazerunner', email: 'runner@example.com', password: 'secret1' };
let token;

describe('Auth & user stats API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('creates an account and returns a token + user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.username).toBe('mazerunner');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.user.stats.gamesPlayed).toBe(0);
      token = res.body.data.token;
    });

    it('rejects a duplicate username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...creds, email: 'other@example.com' })
        .expect(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects a weak password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'shorty', email: 's@e.com', password: '123' })
        .expect(400);
    });

    it('rejects an invalid username', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'a b', email: 'ab@e.com', password: 'secret1' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with email and returns a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ login: creds.email, password: creds.password })
        .expect(200);
      expect(res.body.data.token).toEqual(expect.any(String));
    });

    it('rejects a wrong password', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ login: creds.username, password: 'nope' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('requires a token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('returns the current account with a valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.data.username).toBe('mazerunner');
      expect(res.body.data.stats).toHaveProperty('winRate');
      expect(res.body.data.stats).toHaveProperty('level');
    });
  });

  describe('POST /api/v1/users/me/games', () => {
    it('records a game and updates stats/progress', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ difficulty: 'hard', score: 200, timeMs: 25000, moves: 60, won: true })
        .expect(201);
      expect(res.body.data.gamesPlayed).toBe(1);
      expect(res.body.data.gamesWon).toBe(1);
      expect(res.body.data.totalScore).toBe(200);
      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.byDifficulty.hard.bestScore).toBe(200);
      expect(res.body.data.winRate).toBe(100);
    });

    it('resets the streak on a loss', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ difficulty: 'easy', score: 0, timeMs: 1000, moves: 5, won: false })
        .expect(201);
      expect(res.body.data.gamesPlayed).toBe(2);
      expect(res.body.data.currentStreak).toBe(0);
      expect(res.body.data.bestStreak).toBe(1);
    });
  });
});
