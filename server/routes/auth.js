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
const { hashPassword, verifyPassword, signToken } = require('../services/auth');
const users = require('../database/users');
const logger = require('../utils/logger');

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  const clean = users.sanitize(user);
  return { ...clean, stats: users.decorateStats(clean.stats) };
}

/**
 * @route POST /api/v1/auth/register
 * @desc  Create an account
 */
router.post('/register', async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';

    if (!USERNAME_RE.test(username)) {
      throw new AppError('Username must be 3-20 characters: letters, numbers, underscores', 400);
    }
    if (!EMAIL_RE.test(email)) throw new AppError('A valid email is required', 400);
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

    if (await users.findByUsername(username)) throw new AppError('Username is already taken', 409);
    if (await users.findByEmail(email)) throw new AppError('Email is already registered', 409);

    const passwordHash = await hashPassword(password);
    const user = await users.create({ username, email, passwordHash });
    await users.touchLogin(user.id);

    logger.info(`New account registered: ${username}`);
    res
      .status(201)
      .json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/auth/login
 * @desc  Log in with username OR email + password
 */
router.post('/login', async (req, res, next) => {
  try {
    const login = (req.body.login || req.body.username || req.body.email || '').trim();
    const password = req.body.password || '';
    if (!login || !password) throw new AppError('Provide login and password', 400);

    const user = await users.findByLogin(login);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError('Invalid credentials', 401);
    }

    await users.touchLogin(user.id);
    res.json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

// Find the account whose username AND email both match (case-insensitive).
async function findMatching(username, email) {
  const user = await users.findByUsername((username || '').trim());
  if (!user) return null;
  if ((user.email || '').toLowerCase() !== (email || '').trim().toLowerCase()) return null;
  return user;
}

/**
 * @route POST /api/v1/auth/reset/verify
 * @desc  Step 1 — confirm a username + email pair belongs to one account
 */
router.post('/reset/verify', async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) throw new AppError('Provide username and email', 400);
    const user = await findMatching(username, email);
    if (!user) throw new AppError('No account matches that username and email', 404);
    res.json({ success: true, data: { verified: true } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/auth/reset
 * @desc  Step 2 — set a new password (re-verifies username + email), then logs in
 */
router.post('/reset', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email) throw new AppError('Provide username and email', 400);
    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
    const user = await findMatching(username, email);
    if (!user) throw new AppError('No account matches that username and email', 404);

    await users.updatePassword(user.id, await hashPassword(password));
    await users.touchLogin(user.id);
    logger.info(`Password reset for: ${user.username}`);
    res.json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/auth/me
 * @desc  Current account + decorated stats
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await users.profile(req.user.id);
    if (!profile) throw new AppError('User not found', 404);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
