/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Auth middleware — verifies a Bearer JWT and loads the user from the active
 * datastore (mongo / postgres / memory) via the users repository.
 */

const { AppError } = require('./errorHandler');
const { verifyToken } = require('../services/auth');
const users = require('../database/users');

async function userFromRequest(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const decoded = verifyToken(header.substring(7));
  const user = await users.findById(decoded.userId);
  return user ? users.sanitize(user) : null;
}

// Require a valid token.
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    const user = await userFromRequest(req);
    if (!user) throw new AppError('User not found', 401);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') next(new AppError('Token expired', 401));
    else if (error.name === 'JsonWebTokenError') next(new AppError('Invalid token', 401));
    else next(error);
  }
};

// Attach req.user when a valid token is present; never fail otherwise.
const optionalAuthenticate = async (req, res, next) => {
  try {
    req.user = (await userFromRequest(req)) || undefined;
  } catch (_) {
    /* ignore for optional auth */
  }
  next();
};

// Restrict to specific roles (used by admin routes).
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) return next(new AppError('Insufficient permissions', 403));
    next();
  };

module.exports = { authenticate, optionalAuthenticate, authorize };
