/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Data-access layer for the gameplay features the public site uses
 * (leaderboard, game sessions, achievements).
 *
 * Three interchangeable drivers expose ONE async interface so routes never
 * care which store is active:
 *
 *   - memory   : process-local (default; also used by unit tests)
 *   - mongo    : MongoDB, database `maze-game`  (ACTIVE in production)
 *   - postgres : PostgreSQL via ./connection + schema-game.sql
 *                (kept fully correct so it can be switched on at any time)
 *
 * Driver selection (resolved fresh on every call so env changes / tests work):
 *   DB_DRIVER = mongo | postgres | memory
 *   If unset: `mongo` when MONGODB_URI is present, otherwise `memory`.
 *
 * Every method returns the SAME shape regardless of driver, e.g. a leaderboard
 * entry is always { id, playerName, score, completionTime, difficulty, moves,
 * timestamp }.
 */

const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Shared achievement catalog (single source of truth for every driver).
// ---------------------------------------------------------------------------

const ACHIEVEMENTS = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Complete your first maze',
    icon: '🏆',
    points: 10,
    category: 'progression',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a maze in under 30 seconds',
    icon: '⚡',
    points: 25,
    category: 'skill',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a maze without using any hints',
    icon: '💎',
    points: 20,
    category: 'skill',
  },
  {
    id: 'efficient',
    name: 'Efficient Navigator',
    description: 'Complete a maze with minimal moves',
    icon: '🎯',
    points: 30,
    category: 'skill',
  },
  {
    id: 'marathon',
    name: 'Marathon Runner',
    description: 'Complete 100 mazes',
    icon: '🏃',
    points: 50,
    category: 'progression',
  },
  {
    id: 'expert_conqueror',
    name: 'Expert Conqueror',
    description: 'Complete an expert difficulty maze',
    icon: '👑',
    points: 40,
    category: 'difficulty',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Win 10 games in a row',
    icon: '🔥',
    points: 35,
    category: 'progression',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play between midnight and 4 AM',
    icon: '🦉',
    points: 15,
    category: 'special',
  },
];

const TIMEFRAME_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

function resolveDriver() {
  const d = (process.env.DB_DRIVER || '').toLowerCase();
  if (d === 'postgres' || d === 'pg') return 'postgres';
  if (d === 'mongo' || d === 'mongodb') return 'mongo';
  if (d === 'memory') return 'memory';
  if (process.env.MONGODB_URI || process.env.MONGO_URL) return 'mongo';
  return 'memory';
}

function sortEntries(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return a.completionTime - b.completionTime;
}

// ===========================================================================
// MEMORY DRIVER
// ===========================================================================

const mem = {
  leaderboard: [],
  sessions: [],
  achievements: {}, // playerId -> [{ id, unlockedAt }]
  seq: 0,
};

const memory = {
  async addLeaderboardEntry(fields) {
    const entry = {
      id: 'lb_' + ++mem.seq,
      playerName: fields.playerName,
      score: fields.score,
      completionTime: fields.completionTime,
      difficulty: fields.difficulty,
      moves: fields.moves,
      timestamp: Date.now(),
    };
    mem.leaderboard.push(entry);
    if (mem.leaderboard.length > 1000) {
      mem.leaderboard.sort(sortEntries);
      mem.leaderboard = mem.leaderboard.slice(0, 1000);
    }
    return entry;
  },

  async listLeaderboard({ timeframe, limit, offset }) {
    let rows = [...mem.leaderboard];
    if (timeframe && timeframe !== 'all' && TIMEFRAME_MS[timeframe]) {
      const cutoff = Date.now() - TIMEFRAME_MS[timeframe];
      rows = rows.filter((e) => e.timestamp > cutoff);
    }
    rows.sort(sortEntries);
    return { total: rows.length, entries: rows.slice(offset, offset + limit) };
  },

  async rankOf(playerName) {
    const sorted = [...mem.leaderboard].sort(sortEntries);
    const idx = sorted.findIndex((e) => e.playerName.toLowerCase() === playerName.toLowerCase());
    if (idx === -1) return null;
    return { rank: idx + 1, entry: sorted[idx], totalEntries: sorted.length };
  },

  async startSession(data) {
    const session = {
      id: 's_' + ++mem.seq,
      playerId: data.playerId || null,
      difficulty: data.difficulty,
      mode: data.mode,
      startTime: Date.now(),
      moves: 0,
      hintsUsed: 0,
      status: 'in_progress',
    };
    mem.sessions.push(session);
    return session;
  },

  async getSession(id) {
    return mem.sessions.find((s) => String(s.id) === String(id)) || null;
  },

  async recordMove(id) {
    const s = await memory.getSession(id);
    if (!s) return null;
    s.moves += 1;
    return s;
  },

  async completeSession(id) {
    const s = await memory.getSession(id);
    if (!s) return null;
    applyCompletion(s);
    return s;
  },

  async sessionStats() {
    return computeStats(mem.sessions.filter((s) => s.status === 'completed'));
  },

  async getUserAchievements(playerId) {
    return mem.achievements[playerId] || [];
  },

  async unlockAchievement(playerId, achievementId) {
    if (!mem.achievements[playerId]) mem.achievements[playerId] = [];
    if (mem.achievements[playerId].some((a) => a.id === achievementId)) return 'exists';
    mem.achievements[playerId].push({ id: achievementId, unlockedAt: new Date().toISOString() });
    return 'ok';
  },
};

