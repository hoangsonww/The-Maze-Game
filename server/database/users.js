/**
 * User accounts + per-user stats / progress tracking.
 *
 * Same three-driver model as the gameplay repository:
 *   - memory   (default / tests)
 *   - mongo    (ACTIVE — collection `users` in db `maze-game`)
 *   - postgres (ready — table `users_app` in schema-game.sql, stats in JSONB)
 *
 * Passwords are never stored or returned here in plaintext; the route layer
 * hashes them (server/services/auth.js) and passes `passwordHash` in. Every
 * read returns a SANITIZED user (no hash / lowercase index fields) except
 * `findByLogin`, which the login flow needs in order to verify the password.
 */

const { resolveDriver } = require('./driver');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

function emptyDifficulty() {
  return { played: 0, won: 0, bestTime: null, bestScore: 0 };
}

function blankStats() {
  const byDifficulty = {};
  for (const d of DIFFICULTIES) byDifficulty[d] = emptyDifficulty();
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    bestScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeMs: 0,
    byDifficulty,
  };
}

// Apply one finished game to a stats object (mutates + returns it).
function applyGame(stats, { difficulty, score = 0, timeMs = 0, moves = 0, won = false }) {
  const d = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
  if (!stats.byDifficulty) stats.byDifficulty = blankStats().byDifficulty;
  if (!stats.byDifficulty[d]) stats.byDifficulty[d] = emptyDifficulty();

  stats.gamesPlayed += 1;
  stats.totalScore += score;
  stats.totalTimeMs += timeMs;
  stats.byDifficulty[d].played += 1;

  if (won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.bestScore = Math.max(stats.bestScore, score);
    const bd = stats.byDifficulty[d];
    bd.won += 1;
    bd.bestScore = Math.max(bd.bestScore, score);
    bd.bestTime = bd.bestTime == null ? timeMs : Math.min(bd.bestTime, timeMs);
  } else {
    stats.currentStreak = 0;
  }
  return stats;
}

// Derived figures + leveling for the profile view.
function decorateStats(stats) {
  const s = stats || blankStats();
  const winRate = s.gamesPlayed ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0;
  const level = Math.floor(Math.sqrt(s.totalScore / 50)) + 1;
  const curFloor = Math.pow(level - 1, 2) * 50;
  const nextFloor = Math.pow(level, 2) * 50;
  const levelProgress =
    nextFloor > curFloor
      ? Math.min(100, Math.round(((s.totalScore - curFloor) / (nextFloor - curFloor)) * 100))
      : 0;
  return { ...s, winRate, level, levelProgress, nextLevelScore: nextFloor };
}

function newUserDoc({ username, email, passwordHash }) {
  return {
    username,
    usernameLower: username.toLowerCase(),
    email,
    emailLower: email.toLowerCase(),
    passwordHash,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stats: blankStats(),
    recentGames: [],
  };
}

function sanitize(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    username: doc.username,
    email: doc.email,
    role: doc.role || 'user',
    createdAt: doc.createdAt,
    lastLogin: doc.lastLogin,
    stats: doc.stats || blankStats(),
    recentGames: doc.recentGames || [],
  };
}

function pushRecent(doc, game) {
  doc.recentGames = [game, ...(doc.recentGames || [])].slice(0, 20);
}

// ===========================================================================
// MEMORY
// ===========================================================================
const store = { users: [], seq: 0 };

