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
 * Build the static frontend into `frontend-dist/`.
 *
 * The game is vanilla HTML/CSS/JS (deployed to GitHub Pages), so the "build" is
 * a deterministic assembly of the deployable static assets plus a build-info
 * manifest. The same output is served by the frontend Docker image and uploaded
 * as a CI artifact.
 *
 * Usage: node scripts/build-frontend.js [outDir]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'frontend-dist'));

// Everything the static site needs to run.
const ASSETS = [
  'index.html',
  '404.html',
  'manifest.json',
  'service-worker.js',
  'robots.txt',
  'sitemap.xml',
  'src/css',
  'src/js',
  'src/html',
  'utils',
];

function copy(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) {
    console.warn(`  skip (missing): ${rel}`);
    return;
  }
  const dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

console.log('Assembling frontend →', path.relative(root, outDir) || outDir);
for (const asset of ASSETS) copy(asset);

let files = 0;
let bytes = 0;
walk(outDir, (p) => {
  files += 1;
  bytes += fs.statSync(p).size;
});

let commit = process.env.GITHUB_SHA || 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
} catch (_) {
  /* not a git checkout */
}

const info = {
  builtAt: new Date().toISOString(),
  commit,
  files,
  bytes,
};
fs.writeFileSync(path.join(outDir, 'build-info.json'), JSON.stringify(info, null, 2));

console.log(`Done: ${files} files, ${(bytes / 1024).toFixed(1)} KiB (commit ${commit}).`);
