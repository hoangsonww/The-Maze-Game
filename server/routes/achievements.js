const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const { achievements } = require('../database/repository');

/**
 * @route   GET /api/v1/achievements
 * @desc    Get all available achievements
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const catalog = achievements.catalog();
    res.json({ success: true, count: catalog.length, data: catalog });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/achievements/user/:userId
 * @desc    Get a player's achievements with unlocked status and total points
 * @access  Public
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const data = await achievements.getUser(req.params.userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/achievements/unlock
 * @desc    Unlock an achievement for a player
 * @access  Public
 */
router.post('/unlock', async (req, res, next) => {
  try {
    const { userId, achievementId } = req.body;

    if (!userId || !achievementId) {
      throw new AppError('Please provide userId and achievementId', 400);
    }

    const achievement = achievements.catalog().find((a) => a.id === achievementId);
    if (!achievement) {
      throw new AppError('Achievement not found', 404);
    }

    const result = await achievements.unlock(userId, achievementId);
    if (result === 'exists') {
      throw new AppError('Achievement already unlocked', 400);
    }

    res.status(201).json({ success: true, data: achievement });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
