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
 * Remove leaderboard entries from MongoDB by player name (exact or prefix).
 *
 * Usage:
 *   MONGODB_URI=... node scripts/clean-leaderboard.js "E2E_*"
 *   MONGODB_URI=... node scripts/clean-leaderboard.js "E2E_*" "tester*" "SomeExactName"
 *
 * A trailing "*" matches by prefix; otherwise the name must match exactly.
 * Defaults to removing the test rows seeded during development (E2E_* / tester*).
 *
 * Also available via: npm run clean:leaderboard -- "E2E_*"
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
const dbName = process.env.MONGODB_DB || 'maze-game';

if (!uri) {
  console.error(
    'MONGODB_URI is not set. Example:\n  MONGODB_URI="mongodb+srv://..." npm run clean:leaderboard -- "E2E_*"'
  );
  process.exit(1);
}

const patterns = process.argv.slice(2);
const targets = patterns.length ? patterns : ['E2E_*', 'tester*'];

function toFilter(p) {
  if (p.endsWith('*')) {
    const prefix = p.slice(0, -1);
    return { playerName: { $regex: '^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } };
  }
  return { playerName: p };
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection('leaderboard');
    let total = 0;
    for (const p of targets) {
      const filter = toFilter(p);
      const { deletedCount } = await col.deleteMany(filter);
      total += deletedCount;
      console.log(
        `Removed ${deletedCount} entr${deletedCount === 1 ? 'y' : 'ies'} matching "${p}"`
      );
    }
    console.log(
      `Done. ${total} leaderboard entr${total === 1 ? 'y' : 'ies'} removed from db "${dbName}".`
    );
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
