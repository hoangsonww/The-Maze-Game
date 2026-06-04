#!/usr/bin/env node
/**
 * Generate a cryptographically-strong secret (e.g. for JWT_SECRET).
 *
 * Usage: node scripts/gen-secret.js [bytes=48]
 *   node scripts/gen-secret.js          # 96-char hex
 *   node scripts/gen-secret.js 64       # 128-char hex
 */

const crypto = require('crypto');

const bytes = Math.max(16, parseInt(process.argv[2], 10) || 48);
process.stdout.write(crypto.randomBytes(bytes).toString('hex') + '\n');
