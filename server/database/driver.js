/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Shared datastore-driver resolver (kept in its own module so both the gameplay
 * repository and the users repository can use it without a circular import).
 *
 *   DB_DRIVER = mongo | postgres | memory
 *   If unset: `mongo` when MONGODB_URI is present, otherwise `memory`.
 */
function resolveDriver() {
  const d = (process.env.DB_DRIVER || '').toLowerCase();
  if (d === 'postgres' || d === 'pg') return 'postgres';
  if (d === 'mongo' || d === 'mongodb') return 'mongo';
  if (d === 'memory') return 'memory';
  if (process.env.MONGODB_URI || process.env.MONGO_URL) return 'mongo';
  return 'memory';
}

module.exports = { resolveDriver };