// ===========================================================================
// MONGO DRIVER
// ===========================================================================

async function col(name) {
  const { getDb } = require('./mongo');
  const db = await getDb();
  return db.collection(name);
}

function toObjectId(id) {
  try {
    const { ObjectId } = require('mongodb');
    return new ObjectId(id);
  } catch (_) {
    return null;
  }
}

function mapMongoEntry(doc) {
  return {
    id: doc._id.toString(),
    playerName: doc.playerName,
    score: doc.score,
    completionTime: doc.completionTime,
    difficulty: doc.difficulty,
    moves: doc.moves,
    timestamp: doc.timestamp,
  };
}

function mapMongoSession(doc) {
  return {
    id: doc._id.toString(),
    playerId: doc.playerId,
    difficulty: doc.difficulty,
    mode: doc.mode,
    startTime: doc.startTime,
    endTime: doc.endTime,
    completionTime: doc.completionTime,
    moves: doc.moves,
    hintsUsed: doc.hintsUsed,
    score: doc.score,
    status: doc.status,
  };
}

const mongo = {
  async addLeaderboardEntry(fields) {
    const c = await col('leaderboard');
    const doc = {
      playerName: fields.playerName,
      score: fields.score,
      completionTime: fields.completionTime,
      difficulty: fields.difficulty,
      moves: fields.moves,
      timestamp: Date.now(),
    };
    const res = await c.insertOne(doc);
    return mapMongoEntry({ ...doc, _id: res.insertedId });
  },

  async listLeaderboard({ timeframe, limit, offset }) {
    const c = await col('leaderboard');
    const filter = {};
    if (timeframe && timeframe !== 'all' && TIMEFRAME_MS[timeframe]) {
      filter.timestamp = { $gt: Date.now() - TIMEFRAME_MS[timeframe] };
    }
    const total = await c.countDocuments(filter);
    const docs = await c
      .find(filter)
      .sort({ score: -1, completionTime: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return { total, entries: docs.map(mapMongoEntry) };
  },

  async rankOf(playerName) {
    const c = await col('leaderboard');
    const docs = await c.find({}).sort({ score: -1, completionTime: 1 }).toArray();
    const idx = docs.findIndex((d) => d.playerName.toLowerCase() === playerName.toLowerCase());
    if (idx === -1) return null;
    return { rank: idx + 1, entry: mapMongoEntry(docs[idx]), totalEntries: docs.length };
  },

  async startSession(data) {
    const c = await col('game_sessions');
    const doc = {
      playerId: data.playerId || null,
      difficulty: data.difficulty,
      mode: data.mode,
      startTime: Date.now(),
      endTime: null,
      completionTime: null,
      moves: 0,
      hintsUsed: 0,
      score: null,
      status: 'in_progress',
    };
    const res = await c.insertOne(doc);
    return mapMongoSession({ ...doc, _id: res.insertedId });
  },

  async getSession(id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    const c = await col('game_sessions');
    const doc = await c.findOne({ _id: oid });
    return doc ? mapMongoSession(doc) : null;
  },

  async recordMove(id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    const c = await col('game_sessions');
    const res = await c.findOneAndUpdate(
      { _id: oid },
      { $inc: { moves: 1 } },
      { returnDocument: 'after' }
    );
    const doc = res && (res.value || res); // driver version compatibility
    return doc && doc._id ? mapMongoSession(doc) : null;
  },

  async completeSession(id) {
    const session = await mongo.getSession(id);
    if (!session) return null;
    applyCompletion(session);
    const c = await col('game_sessions');
    await c.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          status: session.status,
          endTime: session.endTime,
          completionTime: session.completionTime,
          score: session.score,
        },
      }
    );
    return session;
  },

  async sessionStats() {
    const c = await col('game_sessions');
    const docs = await c.find({ status: 'completed' }).toArray();
    return computeStats(docs.map(mapMongoSession));
  },

  async getUserAchievements(playerId) {
    const c = await col('player_achievements');
    const docs = await c.find({ playerId }).toArray();
    return docs.map((d) => ({ id: d.achievementId, unlockedAt: d.unlockedAt }));
  },

  async unlockAchievement(playerId, achievementId) {
    const c = await col('player_achievements');
    const existing = await c.findOne({ playerId, achievementId });
    if (existing) return 'exists';
    await c.insertOne({ playerId, achievementId, unlockedAt: new Date().toISOString() });
    return 'ok';
  },
};

