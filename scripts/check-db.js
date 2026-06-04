#!/usr/bin/env node
/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Check datastore connectivity for the configured driver(s).
 *
 * Pings MongoDB when MONGODB_URI is set and PostgreSQL when DATABASE_URL/DB_HOST
 * is set. Exits non-zero if a configured store is unreachable.
 *
 * Usage: MONGODB_URI=... node scripts/check-db.js
 */

require('dotenv').config();

const { resolveDriver } = require('../server/database/driver');

async function checkMongo() {
  const { getDb, isConfigured, DB_NAME } = require('../server/database/mongo');
  if (!isConfigured()) return null;
  const t0 = Date.now();
  const db = await getDb();
  await db.command({ ping: 1 });
  return `MongoDB OK (db: ${DB_NAME}, ${Date.now() - t0}ms)`;
}

async function checkPostgres() {
  const conn = require('../server/database/connection');
  if (!conn.isConfigured()) return null;
  const t0 = Date.now();
  await conn.query('SELECT 1');
  await conn.gracefulShutdown();
  return `PostgreSQL OK (${Date.now() - t0}ms)`;
}

(async () => {
  console.log('Active driver:', resolveDriver());
  let failed = false;
  for (const [name, fn] of [
    ['mongo', checkMongo],
    ['postgres', checkPostgres],
  ]) {
    try {
      const msg = await fn();
      if (msg) console.log('  ✓', msg);
      else console.log(`  – ${name}: not configured`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
})();
