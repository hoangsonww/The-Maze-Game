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
 * Smoke-test a running API: hit the public endpoints and assert they respond.
 *
 * Usage:
 *   node scripts/smoke-test.js [baseUrl]
 *   API_BASE=https://maze-game-api.vercel.app node scripts/smoke-test.js
 *
 * Exits non-zero if any check fails.
 */

const BASE = (process.argv[2] || process.env.API_BASE || 'http://localhost:3000').replace(
  /\/$/,
  ''
);

const checks = [];
function check(name, ok, extra) {
  checks.push({ name, ok: Boolean(ok), extra: extra || '' });
}

async function json(path, opts) {
  const res = await fetch(BASE + path, opts);
  let body = {};
  try {
    body = await res.json();
  } catch (_) {
    /* non-JSON */
  }
  return { status: res.status, body };
}

(async () => {
  console.log(`Smoke-testing ${BASE}\n`);
  try {
    const health = await json('/api/health');
    check(
      'GET /api/health',
      health.status === 200 && health.body.status === 'healthy',
      `driver=${health.body.dbDriver}`
    );

    const docs = await fetch(BASE + '/openapi.json');
    check('GET /openapi.json', docs.status === 200);

    const lb = await json('/api/v1/leaderboard?limit=3');
    check('GET /api/v1/leaderboard', lb.status === 200 && Array.isArray(lb.body.data));

    const start = await json('/api/v1/games/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 'smoke', difficulty: 'medium' }),
    });
    check(
      'POST /api/v1/games/start',
      start.status === 201 && start.body.data?.status === 'in_progress'
    );

    const ach = await json('/api/v1/achievements');
    check('GET /api/v1/achievements', ach.status === 200 && ach.body.count > 0);
  } catch (err) {
    check('connection', false, err.message);
  }

  let ok = true;
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.extra ? `  [${c.extra}]` : ''}`);
    if (!c.ok) ok = false;
  }
  console.log(ok ? '\nAll smoke checks passed.' : '\nSmoke checks FAILED.');
  process.exit(ok ? 0 : 1);
})();
