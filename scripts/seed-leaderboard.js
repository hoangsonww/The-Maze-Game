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
 * Seed the leaderboard with random demo entries (via the active repository
 * driver — Mongo when MONGODB_URI is set, otherwise in-memory which is a no-op
 * across runs).
 *
 * Usage: node scripts/seed-leaderboard.js [count=25]
 */

require('dotenv').config();

const { leaderboard, resolveDriver } = require('../server/database/repository');

const NAMES = [
  'Ada',
  'Linus',
  'Grace',
  'Dennis',
  'Margaret',
  'Alan',
  'Edsger',
  'Barbara',
  'Ken',
  'Radia',
];
const DIFFS = ['easy', 'medium', 'hard', 'expert'];
const rand = (n) => Math.floor(Math.random() * n);

(async () => {
  const count = Math.max(1, parseInt(process.argv[2], 10) || 25);
  console.log(`Seeding ${count} leaderboard entries (driver: ${resolveDriver()})…`);
  for (let i = 0; i < count; i++) {
    await leaderboard.add({
      playerName: `${NAMES[rand(NAMES.length)]}${rand(1000)}`,
      score: 20 + rand(280),
      completionTime: 8000 + rand(120000),
      difficulty: DIFFS[rand(DIFFS.length)],
      moves: 20 + rand(400),
    });
  }
  const { total } = await leaderboard.list({ timeframe: 'all', limit: 1, offset: 0 });
  console.log(`Done. Leaderboard now holds ${total} entries.`);
  process.exit(0);
})().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
