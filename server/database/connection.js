/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * PostgreSQL connection (currently a no-op in production — Mongo is the active
 * store — but kept fully functional so it can be switched on at any time via
 * DB_DRIVER=postgres).
 *
 * The pool is created lazily on first use and cached on the Node global so a
 * serverless (Vercel) function reuses one pool across warm invocations.
 */

function isConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.DB_HOST ||
      (process.env.DB_DRIVER || '').toLowerCase().startsWith('p')
  );
}

function buildConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'maze_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

function getPool() {
  if (!global.__mazePgPool) {
    const pool = new Pool(buildConfig());
    pool.on('connect', () => logger.info('PostgreSQL connected'));
    // Log idle-client errors instead of crashing the process (fatal on serverless).
    pool.on('error', (err) => logger.error('Unexpected PostgreSQL error', { error: err.message }));
    global.__mazePgPool = pool;
  }
  return global.__mazePgPool;
}

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    logger.debug('Executed query', { text, duration: Date.now() - start, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const gracefulShutdown = async () => {
  if (global.__mazePgPool) {
    logger.info('Closing PostgreSQL connections...');
    await global.__mazePgPool.end();
    global.__mazePgPool = null;
    logger.info('PostgreSQL connections closed');
  }
};

module.exports = {
  query,
  transaction,
  getPool,
  isConfigured,
  gracefulShutdown,
  // Backwards-compatible lazy `pool` accessor.
  get pool() {
    return getPool();
  },
};