const memory = {
  async findByUsername(username) {
    return store.users.find((u) => u.usernameLower === username.toLowerCase()) || null;
  },
  async findByEmail(email) {
    return store.users.find((u) => u.emailLower === email.toLowerCase()) || null;
  },
  async findByLogin(login) {
    const l = login.toLowerCase();
    return store.users.find((u) => u.usernameLower === l || u.emailLower === l) || null;
  },
  async findById(id) {
    return store.users.find((u) => u.id === id) || null;
  },
  async create(fields) {
    const doc = { id: 'u_' + ++store.seq, ...newUserDoc(fields) };
    store.users.push(doc);
    return doc;
  },
  async touchLogin(id) {
    const u = await memory.findById(id);
    if (u) u.lastLogin = new Date().toISOString();
  },
  async recordGame(id, result) {
    const u = await memory.findById(id);
    if (!u) return null;
    applyGame(u.stats, result);
    pushRecent(u, { ...result, at: new Date().toISOString() });
    return u.stats;
  },
  async updatePassword(id, passwordHash) {
    const u = await memory.findById(id);
    if (!u) return false;
    u.passwordHash = passwordHash;
    return true;
  },
  async updateProfile(id, fields) {
    const u = await memory.findById(id);
    if (!u) return null;
    if (fields.username) {
      u.username = fields.username;
      u.usernameLower = fields.username.toLowerCase();
    }
    if (fields.email) {
      u.email = fields.email;
      u.emailLower = fields.email.toLowerCase();
    }
    return u;
  },
};

// ===========================================================================
// MONGO
// ===========================================================================
async function usersCol() {
  const { getDb } = require('./mongo');
  const db = await getDb();
  const col = db.collection('users');
  await col.createIndex({ usernameLower: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ emailLower: 1 }, { unique: true }).catch(() => {});
  return col;
}
function fromMongo(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}
function toObjectId(id) {
  try {
    const { ObjectId } = require('mongodb');
    return new ObjectId(id);
  } catch (_) {
    return null;
  }
}

const mongo = {
  async findByUsername(username) {
    return fromMongo(await (await usersCol()).findOne({ usernameLower: username.toLowerCase() }));
  },
  async findByEmail(email) {
    return fromMongo(await (await usersCol()).findOne({ emailLower: email.toLowerCase() }));
  },
  async findByLogin(login) {
    const l = login.toLowerCase();
    return fromMongo(
      await (await usersCol()).findOne({ $or: [{ usernameLower: l }, { emailLower: l }] })
    );
  },
  async findById(id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    return fromMongo(await (await usersCol()).findOne({ _id: oid }));
  },
  async create(fields) {
    const doc = newUserDoc(fields);
    const res = await (await usersCol()).insertOne(doc);
    return fromMongo({ ...doc, _id: res.insertedId });
  },
  async touchLogin(id) {
    const oid = toObjectId(id);
    if (oid)
      await (
        await usersCol()
      ).updateOne({ _id: oid }, { $set: { lastLogin: new Date().toISOString() } });
  },
  async recordGame(id, result) {
    const u = await mongo.findById(id);
    if (!u) return null;
    const stats = applyGame(u.stats || blankStats(), result);
    const recentGames = [
      { ...result, at: new Date().toISOString() },
      ...(u.recentGames || []),
    ].slice(0, 20);
    await (await usersCol()).updateOne({ _id: toObjectId(id) }, { $set: { stats, recentGames } });
    return stats;
  },
  async updatePassword(id, passwordHash) {
    const oid = toObjectId(id);
    if (!oid) return false;
    const res = await (await usersCol()).updateOne({ _id: oid }, { $set: { passwordHash } });
    return res.matchedCount > 0;
  },
  async updateProfile(id, fields) {
    const oid = toObjectId(id);
    if (!oid) return null;
    const set = {};
    if (fields.username) {
      set.username = fields.username;
      set.usernameLower = fields.username.toLowerCase();
    }
    if (fields.email) {
      set.email = fields.email;
      set.emailLower = fields.email.toLowerCase();
    }
    if (Object.keys(set).length) await (await usersCol()).updateOne({ _id: oid }, { $set: set });
    return mongo.findById(id);
  },
};

// ===========================================================================
// POSTGRES (users_app table; stats + recentGames as JSONB)
// ===========================================================================
function pg() {
  return require('./connection');
}
function fromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    usernameLower: row.username_lower,
    email: row.email,
    emailLower: row.email_lower,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    stats: row.stats || blankStats(),
    recentGames: row.recent_games || [],
  };
}

