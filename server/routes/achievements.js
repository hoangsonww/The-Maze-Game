const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');

// Define achievements
const ACHIEVEMENTS = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Complete your first maze',
    icon: '🏆',
    points: 10,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a maze in under 30 seconds',
    icon: '⚡',
    points: 25,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a maze without using any hints',
    icon: '💎',
    points: 20,
  },
  {
    id: 'efficient',
    name: 'Efficient Navigator',
    description: 'Complete a maze with minimal moves',
    icon: '🎯',
    points: 30,
  },
  {
    id: 'marathon',
    name: 'Marathon Runner',
    description: 'Complete 100 mazes',
    icon: '🏃',
    points: 50,
  },
  {
    id: 'expert_conqueror',
    name: 'Expert Conqueror',
    description: 'Complete an expert difficulty maze',
    icon: '👑',
    points: 40,
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Win 10 games in a row',
    icon: '🔥',
    points: 35,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play between midnight and 4 AM',
    icon: '🦉',
    points: 15,
  },
];

// In-memory storage for user achievements
let userAchievements = {};

/**
 * @route   GET /api/v1/achievements
 * @desc    Get all available achievements
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    res.json({
      success: true,
      count: ACHIEVEMENTS.length,
      data: ACHIEVEMENTS,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/achievements/user/:userId
 * @desc    Get user's unlocked achievements
 * @access  Public
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const unlocked = userAchievements[userId] || [];

    const achievementsWithStatus = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: unlocked.includes(achievement.id),
      unlockedAt: unlocked.find(a => a.id === achievement.id)?.unlockedAt,
    }));

    res.json({
      success: true,
      data: {
        achievements: achievementsWithStatus,
        totalPoints: unlocked.reduce((sum, id) => {
          const achievement = ACHIEVEMENTS.find(a => a.id === id);
          return sum + (achievement?.points || 0);
        }, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/achievements/unlock
 * @desc    Unlock an achievement for a user
 * @access  Public
 */
router.post('/unlock', async (req, res, next) => {
  try {
    const { userId, achievementId } = req.body;

    if (!userId || !achievementId) {
      throw new AppError('Please provide userId and achievementId', 400);
    }

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      throw new AppError('Achievement not found', 404);
    }

    if (!userAchievements[userId]) {
      userAchievements[userId] = [];
    }

    if (userAchievements[userId].includes(achievementId)) {
      throw new AppError('Achievement already unlocked', 400);
    }

    userAchievements[userId].push({
      id: achievementId,
      unlockedAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
