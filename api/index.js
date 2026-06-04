/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Vercel serverless entrypoint.
 *
 * An Express app is itself a valid (req, res) handler, so we export the shared
 * app directly. All requests are routed here via the rewrite in vercel.json,
 * and Express dispatches internally (/, /api-docs, /openapi.json, /api/**).
 *
 * Socket.IO / multiplayer is intentionally not wired here — it requires a
 * long-lived server and is only available via `npm start` (server/index.js).
 */

module.exports = require('../server/app');