const postgres = {
  async findByUsername(username) {
    const { rows } = await pg().query('SELECT * FROM users_app WHERE username_lower = $1', [
      username.toLowerCase(),
    ]);
    return fromPg(rows[0]);
  },
  async findByEmail(email) {
    const { rows } = await pg().query('SELECT * FROM users_app WHERE email_lower = $1', [
      email.toLowerCase(),
    ]);
    return fromPg(rows[0]);
  },
  async findByLogin(login) {
    const { rows } = await pg().query(
      'SELECT * FROM users_app WHERE username_lower = $1 OR email_lower = $1',
      [login.toLowerCase()]
    );
    return fromPg(rows[0]);
  },
  async findById(id) {
    try {
      const { rows } = await pg().query('SELECT * FROM users_app WHERE id = $1', [id]);
      return fromPg(rows[0]);
    } catch (_) {
      return null;
    }
  },
  async create(fields) {
    const doc = newUserDoc(fields);
    const { rows } = await pg().query(
      `INSERT INTO users_app
         (username, username_lower, email, email_lower, password_hash, role, stats, recent_games)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        doc.username,
        doc.usernameLower,
        doc.email,
        doc.emailLower,
        doc.passwordHash,
        doc.role,
        JSON.stringify(doc.stats),
        JSON.stringify(doc.recentGames),
      ]
    );
    return fromPg(rows[0]);
  },
  async touchLogin(id) {
    await pg().query('UPDATE users_app SET last_login = now() WHERE id = $1', [id]);
  },
  async recordGame(id, result) {
    const u = await postgres.findById(id);
    if (!u) return null;
    const stats = applyGame(u.stats || blankStats(), result);
    const recentGames = [
      { ...result, at: new Date().toISOString() },
      ...(u.recentGames || []),
    ].slice(0, 20);
    await pg().query('UPDATE users_app SET stats = $2, recent_games = $3 WHERE id = $1', [
      id,
      JSON.stringify(stats),
      JSON.stringify(recentGames),
    ]);
    return stats;
  },
  async updatePassword(id, passwordHash) {
    const res = await pg().query('UPDATE users_app SET password_hash = $2 WHERE id = $1', [
      id,
      passwordHash,
    ]);
    return res.rowCount > 0;
  },
  async updateProfile(id, fields) {
    const sets = [];
    const params = [id];
    let i = 2;
    if (fields.username) {
      sets.push(`username = $${i++}`, `username_lower = $${i++}`);
      params.push(fields.username, fields.username.toLowerCase());
    }
    if (fields.email) {
      sets.push(`email = $${i++}`, `email_lower = $${i++}`);
      params.push(fields.email, fields.email.toLowerCase());
    }
    if (sets.length) {
      await pg().query(`UPDATE users_app SET ${sets.join(', ')} WHERE id = $1`, params);
    }
    return postgres.findById(id);
  },
};

const DRIVERS = { memory, mongo, postgres };
function active() {
  return DRIVERS[resolveDriver()];
}

module.exports = {
  blankStats,
  decorateStats,
  sanitize,
  findByUsername: (u) => active().findByUsername(u),
  findByEmail: (e) => active().findByEmail(e),
  findByLogin: (l) => active().findByLogin(l),
  findById: (id) => active().findById(id),
  create: (fields) => active().create(fields),
  touchLogin: (id) => active().touchLogin(id),
  recordGame: (id, result) => active().recordGame(id, result),
  updatePassword: (id, hash) => active().updatePassword(id, hash),
  updateProfile: (id, fields) => active().updateProfile(id, fields),
  async profile(id) {
    const u = await active().findById(id);
    if (!u) return null;
    const clean = sanitize(u);
    return { ...clean, stats: decorateStats(clean.stats) };
  },
};
