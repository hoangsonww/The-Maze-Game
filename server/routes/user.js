const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// In-memory user storage (replace with database)
let users = [];

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      throw new AppError('Please provide username and email', 400);
    }

    // Check if user exists
    const existingUser = users.find(
      u => u.username === username || u.email === email
    );

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const user = {
      id: Date.now() + Math.random(),
      username,
      email,
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        bestTime: null,
        achievements: [],
      },
    };

    users.push(user);
    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user profile
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = users.find(u => u.id === parseFloat(req.params.id));

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/:id/stats
 * @desc    Update user statistics
 * @access  Public
 */
router.put('/:id/stats', async (req, res, next) => {
  try {
    const user = users.find(u => u.id === parseFloat(req.params.id));

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { gamesPlayed, gamesWon, totalScore, bestTime } = req.body;

    if (gamesPlayed !== undefined) user.stats.gamesPlayed += gamesPlayed;
    if (gamesWon !== undefined) user.stats.gamesWon += gamesWon;
    if (totalScore !== undefined) user.stats.totalScore += totalScore;
    if (bestTime !== undefined) {
      user.stats.bestTime = user.stats.bestTime
        ? Math.min(user.stats.bestTime, bestTime)
        : bestTime;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