// ===========================================================================
// POSTGRES DRIVER (no-op at runtime today, but correct & ready to switch on)
// ===========================================================================

function pg() {
  return require('./connection');
}

function mapPgEntry(row) {
  return {
    id: row.id,
    playerName: row.player_name,
    score: row.score,
    completionTime: row.completion_time,
    difficulty: row.difficulty,
    moves: row.moves,
    timestamp: Number(row.created_at_ms),
  };
}

function mapPgSession(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    difficulty: row.difficulty,
    mode: row.mode,
    startTime: Number(row.start_time),
    endTime: row.end_time != null ? Number(row.end_time) : undefined,
    completionTime: row.completion_time,
    moves: row.moves,
    hintsUsed: row.hints_used,
    score: row.score,
    status: row.status,
  };
}

const postgres = {
  async addLeaderboardEntry(fields) {
    const { rows } = await pg().query(
      `INSERT INTO leaderboard_entries (player_name, score, completion_time, difficulty, moves)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, player_name, score, completion_time, difficulty, moves,
                 (extract(epoch from created_at) * 1000)::bigint AS created_at_ms`,
      [fields.playerName, fields.score, fields.completionTime, fields.difficulty, fields.moves]
    );
    return mapPgEntry(rows[0]);
  },

  async listLeaderboard({ timeframe, limit, offset }) {
    const params = [];
    let where = '';
    if (timeframe && timeframe !== 'all' && TIMEFRAME_MS[timeframe]) {
      params.push(Math.round(TIMEFRAME_MS[timeframe] / 1000));
      where = `WHERE created_at > now() - ($${params.length} * interval '1 second')`;
    }
    const totalRes = await pg().query(
      `SELECT count(*)::int AS total FROM leaderboard_entries ${where}`,
      params
    );
    const total = totalRes.rows[0].total;

    const lParams = [...params, limit, offset];
    const { rows } = await pg().query(
      `SELECT id, player_name, score, completion_time, difficulty, moves,
              (extract(epoch from created_at) * 1000)::bigint AS created_at_ms
         FROM leaderboard_entries ${where}
        ORDER BY score DESC, completion_time ASC
        LIMIT $${lParams.length - 1} OFFSET $${lParams.length}`,
      lParams
    );
    return { total, entries: rows.map(mapPgEntry) };
  },

  async rankOf(playerName) {
    const { rows } = await pg().query(
      `SELECT id, player_name, score, completion_time, difficulty, moves,
              (extract(epoch from created_at) * 1000)::bigint AS created_at_ms
         FROM leaderboard_entries
        ORDER BY score DESC, completion_time ASC`
    );
    const idx = rows.findIndex((r) => r.player_name.toLowerCase() === playerName.toLowerCase());
    if (idx === -1) return null;
    return { rank: idx + 1, entry: mapPgEntry(rows[idx]), totalEntries: rows.length };
  },

  async startSession(data) {
    const { rows } = await pg().query(
      `INSERT INTO game_sessions_anon (player_id, difficulty, mode, start_time, moves, hints_used, status)
       VALUES ($1, $2, $3, $4, 0, 0, 'in_progress')
       RETURNING *`,
      [data.playerId || null, data.difficulty, data.mode, Date.now()]
    );
    return mapPgSession(rows[0]);
  },

  async getSession(id) {
    try {
      const { rows } = await pg().query('SELECT * FROM game_sessions_anon WHERE id = $1', [id]);
      return rows[0] ? mapPgSession(rows[0]) : null;
    } catch (_) {
      return null; // malformed uuid etc.
    }
  },

  async recordMove(id) {
    try {
      const { rows } = await pg().query(
        'UPDATE game_sessions_anon SET moves = moves + 1 WHERE id = $1 RETURNING *',
        [id]
      );
      return rows[0] ? mapPgSession(rows[0]) : null;
    } catch (_) {
      return null;
    }
  },

  async completeSession(id) {
    const session = await postgres.getSession(id);
    if (!session) return null;
    applyCompletion(session);
    await pg().query(
      `UPDATE game_sessions_anon
          SET status = $2, end_time = $3, completion_time = $4, score = $5
        WHERE id = $1`,
      [id, session.status, session.endTime, session.completionTime, session.score]
    );
    return session;
  },

  async sessionStats() {
    const { rows } = await pg().query(
      `SELECT count(*)::int AS "totalGames",
              coalesce(avg(completion_time), 0)::float AS "averageCompletionTime",
              coalesce(avg(moves), 0)::float AS "averageMoves",
              coalesce(avg(score), 0)::float AS "averageScore"
         FROM game_sessions_anon
        WHERE status = 'completed'`
    );
    return rows[0];
  },

  async getUserAchievements(playerId) {
    const { rows } = await pg().query(
      'SELECT achievement_id, unlocked_at FROM player_achievements WHERE player_id = $1',
      [playerId]
    );
    return rows.map((r) => ({ id: r.achievement_id, unlockedAt: r.unlocked_at }));
  },

  async unlockAchievement(playerId, achievementId) {
    const existing = await pg().query(
      'SELECT 1 FROM player_achievements WHERE player_id = $1 AND achievement_id = $2',
      [playerId, achievementId]
    );
    if (existing.rows.length) return 'exists';
    await pg().query(
      'INSERT INTO player_achievements (player_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [playerId, achievementId]
    );
    return 'ok';
  },
};

