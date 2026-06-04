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
 * Write the OpenAPI spec (from server/swagger.js) to a file.
 *
 * Usage: node scripts/export-openapi.js [outFile=openapi.json]
 */

const fs = require('fs');
const { spec } = require('../server/swagger');

const out = process.argv[2] || 'openapi.json';
fs.writeFileSync(out, JSON.stringify(spec, null, 2) + '\n');

const ops = Object.values(spec.paths).reduce(
  (n, item) =>
    n +
    Object.keys(item).filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m)).length,
  0
);
console.log(
  `Wrote ${out} — OpenAPI ${spec.openapi}, ${Object.keys(spec.paths).length} paths, ${ops} operations.`
);
