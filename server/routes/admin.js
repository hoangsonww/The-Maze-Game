const express = require('express');
const { query, transaction } = require('../database/connection');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { sendBulkEmail } = require('../utils/email');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get comprehensive platform statistics
 * @access  Admin
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await transaction(async (client) => {
      // User stats
      const userStats = await client.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as daily_active_users
        FROM users
      `);

      // Game stats
      const gameStats = await client.query(`
        SELECT
          COUNT(*) as total_games,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_games,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as games_this_week,
          AVG(completion_time) FILTER (WHERE status = 'completed') as avg_completion_time,
          AVG(score) FILTER (WHERE status = 'completed') as avg_score
        FROM game_sessions
      `);

      // Achievement stats
      const achievementStats = await client.query(`
        SELECT
          COUNT(DISTINCT user_id) as users_with_achievements,
          COUNT(*) as total_unlocks,
          COUNT(*) FILTER (WHERE unlocked_at > NOW() - INTERVAL '7 days') as unlocks_this_week
        FROM user_achievements
      `);

      // Revenue stats (if applicable)
      const customMazeStats = await client.query(`
        SELECT
          COUNT(*) as total_custom_mazes,
          COUNT(*) FILTER (WHERE is_public = true) as public_mazes,
          SUM(play_count) as total_plays
        FROM custom_mazes
      `);

      return {
        users: userStats.rows[0],
        games: gameStats.rows[0],
        achievements: achievementStats.rows[0],
        customMazes: customMazeStats.rows[0],
      };
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Admin
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await query(
      `SELECT
        u.id, u.username, u.email, u.role, u.is_active, u.is_verified,
        u.created_at, u.last_login,
        us.games_played, us.games_won, us.total_score
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user (activate, deactivate, change role)
 * @access  Admin
 */
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (role) {
      if (!['user', 'admin', 'moderator'].includes(role)) {
        throw new AppError('Invalid role', 400);
      }
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    params.push(id);

    const result = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, role, is_active`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    logger.info(`User updated by admin: ${result.rows[0].username}`, {
      adminId: req.user.id,
      updates: req.body,
    });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    logger.warn(`User deleted by admin: ${result.rows[0].username}`, {
      adminId: req.user.id,
      deletedUserId: id,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/games
 * @desc    Get all game sessions
 * @access  Admin
 */
router.get('/games', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, difficulty } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(`difficulty = $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await query(
      `SELECT
        gs.*,
        u.username
      FROM game_sessions gs
      LEFT JOIN users u ON gs.user_id = u.id
      ${whereClause}
      ORDER BY gs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM game_sessions ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        games: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/announcements
 * @desc    Send announcement to all users
 * @access  Admin
 */
router.post('/announcements', async (req, res, next) => {
  try {
    const { subject, message, targetRole } = req.body;

    if (!subject || !message) {
      throw new AppError('Subject and message required', 400);
    }

    // Get user emails
    let roleCondition = '';
    if (targetRole && targetRole !== 'all') {
      roleCondition = `WHERE role = '${targetRole}'`;
    }

    const result = await query(
      `SELECT email FROM users WHERE is_active = true AND is_verified = true ${roleCondition}`
    );

    const emails = result.rows.map(row => row.email);

    // Send emails
    await sendBulkEmail(emails, {
      subject,
      html: `<h1>${subject}</h1><p>${message}</p>`,
    });

    logger.info(`Announcement sent to ${emails.length} users by admin ${req.user.id}`);

    res.json({
      success: true,
      message: `Announcement sent to ${emails.length} users`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get detailed analytics
 * @access  Admin
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateCondition = startDate && endDate
      ? `WHERE created_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    const analytics = await transaction(async (client) => {
      // Daily active users
      const dauResult = await client.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as dau
        FROM analytics_events
        ${dateCondition}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // Popular game modes
      const modesResult = await client.query(`
        SELECT
          mode,
          COUNT(*) as count,
          AVG(score) as avg_score
        FROM game_sessions
        WHERE status = 'completed'
        ${dateCondition}
        GROUP BY mode
        ORDER BY count DESC
      `);

      // Difficulty distribution
      const difficultyResult = await client.query(`
        SELECT
          difficulty,
          COUNT(*) as count,
          AVG(completion_time) as avg_time,
          AVG(score) as avg_score
        FROM game_sessions
        WHERE status = 'completed'
        ${dateCondition}
        GROUP BY difficulty
      `);

      return {
        dailyActiveUsers: dauResult.rows,
        gameModesPopularity: modesResult.rows,
        difficultyDistribution: difficultyResult.rows,
      };
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/tournaments
 * @desc    Create tournament
 * @access  Admin
 */
router.post('/tournaments', async (req, res, next) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      difficulty,
      prizePool,
      maxParticipants,
    } = req.body;

    if (!name || !startTime || !endTime || !difficulty) {
      throw new AppError('Missing required fields', 400);
    }

    const result = await query(
      `INSERT INTO tournaments
       (name, description, start_time, end_time, difficulty, prize_pool, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, startTime, endTime, difficulty, prizePool, maxParticipants]
    );

    logger.info(`Tournament created by admin: ${name}`, { adminId: req.user.id });

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/logs
 * @desc    Get system logs
 * @access  Admin (requires admin role, not moderator)
 */
router.get('/logs', authorize('admin'), async (req, res, next) => {
  try {
    const { level = 'info', limit = 100 } = req.query;

    // This would typically read from your logging system
    // For now, we'll return analytics events as a proxy
    const result = await query(
      `SELECT * FROM analytics_events
       WHERE event_type LIKE 'error%'
       ORDER BY created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
