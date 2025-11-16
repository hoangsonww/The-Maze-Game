const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, transaction } = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const { generateToken, generateRefreshToken, refreshToken: refreshTokenHandler } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      throw new AppError('Please provide username, email, and password', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Username or email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user and stats in transaction
    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (username, email, password_hash, verification_token)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, role, created_at`,
        [username, email, passwordHash, verificationToken]
      );

      const user = userResult.rows[0];

      // Create user stats
      await client.query(
        'INSERT INTO user_stats (user_id) VALUES ($1)',
        [user.id]
      );

      return user;
    });

    // Send verification email (async, don't wait)
    sendEmail({
      to: email,
      subject: 'Verify your Maze Game account',
      text: `Click here to verify: ${process.env.FRONTEND_URL}/verify/${verificationToken}`,
    }).catch(err => logger.error('Failed to send verification email:', err));

    // Generate tokens
    const token = generateToken(result.id, result.role);
    const refreshToken = generateRefreshToken(result.id);

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.id,
          username: result.username,
          email: result.email,
          role: result.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Get user
    const result = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User logged in: ${user.username}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenHandler);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Please provide email', 400);
    }

    // Get user
    const result = await query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click here to reset your password: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
    }).catch(err => logger.error('Failed to send reset email:', err));

    logger.info(`Password reset requested for: ${user.username}`);

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('Please provide token and new password', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Get user with valid token
    const result = await query(
      `SELECT id FROM users
       WHERE reset_password_token = $1
       AND reset_password_expires > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Update password and clear reset token
    await query(
      `UPDATE users
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    logger.info(`Password reset successful for user: ${user.id}`);

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/verify/:token
 * @desc    Verify email
 * @access  Public
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with verification token
    const result = await query(
      'SELECT id FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid verification token', 400);
    }

    // Verify user
    await query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [result.rows[0].id]
    );

    logger.info(`Email verified for user: ${result.rows[0].id}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
