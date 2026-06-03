/**
 * MongoDB connection (the ACTIVE datastore).
 *
 * Database name defaults to `maze-game`. Connection is lazy and cached on the
 * Node global so that serverless (Vercel) invocations reuse a single client
 * across warm starts instead of opening a new pool on every request.
 *
 * The `mongodb` driver is required lazily so the rest of the app (memory /
 * postgres drivers, unit tests) keeps working even if the package is absent.
 */

const logger = require('../utils/logger');

const DB_NAME = process.env.MONGODB_DB || 'maze-game';

// Reuse across hot serverless invocations.
let cache = global.__mazeMongo;
if (!cache) {
  cache = global.__mazeMongo = { client: null, db: null, promise: null };
}

function getUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URL || '';
}

function isConfigured() {
  return Boolean(getUri());
}

async function getDb() {
  if (cache.db) return cache.db;

  const uri = getUri();
  if (!uri) throw new Error('MONGODB_URI is not configured');

  if (!cache.promise) {
    const { MongoClient } = require('mongodb'); // lazy
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    cache.promise = client
      .connect()
      .then((connected) => {
        cache.client = connected;
        cache.db = connected.db(DB_NAME);
        logger.info(`MongoDB connected (db: ${DB_NAME})`);
        return cache.db;
      })
      .catch((err) => {
        cache.promise = null; // allow retry on next request
        throw err;
      });
  }

  await cache.promise;
  return cache.db;
}

async function close() {
  if (cache.client) {
    await cache.client.close();
    cache.client = null;
    cache.db = null;
    cache.promise = null;
  }
}

module.exports = { getDb, isConfigured, close, DB_NAME };
