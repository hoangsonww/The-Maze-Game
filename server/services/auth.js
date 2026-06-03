/**
 * Authentication helpers: password hashing (bcrypt) + JWT issue/verify.
 * The signing secret comes from JWT_SECRET; a dev fallback is used locally so
 * the app still boots, with a warning. Always set JWT_SECRET in production.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET || 'dev-insecure-maze-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRATION || '7d';
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set — using an insecure dev secret. Set JWT_SECRET in production.');
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  return jwt.sign({ userId: user.id, username: user.username, role: user.role || 'user' }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
