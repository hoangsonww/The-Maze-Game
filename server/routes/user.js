/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { hashPassword } = require('../services/auth');
const users = require('../database/users');

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * @route PATCH /api/v1/users/me
 * @desc  Update the signed-in user's username and/or email
 * @access Private
 */
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const fields = {};
    if (req.body.username !== undefined) {
      const username = (req.body.username || '').trim();
      if (!USERNAME_RE.test(username)) {
        throw new AppError('Username must be 3-20 chars: letters, numbers, underscores', 400);
      }
      const existing = await users.findByUsername(username);
      if (existing && existing.id !== req.user.id)
        throw new AppError('Username is already taken', 409);
      fields.username = username;
    }
    if (req.body.email !== undefined) {
      const email = (req.body.email || '').trim();
      if (!EMAIL_RE.test(email)) throw new AppError('A valid email is required', 400);
      const existing = await users.findByEmail(email);
      if (existing && existing.id !== req.user.id)
        throw new AppError('Email is already registered', 409);
      fields.email = email;
    }
    if (!fields.username && !fields.email) throw new AppError('Nothing to update', 400);

    await users.updateProfile(req.user.id, fields);
    const profile = await users.profile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/users/me/password
 * @desc  Change the signed-in user's password
 * @access Private
 */
router.post('/me/password', authenticate, async (req, res, next) => {
  try {
    const password = req.body.password || '';
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    await users.updatePassword(req.user.id, await hashPassword(password));
    res.json({ success: true, data: { message: 'Password updated' } });
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
