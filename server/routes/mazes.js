const express = require('express');
const { query, transaction } = require('../database/connection');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/v1/mazes/custom
 * @desc    Get public custom mazes
 * @access  Public
 */
router.get('/custom', optionalAuthenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created_at', difficulty } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = 'WHERE is_public = true';
    const params = [];
    let paramIndex = 1;

    if (difficulty) {
      whereCondition += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    let orderBy = 'created_at DESC';
    if (sortBy === 'rating') {
      orderBy = 'rating DESC NULLS LAST, created_at DESC';
    } else if (sortBy === 'popular') {
      orderBy = 'play_count DESC, created_at DESC';
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT
        cm.id, cm.name, cm.description, cm.difficulty,
        cm.rows, cm.cols, cm.is_public, cm.play_count,
        cm.rating, cm.created_at,
        u.username as creator_name
      FROM custom_mazes cm
      JOIN users u ON cm.user_id = u.id
      ${whereCondition}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
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
 * @route   GET /api/v1/mazes/custom/:id
 * @desc    Get specific custom maze
 * @access  Public
 */
router.get('/custom/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        cm.*,
        u.username as creator_name
      FROM custom_mazes cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = $1 AND (cm.is_public = true OR cm.user_id = $2)`,
      [id, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      throw new AppError('Maze not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/mazes/custom
 * @desc    Create custom maze
 * @access  Private
 */
router.post('/custom', authenticate, async (req, res, next) => {
  try {
    const { name, description, mazeData, difficulty, rows, cols, isPublic } = req.body;

    if (!name || !mazeData || !rows || !cols) {
      throw new AppError('Missing required fields', 400);
    }

    if (rows < 5 || rows > 50 || cols < 5 || cols > 50) {
      throw new AppError('Maze dimensions must be between 5 and 50', 400);
    }

    const result = await query(
      `INSERT INTO custom_mazes
       (user_id, name, description, maze_data, difficulty, rows, cols, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, name, description, JSON.stringify(mazeData), difficulty, rows, cols, isPublic || false]
    );

    // Check for achievement
    await query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, 'maze_creator')
       ON CONFLICT DO NOTHING`,
      [req.user.id]
    );

    logger.info(`Custom maze created by user ${req.user.id}: ${name}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/mazes/custom/:id
 * @desc    Update custom maze
 * @access  Private
 */
router.put('/custom/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      params.push(isPublic);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    params.push(id, req.user.id);

    const result = await query(
      `UPDATE custom_mazes
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Maze not found or unauthorized', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/mazes/custom/:id
 * @desc    Delete custom maze
 * @access  Private
 */
router.delete('/custom/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM custom_mazes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Maze not found or unauthorized', 404);
    }

    res.json({
      success: true,
      message: 'Maze deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/mazes/custom/:id/play
 * @desc    Record maze play (increment play count)
 * @access  Public
 */
router.post('/custom/:id/play', async (req, res, next) => {
  try {
    const { id } = req.params;

    await query(
      'UPDATE custom_mazes SET play_count = play_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Play recorded',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/mazes/custom/:id/rate
 * @desc    Rate a custom maze
 * @access  Private
 */
router.post('/custom/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    await transaction(async (client) => {
      // Insert or update rating
      await client.query(
        `INSERT INTO maze_ratings (maze_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (maze_id, user_id)
         DO UPDATE SET rating = $3, comment = $4`,
        [id, req.user.id, rating, comment]
      );

      // Update maze average rating
      const avgResult = await client.query(
        'SELECT AVG(rating)::numeric(3,2) as avg_rating FROM maze_ratings WHERE maze_id = $1',
        [id]
      );

      await client.query(
        'UPDATE custom_mazes SET rating = $1 WHERE id = $2',
        [avgResult.rows[0].avg_rating, id]
      );
    });

    res.json({
      success: true,
      message: 'Rating submitted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/mazes/my
 * @desc    Get user's custom mazes
 * @access  Private
 */
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM custom_mazes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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
