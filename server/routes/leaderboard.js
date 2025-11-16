const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// In-memory storage (replace with database in production)
let leaderboard = [];

/**
 * @route   GET /api/v1/leaderboard
 * @desc    Get global leaderboard
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, timeframe = 'all' } = req.query;

    let filteredLeaderboard = [...leaderboard];

    // Filter by timeframe
    if (timeframe !== 'all') {
      const now = Date.now();
      const timeframes = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      };

      const timeLimit = now - timeframes[timeframe];
      filteredLeaderboard = filteredLeaderboard.filter(
        entry => entry.timestamp > timeLimit
      );
    }

    // Sort by score (descending), then by time (ascending)
    filteredLeaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.completionTime - b.completionTime;
    });

    const paginatedResults = filteredLeaderboard.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      count: paginatedResults.length,
      total: filteredLeaderboard.length,
      data: paginatedResults,
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

    // Validation
    if (!playerName || score === undefined || !completionTime) {
      throw new AppError('Please provide playerName, score, and completionTime', 400);
    }

    if (playerName.length > 20) {
      throw new AppError('Player name must be 20 characters or less', 400);
    }

    const entry = {
      id: Date.now() + Math.random(),
      playerName: playerName.trim(),
      score: parseInt(score),
      completionTime: parseInt(completionTime),
      difficulty: difficulty || 'medium',
      moves: moves || 0,
      timestamp: Date.now(),
    };

    leaderboard.push(entry);

    // Keep only top 1000 entries to prevent memory issues
    if (leaderboard.length > 1000) {
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 1000);
    }

    logger.info(`New leaderboard entry: ${playerName} - Score: ${score}`);

    res.status(201).json({
      success: true,
      data: entry,
    });
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
    const { playerName } = req.params;

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.completionTime - b.completionTime;
    });

    const playerEntries = sortedLeaderboard.filter(
      entry => entry.playerName.toLowerCase() === playerName.toLowerCase()
    );

    if (playerEntries.length === 0) {
      throw new AppError('Player not found', 404);
    }

    const bestEntry = playerEntries[0];
    const rank = sortedLeaderboard.findIndex(entry => entry.id === bestEntry.id) + 1;

    res.json({
      success: true,
      data: {
        rank,
        entry: bestEntry,
        totalEntries: sortedLeaderboard.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
