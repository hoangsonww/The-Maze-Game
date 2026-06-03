const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { leaderboard } = require('../database/repository');

/**
 * @route   GET /api/v1/leaderboard
 * @desc    Get global leaderboard
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;
    const timeframe = req.query.timeframe || 'all';

    const { entries, total } = await leaderboard.list({ timeframe, limit, offset });

    res.json({
      success: true,
      count: entries.length,
      total,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/leaderboard
 * @desc    Submit score to leaderboard
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { playerName, score, completionTime, difficulty, moves } = req.body;

    if (!playerName || score === undefined || !completionTime) {
      throw new AppError('Please provide playerName, score, and completionTime', 400);
    }

    if (playerName.length > 20) {
      throw new AppError('Player name must be 20 characters or less', 400);
    }

    const entry = await leaderboard.add({
      playerName: playerName.trim(),
      score: parseInt(score),
      completionTime: parseInt(completionTime),
      difficulty: difficulty || 'medium',
      moves: parseInt(moves) || 0,
    });

    logger.info(`New leaderboard entry: ${entry.playerName} - Score: ${entry.score}`);

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/leaderboard/rank/:playerName
 * @desc    Get player's rank
 * @access  Public
 */
router.get('/rank/:playerName', async (req, res, next) => {
  try {
    const result = await leaderboard.rank(req.params.playerName);

    if (!result) {
      throw new AppError('Player not found', 404);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
