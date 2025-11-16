const request = require('supertest');
const express = require('express');
const leaderboardRoutes = require('../../server/routes/leaderboard');

const app = express();
app.use(express.json());
app.use('/api/v1/leaderboard', leaderboardRoutes);

describe('Leaderboard API', () => {
  describe('GET /api/v1/leaderboard', () => {
    it('should return empty leaderboard initially', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should support pagination with limit and offset', async () => {
      // Add some entries first
      await request(app)
        .post('/api/v1/leaderboard')
        .send({ playerName: 'Player1', score: 100, completionTime: 30000 });

      const response = await request(app)
        .get('/api/v1/leaderboard?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeLessThanOrEqual(10);
    });

    it('should filter by timeframe', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard?timeframe=daily')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/leaderboard', () => {
    it('should submit score successfully', async () => {
      const scoreData = {
        playerName: 'TestPlayer',
        score: 150,
        completionTime: 45000,
        difficulty: 'medium',
        moves: 50,
      };

      const response = await request(app)
        .post('/api/v1/leaderboard')
        .send(scoreData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.playerName).toBe('TestPlayer');
      expect(response.body.data.score).toBe(150);
    });

    it('should reject submission without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/leaderboard')
        .send({ playerName: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject player name longer than 20 characters', async () => {
      const response = await request(app)
        .post('/api/v1/leaderboard')
        .send({
          playerName: 'ThisNameIsTooLongForTheSystem',
          score: 100,
          completionTime: 30000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/leaderboard/rank/:playerName', () => {
    beforeAll(async () => {
      // Add test data
      await request(app)
        .post('/api/v1/leaderboard')
        .send({ playerName: 'RankedPlayer', score: 200, completionTime: 30000 });
    });

    it('should return player rank', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/rank/RankedPlayer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rank).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent player', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/rank/NonExistentPlayer')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
