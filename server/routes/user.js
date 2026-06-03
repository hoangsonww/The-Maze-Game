const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const users = require('../database/users');

/**
 * @route GET /api/v1/users/me/stats
 * @desc  Current user's stats + progress
 * @access Private
 */
router.get('/me/stats', authenticate, async (req, res, next) => {
  try {
    const profile = await users.profile(req.user.id);
    if (!profile) throw new AppError('User not found', 404);
    res.json({ success: true, data: profile.stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/users/me/games
 * @desc  Record a finished game against the user's stats / progress
 * @access Private
 */
router.post('/me/games', authenticate, async (req, res, next) => {
  try {
    const { difficulty = 'medium', score = 0, timeMs = 0, moves = 0, won = false } = req.body;
    const stats = await users.recordGame(req.user.id, {
      difficulty,
      score: parseInt(score) || 0,
      timeMs: parseInt(timeMs) || 0,
      moves: parseInt(moves) || 0,
      won: Boolean(won),
    });
    if (!stats) throw new AppError('User not found', 404);
    res.status(201).json({ success: true, data: users.decorateStats(stats) });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/users/:id
 * @desc  Public profile (username + stats, no email)
 * @access Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const profile = await users.profile(req.params.id);
    if (!profile) throw new AppError('User not found', 404);
    const { email, recentGames, ...publicProfile } = profile;
    res.json({ success: true, data: publicProfile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