// ---------------------------------------------------------------------------
// Shared helpers (driver-independent business logic)
// ---------------------------------------------------------------------------

const DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2, expert: 3 };

function applyCompletion(session) {
  session.status = 'completed';
  session.endTime = Date.now();
  session.completionTime = session.endTime - Number(session.startTime);
  const base = 100;
  const timePenalty = Math.floor(session.completionTime / 1000) * 0.1;
  const movePenalty = session.moves * 0.5;
  const hintPenalty = (session.hintsUsed || 0) * 10;
  const mult = DIFFICULTY_MULTIPLIER[session.difficulty] || 1;
  session.score = Math.max(0, Math.round((base - timePenalty - movePenalty - hintPenalty) * mult));
}

function computeStats(completed) {
  const n = completed.length;
  const sum = (key) => completed.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);
  return {
    totalGames: n,
    averageCompletionTime: n ? sum('completionTime') / n : 0,
    averageMoves: n ? sum('moves') / n : 0,
    averageScore: n ? sum('score') / n : 0,
  };
}

const DRIVERS = { memory, mongo, postgres };

function active() {
  return DRIVERS[resolveDriver()];
}

// ---------------------------------------------------------------------------
// Public interface — thin pass-through to the active driver.
// ---------------------------------------------------------------------------

module.exports = {
  ACHIEVEMENTS,
  resolveDriver,

  leaderboard: {
    add: (fields) => active().addLeaderboardEntry(fields),
    list: (opts) => active().listLeaderboard(opts),
    rank: (playerName) => active().rankOf(playerName),
  },

  games: {
    start: (data) => active().startSession(data),
    get: (id) => active().getSession(id),
    recordMove: (id) => active().recordMove(id),
    complete: (id) => active().completeSession(id),
    stats: () => active().sessionStats(),
  },

  achievements: {
    catalog: () => ACHIEVEMENTS,
    async getUser(playerId) {
      const unlocked = await active().getUserAchievements(playerId);
      const unlockedMap = new Map(unlocked.map((u) => [u.id, u.unlockedAt]));
      const achievements = ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id) || null,
      }));
      const totalPoints = ACHIEVEMENTS.reduce(
        (sum, a) => sum + (unlockedMap.has(a.id) ? a.points : 0),
        0
      );
      return { achievements, totalPoints };
    },
    unlock: (playerId, achievementId) => active().unlockAchievement(playerId, achievementId),
  },
};

// Surface the resolved driver once at load for operational visibility.
try {
  logger.info(`Repository driver: ${resolveDriver()}`);
} catch (_) {
  /* logger may be unavailable in some test contexts */
}
