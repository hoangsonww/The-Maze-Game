const express = require('express');
const { query, transaction } = require('../database/connection');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/social/friends
 * @desc    Get user's friends
 * @access  Private
 */
router.get('/friends', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        u.id, u.username, u.avatar_url,
        us.games_played, us.games_won, us.total_score,
        f.status, f.created_at as friend_since
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id)
      LEFT JOIN user_stats us ON u.id = us.user_id
      WHERE f.user_id = $1 AND f.status = 'accepted'
      ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/social/friend-requests
 * @desc    Get pending friend requests
 * @access  Private
 */
router.get('/friend-requests', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        u.id, u.username, u.avatar_url,
        f.created_at
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/social/friend-request
 * @desc    Send friend request
 * @access  Private
 */
router.post('/friend-request', async (req, res, next) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      throw new AppError('Friend ID required', 400);
    }

    if (friendId === req.user.id) {
      throw new AppError('Cannot add yourself as friend', 400);
    }

    // Check if friendship already exists
    const existing = await query(
      `SELECT id FROM friendships
       WHERE (user_id = $1 AND friend_id = $2)
       OR (user_id = $2 AND friend_id = $1)`,
      [req.user.id, friendId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Friend request already exists', 409);
    }

    // Create friend request
    const result = await query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [req.user.id, friendId]
    );

    // Get friend details for notification
    const friendResult = await query(
      'SELECT username, email FROM users WHERE id = $1',
      [friendId]
    );

    if (friendResult.rows.length > 0) {
      // Send email notification
      sendEmail({
        template: 'friendRequest',
        data: [friendResult.rows[0].username, req.user.username],
        to: friendResult.rows[0].email,
      }).catch(err => logger.error('Failed to send friend request email:', err));
    }

    logger.info(`Friend request sent from ${req.user.id} to ${friendId}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/social/friend-request/:id
 * @desc    Accept or reject friend request
 * @access  Private
 */
router.put('/friend-request/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    if (action === 'accept') {
      const result = await query(
        `UPDATE friendships
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
         RETURNING *`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Friend request not found', 404);
      }

      // Check for achievement
      const friendCount = await query(
        `SELECT COUNT(*) FROM friendships
         WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'`,
        [req.user.id]
      );

      if (parseInt(friendCount.rows[0].count) >= 10) {
        // Unlock social butterfly achievement
        await query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, 'social_butterfly')
           ON CONFLICT DO NOTHING`,
          [req.user.id]
        );
      }

      res.json({
        success: true,
        message: 'Friend request accepted',
        data: result.rows[0],
      });
    } else {
      await query(
        'DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2',
        [id, req.user.id]
      );

      res.json({
        success: true,
        message: 'Friend request rejected',
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/social/friends/:id
 * @desc    Remove friend
 * @access  Private
 */
router.delete('/friends/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM friendships
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [req.user.id, id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Friendship not found', 404);
    }

    res.json({
      success: true,
      message: 'Friend removed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/social/search
 * @desc    Search for users
 * @access  Private
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const result = await query(
      `SELECT
        u.id, u.username, u.avatar_url,
        us.total_score, us.games_won,
        CASE
          WHEN f.id IS NOT NULL THEN f.status
          ELSE NULL
        END as friendship_status
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      LEFT JOIN friendships f ON (
        (f.user_id = $1 AND f.friend_id = u.id) OR
        (f.friend_id = $1 AND f.user_id = u.id)
      )
      WHERE u.username ILIKE $2 AND u.id != $1 AND u.is_active = true
      LIMIT 20`,
      [req.user.id, `%${q}%`]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/social/activity
 * @desc    Get friends' recent activity
 * @access  Private
 */
router.get('/activity', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        u.id, u.username, u.avatar_url,
        gs.difficulty, gs.mode, gs.score, gs.completion_time,
        gs.created_at
      FROM game_sessions gs
      JOIN users u ON gs.user_id = u.id
      JOIN friendships f ON (
        (f.user_id = $1 AND f.friend_id = u.id) OR
        (f.friend_id = $1 AND f.user_id = u.id)
      )
      WHERE gs.status = 'completed' AND f.status = 'accepted'
      ORDER BY gs.created_at DESC
      LIMIT 50`,
      [req.user.id]
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
