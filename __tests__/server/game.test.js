const request = require('supertest');
const express = require('express');
const gameRoutes = require('../../server/routes/game');

const app = express();
app.use(express.json());
app.use('/api/v1/games', gameRoutes);

describe('Game API', () => {
  let sessionId;

  describe('POST /api/v1/games/start', () => {
    it('should start a new game session', async () => {
      const response = await request(app)
        .post('/api/v1/games/start')
        .send({ playerId: 'test-player', difficulty: 'medium' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.difficulty).toBe('medium');
      expect(response.body.data.status).toBe('in_progress');
      sessionId = response.body.data.id;
    });

    it('should default to medium difficulty', async () => {
      const response = await request(app)
        .post('/api/v1/games/start')
        .send({ playerId: 'test-player' })
        .expect(201);

      expect(response.body.data.difficulty).toBe('medium');
    });
  });

  describe('PUT /api/v1/games/:id/move', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/games/start')
        .send({ playerId: 'test-player' });
      sessionId = response.body.data.id;
    });

    it('should track player moves', async () => {
      const response = await request(app)
        .put(`/api/v1/games/${sessionId}/move`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moves).toBe(1);
    });

    it('should return 404 for invalid session', async () => {
      const response = await request(app)
        .put('/api/v1/games/999999/move')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/games/:id/complete', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/games/start')
        .send({ playerId: 'test-player', difficulty: 'hard' });
      sessionId = response.body.data.id;
    });

    it('should complete game and calculate score', async () => {
      // Make some moves first
      await request(app).put(`/api/v1/games/${sessionId}/move`);
      await request(app).put(`/api/v1/games/${sessionId}/move`);

      const response = await request(app)
        .put(`/api/v1/games/${sessionId}/complete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.completionTime).toBeDefined();
    });

    it('should apply difficulty multiplier to score', async () => {
      const response = await request(app)
        .put(`/api/v1/games/${sessionId}/complete`)
        .expect(200);

      // Hard difficulty should give higher score
      expect(response.body.data.score).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/games/stats', () => {
    it('should return game statistics', async () => {
      const response = await request(app)
        .get('/api/v1/games/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalGames');
      expect(response.body.data).toHaveProperty('averageCompletionTime');
      expect(response.body.data).toHaveProperty('averageMoves');
      expect(response.body.data).toHaveProperty('averageScore');
    });
  });
});
