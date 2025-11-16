const express = require('express');
const { query, transaction } = require('../database/connection');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/v1/challenges/daily
 * @desc    Get today's daily challenge
 * @access  Public
 */
router.get('/daily', optionalAuthenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        dc.*,
        CASE
          WHEN $1::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM challenge_completions
            WHERE challenge_id = dc.id AND user_id = $1
          )
          ELSE false
        END as completed_by_user
      FROM daily_challenges dc
      WHERE dc.date = $2`,
      [req.user?.id || null, today]
    );

    if (result.rows.length === 0) {
      // Generate new daily challenge
      const seed = `daily-${today}-${Math.random()}`;
      const difficulties = ['easy', 'medium', 'hard', 'expert'];
      const difficulty = difficulties[new Date().getDay() % difficulties.length];

      const insertResult = await query(
        `INSERT INTO daily_challenges (date, maze_seed, difficulty, bonus_points)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [today, seed, difficulty, 50]
      );

      return res.json({
        success: true,
        data: { ...insertResult.rows[0], completed_by_user: false },
      });
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
 * @route   POST /api/v1/challenges/daily/complete
 * @desc    Submit daily challenge completion
 * @access  Private
 */
router.post('/daily/complete', authenticate, async (req, res, next) => {
  try {
    const { score, completionTime, moves } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!score || !completionTime || !moves) {
      throw new AppError('Missing required fields', 400);
    }

    // Get today's challenge
    const challengeResult = await query(
      'SELECT id, bonus_points FROM daily_challenges WHERE date = $1',
      [today]
    );

    if (challengeResult.rows.length === 0) {
      throw new AppError('No daily challenge found', 404);
    }

    const challenge = challengeResult.rows[0];

    // Check if already completed
    const existingCompletion = await query(
      'SELECT id FROM challenge_completions WHERE challenge_id = $1 AND user_id = $2',
      [challenge.id, req.user.id]
    );

    if (existingCompletion.rows.length > 0) {
      throw new AppError('Challenge already completed', 409);
    }

    // Record completion
    const result = await transaction(async (client) => {
      // Insert completion
      await client.query(
        `INSERT INTO challenge_completions (challenge_id, user_id, score, completion_time, moves)
         VALUES ($1, $2, $3, $4, $5)`,
        [challenge.id, req.user.id, score, completionTime, moves]
      );

      // Update user stats
      const finalScore = score + challenge.bonus_points;
      await client.query(
        `UPDATE user_stats
         SET total_score = total_score + $1
         WHERE user_id = $2`,
        [finalScore, req.user.id]
      );

      // Check for achievement (7 day streak)
      const completionCount = await client.query(
        `SELECT COUNT(DISTINCT dc.date)
         FROM challenge_completions cc
         JOIN daily_challenges dc ON cc.challenge_id = dc.id
         WHERE cc.user_id = $1
         AND dc.date > CURRENT_DATE - INTERVAL '7 days'`,
        [req.user.id]
      );

      if (parseInt(completionCount.rows[0].count) >= 7) {
        await client.query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, 'daily_dedication')
           ON CONFLICT DO NOTHING`,
          [req.user.id]
        );
      }

      return { finalScore, bonusPoints: challenge.bonus_points };
    });

    logger.info(`Daily challenge completed by user: ${req.user.id}`, {
      score,
      completionTime,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/challenges/daily/leaderboard
 * @desc    Get daily challenge leaderboard
 * @access  Public
 */
router.get('/daily/leaderboard', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        u.username,
        cc.score,
        cc.completion_time,
        cc.moves,
        cc.completed_at
      FROM challenge_completions cc
      JOIN users u ON cc.user_id = u.id
      JOIN daily_challenges dc ON cc.challenge_id = dc.id
      WHERE dc.date = $1
      ORDER BY cc.score DESC, cc.completion_time ASC
      LIMIT 100`,
      [today]
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
 * @route   GET /api/v1/challenges/tournaments
 * @desc    Get active and upcoming tournaments
 * @access  Public
 */
router.get('/tournaments', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        t.*,
        COUNT(tp.id) as participant_count
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.status IN ('upcoming', 'active')
      GROUP BY t.id
      ORDER BY t.start_time ASC`
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
 * @route   POST /api/v1/challenges/tournaments/:id/join
 * @desc    Join a tournament
 * @access  Private
 */
router.post('/tournaments/:id/join', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tournament
    const tournamentResult = await query(
      `SELECT * FROM tournaments
       WHERE id = $1 AND status = 'upcoming'`,
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      throw new AppError('Tournament not found or already started', 404);
    }

    const tournament = tournamentResult.rows[0];

    // Check participant limit
    if (tournament.max_participants) {
      const participantCount = await query(
        'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
        [id]
      );

      if (parseInt(participantCount.rows[0].count) >= tournament.max_participants) {
        throw new AppError('Tournament is full', 409);
      }
    }

    // Join tournament
    const result = await query(
      `INSERT INTO tournament_participants (tournament_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Already joined this tournament', 409);
    }

    logger.info(`User ${req.user.id} joined tournament ${id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/challenges/tournaments/:id/leaderboard
 * @desc    Get tournament leaderboard
 * @access  Public
 */
router.get('/tournaments/:id/leaderboard', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        u.username,
        tp.best_score,
        tp.best_time,
        tp.rank
      FROM tournament_participants tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.tournament_id = $1
      ORDER BY tp.rank ASC NULLS LAST, tp.best_score DESC
      LIMIT 100`,
      [id]
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
