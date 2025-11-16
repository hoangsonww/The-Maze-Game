const request = require('supertest');
const express = require('express');
const achievementRoutes = require('../../server/routes/achievements');

const app = express();
app.use(express.json());
app.use('/api/v1/achievements', achievementRoutes);

describe('Achievements API', () => {
  describe('GET /api/v1/achievements', () => {
    it('should return all achievements', async () => {
      const response = await request(app)
        .get('/api/v1/achievements')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return achievements with required fields', async () => {
      const response = await request(app)
        .get('/api/v1/achievements')
        .expect(200);

      const achievement = response.body.data[0];
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('icon');
      expect(achievement).toHaveProperty('points');
    });
  });

  describe('GET /api/v1/achievements/user/:userId', () => {
    it('should return user achievements', async () => {
      const response = await request(app)
        .get('/api/v1/achievements/user/test-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('achievements');
      expect(response.body.data).toHaveProperty('totalPoints');
    });
  });

  describe('POST /api/v1/achievements/unlock', () => {
    it('should unlock an achievement', async () => {
      const response = await request(app)
        .post('/api/v1/achievements/unlock')
        .send({ userId: 'test-user', achievementId: 'first_win' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('first_win');
    });

    it('should reject duplicate unlocks', async () => {
      // Unlock once
      await request(app)
        .post('/api/v1/achievements/unlock')
        .send({ userId: 'test-user-2', achievementId: 'first_win' });

      // Try to unlock again
      const response = await request(app)
        .post('/api/v1/achievements/unlock')
        .send({ userId: 'test-user-2', achievementId: 'first_win' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid achievement IDs', async () => {
      const response = await request(app)
        .post('/api/v1/achievements/unlock')
        .send({ userId: 'test-user', achievementId: 'invalid_achievement' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require userId and achievementId', async () => {
      const response = await request(app)
        .post('/api/v1/achievements/unlock')
        .send({ userId: 'test-user' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
