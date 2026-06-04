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
const logger = require('../utils/logger');
const { games } = require('../database/repository');

/**
 * @route   POST /api/v1/games/start
 * @desc    Start a new game session
 * @access  Public
 */
router.post('/start', async (req, res, next) => {
  try {
    const { playerId, difficulty = 'medium', mode = 'single' } = req.body;
    const session = await games.start({ playerId, difficulty, mode });
    res.status(201).json({ success: true, data: session });
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
    const session = await games.get(req.params.id);
    if (!session) throw new AppError('Game session not found', 404);
    if (session.status !== 'in_progress') throw new AppError('Game session is not active', 400);

    const updated = await games.recordMove(req.params.id);
    if (!updated) throw new AppError('Game session not found', 404);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/games/:id/complete
 * @desc    Complete a game session and calculate score
 * @access  Public
 */
router.put('/:id/complete', async (req, res, next) => {
  try {
    const session = await games.get(req.params.id);
    if (!session) throw new AppError('Game session not found', 404);

    const completed = await games.complete(req.params.id);
    if (!completed) throw new AppError('Game session not found', 404);

    logger.info(`Game completed: Session ${completed.id}, Score: ${completed.score}`);
    res.json({ success: true, data: completed });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/games/stats
 * @desc    Get aggregate game statistics
 * @access  Public
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await games.stats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
