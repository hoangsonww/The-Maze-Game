const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// In-memory game sessions storage
let gameSessions = [];

/**
 * @route   POST /api/v1/games/start
 * @desc    Start a new game session
 * @access  Public
 */
router.post('/start', async (req, res, next) => {
  try {
    const { playerId, difficulty = 'medium', mode = 'single' } = req.body;

    const session = {
      id: Date.now() + Math.random(),
      playerId,
      difficulty,
      mode,
      startTime: Date.now(),
      moves: 0,
      hintsUsed: 0,
      status: 'in_progress',
    };

    gameSessions.push(session);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/games/:id/move
 * @desc    Record a move in the game
 * @access  Public
 */
router.put('/:id/move', async (req, res, next) => {
  try {
    const session = gameSessions.find(s => s.id === parseFloat(req.params.id));

    if (!session) {
      throw new AppError('Game session not found', 404);
    }

    if (session.status !== 'in_progress') {
      throw new AppError('Game session is not active', 400);
    }

    session.moves += 1;

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/games/:id/complete
 * @desc    Complete a game session
 * @access  Public
 */
router.put('/:id/complete', async (req, res, next) => {
  try {
    const session = gameSessions.find(s => s.id === parseFloat(req.params.id));

    if (!session) {
      throw new AppError('Game session not found', 404);
    }

    session.status = 'completed';
    session.endTime = Date.now();
    session.completionTime = session.endTime - session.startTime;

    // Calculate score based on difficulty, time, and moves
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    };

    const baseScore = 100;
    const timePenalty = Math.floor(session.completionTime / 1000) * 0.1;
    const movePenalty = session.moves * 0.5;
    const hintPenalty = session.hintsUsed * 10;

    session.score = Math.max(
      0,
      Math.round(
        (baseScore - timePenalty - movePenalty - hintPenalty) *
        difficultyMultiplier[session.difficulty]
      )
    );

    logger.info(`Game completed: Session ${session.id}, Score: ${session.score}`);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/games/stats
 * @desc    Get game statistics
 * @access  Public
 */
router.get('/stats', async (req, res, next) => {
  try {
    const completedGames = gameSessions.filter(s => s.status === 'completed');

    const stats = {
      totalGames: completedGames.length,
      averageCompletionTime: completedGames.length > 0
        ? completedGames.reduce((sum, s) => sum + s.completionTime, 0) / completedGames.length
        : 0,
      averageMoves: completedGames.length > 0
        ? completedGames.reduce((sum, s) => sum + s.moves, 0) / completedGames.length
        : 0,
      averageScore: completedGames.length > 0
        ? completedGames.reduce((sum, s) => sum + s.score, 0) / completedGames.length
        : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
