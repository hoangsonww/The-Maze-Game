# 🎮 The Maze Game - Production Ready

<div align="center">

![The Maze Game](./utils/MazeUI.png)

**A fully-featured maze game: procedural mazes, difficulty levels, A\* hints, accounts, per-user stats & progress, achievements, global leaderboards, and multiplayer — with a MongoDB-backed, Vercel-deployable API documented in Swagger.**

<!-- Project status -->

[![CI/CD](https://github.com/hoangsonww/The-Maze-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangsonww/The-Maze-Game/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34.svg?style=flat)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/hoangsonww/The-Maze-Game/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoangsonww/The-Maze-Game/pulls)
[![Jest](https://img.shields.io/badge/tests-53%20passing-success.svg?logo=jest&logoColor=white)](./__tests__)

<!-- Languages -->

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![TypeScript-ready](https://img.shields.io/badge/Type%20Hints-py.typed-3178C6?style=flat&logo=typescript&logoColor=white)](#-python-library-mazeforge)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Grid%20%2B%20Flexbox-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)

<!-- Backend & data -->

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-maze--game-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-switchable-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=flat&logo=swagger&logoColor=black)](https://maze-game-api.vercel.app/api-docs)

<!-- Build, tooling & DevOps -->

[![Webpack](https://img.shields.io/badge/Webpack-5-8DD6F9?style=flat&logo=webpack&logoColor=black)](https://webpack.js.org/)
[![Babel](https://img.shields.io/badge/Babel-7-F9DC3E?style=flat&logo=babel&logoColor=black)](https://babeljs.io/)
[![Jest](https://img.shields.io/badge/Jest-tested-C21325?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![Prettier](https://img.shields.io/badge/Prettier-enforced-F7B93E?style=flat&logo=prettier&logoColor=black)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/ESLint-linted-4B32C3?style=flat&logo=eslint&logoColor=white)](https://eslint.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-frontend%20image-009639?style=flat&logo=nginx&logoColor=white)](https://nginx.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=flat&logo=githubactions&logoColor=white)](./.github/workflows/ci.yml)
[![GHCR](https://img.shields.io/badge/GHCR-images-181717?style=flat&logo=github&logoColor=white)](https://github.com/hoangsonww/The-Maze-Game/pkgs/container/the-maze-game-backend)
[![Vercel](https://img.shields.io/badge/Vercel-API-000000?style=flat&logo=vercel&logoColor=white)](https://maze-game-api.vercel.app/)
[![Render](https://img.shields.io/badge/Render-frontend-46E3B7?style=flat&logo=render&logoColor=white)](https://the-maze-game.onrender.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat&logo=pwa&logoColor=white)](./manifest.json)

[Play Now](https://the-maze-game.onrender.com/) | [API Docs](./API_DOCUMENTATION.md) | [Live Swagger](https://maze-game-api.vercel.app/api-docs) | [Report Bug](https://github.com/hoangsonww/The-Maze-Game/issues)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Game Features

- **Multiple Difficulty Levels**: Easy, Medium, Hard, and Expert modes
- **Procedural Maze Generation**: Unique maze every time using Depth-First Search algorithm
- **Start Gate**: The maze stays frozen behind a see-through Play overlay; the
  timer only starts when you press Play (which also reshuffles the maze, so
  peeking ahead doesn't help)
- **Timer & Scoring System**: Compete for the best time and highest score
- **Hint System**: Get pathfinding hints when stuck (costs points)
- **Pause/Resume**: Pause the game anytime without losing progress
- **Move Counter**: Track your efficiency
- **Persistent Statistics**: Lifetime stats saved locally (and to your account when signed in)
- **Achievements System**: 8 achievements to unlock
- **Sound Effects**: Optional audio feedback
- **Themes**: 10 visual themes (Daylight, Midnight, Neon, Forest, Sunset, Ocean, Dracula, Mono, Candy, Volcano)
- **Touch Controls**: Swipe to move on mobile
- **Fully Responsive**: Presentable and playable from desktop down to small
  phones (~360px) — swipe + on-screen D-pad, stacked layout, scrollable tables

### 🌐 Multiplayer (backend-ready)

- **Socket.IO infrastructure**: Room join/leave, position broadcast, and
  game-finished events on the long-lived server (`npm start`)
- **Note**: the realtime backend is in place; a multiplayer frontend is on the
  roadmap. (Socket.IO does not run on the Vercel serverless deployment.)

### 👤 Accounts & Progress

- **Accounts**: Register / log in with JWT auth (bcrypt-hashed passwords)
- **Password reset**: Simple 2-step flow (verify username + email → set new password)
- **Password UX**: Show/hide toggles and confirm-password fields everywhere
- **Editable profile**: Change username, email, and password in-app
- **Per-user stats**: Games played/won, win rate, best score, streaks
- **Progress tracking**: Level & XP, per-difficulty breakdown, recent games
- **Profile dashboard**: All of the above in an in-app modal
- **Guest play**: Pick a leaderboard name on first launch — no account needed;
  sign in any time to save progress

### 📊 Backend Features

- **MongoDB-backed** (database `maze-game`), with a pluggable datastore layer:
  swap to **PostgreSQL** (`DB_DRIVER=postgres`) or in-memory at any time
- **Swagger / OpenAPI**: interactive docs at `/api-docs`, spec at `/openapi.json`
- **Global Leaderboards**: Compete worldwide with timeframe filters
- **RESTful API**: Leaderboard, games, achievements, auth, users
- **Game Sessions**: Server-side game tracking
- **Real-time Multiplayer**: Socket.IO rooms (on the long-lived server)
- **Rate Limiting** + **Winston** logging + optional **Sentry**

### 🔒 Production Features

- **Serverless-ready**: Deploys to **Vercel** as one Express function
- **CI/CD Pipeline**: Automated testing (Jenkins / GitHub Actions)
- **Docker Support**: Containerized deployment with Docker Compose
- **Security**: Helmet.js, rate limiting, open CORS for the public API
- **PWA Support**: Offline capability, installable, service-worker caching
- **Code quality**: Project-wide Prettier, ESLint, Jest (53 tests)
- **Accessibility & Responsive**: ARIA labels, keyboard nav, focus styles;
  mobile-first layout that stacks the maze + controls above stats, keeps the
  account control on phones, and avoids horizontal overflow (verified 360–390px)
- **SEO Optimized**: Meta tags, sitemap, robots.txt

---

## 🎮 Demo

### Live Demo

👉 **[Play Now](https://the-maze-game.onrender.com/)**

### Screenshots

<div align="center">
<img src="./utils/MazeUI.png" alt="Game Screenshot" width="600">
</div>

### Features Preview

| Feature                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| 🎯 Multiple Difficulties | Easy (11×15) to Expert (25×35) mazes        |
| ⏱️ Timer                 | Real-time timer and best-time tracking      |
| 💡 Hints                 | A\* pathfinding hints (costs points)        |
| 🏆 Achievements          | 8 unique achievements to unlock             |
| 📊 Leaderboards          | Global rankings with timeframe filtering    |
| 👤 Accounts & Stats      | Sign in to track level, win rate, streaks   |
| 🎨 Themes                | 10 themes (Dracula, Sunset, Ocean, Neon, …) |
| 📱 Touch                 | Swipe controls on mobile                    |
| 🔊 Sound                 | Optional sound effects                      |
| ⏸️ Pause                 | Pause and resume anytime                    |

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/hoangsonww/The-Maze-Game.git
cd The-Maze-Game

# Start with Docker Compose (runs the API server)
docker-compose up -d

# API + Swagger docs at http://localhost:3000/api-docs
# (the game frontend is static — open index.html or use GitHub Pages)
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/hoangsonww/The-Maze-Game.git
cd The-Maze-Game

# Install dependencies
npm install

# Start the API server (Express + Swagger + Socket.IO) on :3000
npm run dev          # API + docs at http://localhost:3000/api-docs

# In another shell, open the static game frontend
npm run serve        # opens index.html via http-server
```

The frontend talks to `https://maze-game-api.vercel.app` by default. To point it
at a local backend, set `window.MAZE_API_BASE = 'http://localhost:3000'` before
the scripts load (or in the console).

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (a free Atlas cluster works) — the active datastore for the API
- **Docker** (optional, for containerized deployment)
- **PostgreSQL** >= 13.x (optional — only if you switch `DB_DRIVER=postgres`)

> The API also runs with **no database** (in-memory driver) for quick local play
> and tests.

### Step-by-Step Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/hoangsonww/The-Maze-Game.git
   cd The-Maze-Game
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build for production**

   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

---

## 💻 Usage

### Playing the Game

#### Controls

- **Arrow Keys** or **WASD** - Move your character
- **Swipe** - Move on touch devices
- **P** - Pause/Resume game
- **H** - Use hint (costs points)
- **R** - Generate a new maze
- **On-screen buttons** - Alternative controls

> On phones the maze and controls sit at the top with stats below, and you can
> play entirely with swipes or the on-screen D-pad.

#### Objective

Guide the **coral player** (top-left) to the **lime exit** (bottom-right) as quickly as possible with minimal moves.

#### Scoring

```
Base Score: 100 points
Penalties:
  - Time: 0.1 points per second
  - Moves: 0.5 points per move
  - Hints: 10-20 points per hint (difficulty-based)

Difficulty Multipliers:
  - Easy: 1.0x
  - Medium: 1.5x
  - Hard: 2.0x
  - Expert: 3.0x
```

### Using the API

See [API Documentation](./API_DOCUMENTATION.md) for complete API reference.

**Example: Submit Score**

```javascript
const response = await fetch('/api/v1/leaderboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerName: 'Player1',
    score: 150,
    completionTime: 45000,
    difficulty: 'medium',
    moves: 50,
  }),
});
```

---

## 🏗️ Architecture

### System Overview

A static vanilla-JS client (Render / GitHub Pages) talks to a serverless Express
API (Vercel) that fans out to one of three interchangeable datastores. A
standalone Python library (`mazeforge`) shares the maze concepts but ships
independently.

```mermaid
flowchart TB
    subgraph client["Frontend — static (Render / GitHub Pages)"]
        IDX["index.html + canvas"]
        JS["game.js · ui-components.js<br/>auth.js · i18n.js"]
        CSS["style.css — Wayfinder · 10 themes"]
        SW["service-worker.js (PWA)"]
    end

    subgraph api["Backend — Express (Vercel serverless)"]
        APP["app.js — middleware + routes"]
        SWG["Swagger UI /api-docs · /openapi.json"]
        REPO["repository.js · users.js"]
    end

    subgraph stores["Datastores (DB_DRIVER)"]
        MONGO[("MongoDB · maze-game")]
        PG[("PostgreSQL")]
        MEM[["in-memory"]]
    end

    subgraph lib["mazeforge (Python)"]
        GEN["11 generators"]
        SOL["7 solvers"]
        REN["ASCII / PNG render · CLI · pygame"]
    end

    JS -->|"fetch /api/v1/* (CORS *)"| APP
    JS -->|"JWT bearer"| APP
    IDX --- JS --- CSS
    SW -.offline cache.- IDX
    APP --> SWG
    APP --> REPO
    REPO --> MONGO
    REPO --> PG
    REPO --> MEM
    GEN --> SOL --> REN
```

### Data flow — a completed game

```mermaid
sequenceDiagram
    participant Player
    participant Game as game.js
    participant API as Maze Game API
    participant DB as datastore

    Player->>Game: press Play → solve maze
    Game->>Game: stop timer · compute score
    Game->>API: POST /api/v1/leaderboard { name, score, time, moves }
    API->>DB: insert leaderboard row
    DB-->>API: created entry
    alt signed in
        Game->>API: POST /api/v1/users/me/games (Bearer)
        API->>DB: update stats · streaks · level
        DB-->>API: decorated stats
        API-->>Game: 201 stats → refresh dashboard
    end
    Game->>API: POST /api/v1/achievements/unlock (if newly earned)
    API-->>Game: 201 achievement
    Game-->>Player: win modal · updated leaderboard
```

### Project Structure

```
The-Maze-Game/
├── index.html                    # Game page (GitHub Pages frontend)
├── src/                          # Frontend source
│   ├── css/style.css             # "Wayfinder" UI styles
│   ├── js/
│   │   ├── game.js               # Game engine (canvas, A*, scoring, sessions)
│   │   ├── ui-components.js      # Modals, leaderboard, achievements
│   │   └── auth.js               # Accounts, profile & stats dashboard
│   ├── html/about.html           # About page
│   └── python/                   # `mazeforge` — installable maze library (gen/solve/render) + pygame player
├── api/
│   └── index.js                  # Vercel serverless entry (exports the app)
├── server/                       # Backend
│   ├── app.js                    # Express app factory (serverless-safe)
│   ├── index.js                  # Local/Docker entry (+ Socket.IO + listen)
│   ├── swagger.js                # OpenAPI spec + CDN Swagger UI
│   ├── database/
│   │   ├── driver.js             # DB_DRIVER resolver
│   │   ├── repository.js         # Leaderboard / games / achievements (3 drivers)
│   │   ├── users.js              # Accounts + stats (3 drivers)
│   │   ├── mongo.js              # MongoDB connection (db `maze-game`)
│   │   ├── connection.js         # PostgreSQL pool (lazy)
│   │   ├── schema.sql            # Full relational schema (auth platform)
│   │   └── schema-game.sql       # Active gameplay + users_app tables
│   ├── services/auth.js          # bcrypt + JWT
│   ├── routes/                   # auth, users, leaderboard, game, achievements, …
│   ├── middleware/               # auth (JWT), errorHandler
│   └── utils/                    # logger, email, sentry
├── __tests__/                    # Jest suites (server: node env, client: jsdom)
├── scripts/                      # build-frontend, gen-secret, check-db, seed, smoke, openapi…
├── .github/workflows/ci.yml      # CI: format → build server → build frontend → docker → summary
├── Makefile                      # one-stop targets (make help)
├── Dockerfile.backend            # API image (node)        ┐ pushed to GHCR by CI
├── Dockerfile.frontend           # static image (nginx)    ┘
├── docker/nginx.frontend.conf    # nginx config for the frontend image
├── docker-compose.yml            # local stack: backend + frontend + mongo
├── vercel.json · .vercelignore   # serverless routing
├── webpack.config.js · jest.config.js · manifest.json · service-worker.js
└── README.md · API_DOCUMENTATION.md
```

### Technology Stack

**Frontend** (vanilla, static — Render / GitHub Pages)

- Vanilla JavaScript (ES6+), HTML5 Canvas
- CSS3 (Grid/Flexbox), Service Worker (PWA)
- Fonts: Bricolage Grotesque · Sora · JetBrains Mono

**Backend**

- Node.js + Express.js
- **MongoDB** (active) · PostgreSQL (switchable) · in-memory (fallback)
- JWT (`jsonwebtoken`) + bcrypt for accounts
- Socket.IO (multiplayer), Winston (logging), optional Sentry
- Swagger / OpenAPI 3 (served from a CDN)
- Helmet.js, express-rate-limit

**Build & Tooling**

- Webpack 5, Babel 7
- Jest + Supertest
- Prettier, ESLint

**DevOps**

- Vercel (serverless API) · GitHub Pages (frontend)
- Docker & Docker Compose, Nginx
- Jenkins / GitHub Actions (CI/CD)

---

## 📚 API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

Interactive docs (Swagger UI) are served at **`/api-docs`**; the OpenAPI spec at
**`/openapi.json`**.

### Quick Reference

| Endpoint                         | Method | Auth | Description                 |
| -------------------------------- | ------ | ---- | --------------------------- |
| `/api/health`                    | GET    |      | Health + active DB driver   |
| `/api/v1/auth/register`          | POST   |      | Create an account           |
| `/api/v1/auth/login`             | POST   |      | Log in (username or email)  |
| `/api/v1/auth/me`                | GET    | 🔒   | Current account + stats     |
| `/api/v1/auth/reset/verify`      | POST   |      | Reset step 1 (verify)       |
| `/api/v1/auth/reset`             | POST   |      | Reset step 2 (new password) |
| `/api/v1/users/me/stats`         | GET    | 🔒   | Your stats & progress       |
| `/api/v1/users/me/games`         | POST   | 🔒   | Record a finished game      |
| `/api/v1/users/me`               | PATCH  | 🔒   | Edit username / email       |
| `/api/v1/users/me/password`      | POST   | 🔒   | Change password             |
| `/api/v1/users/:id`              | GET    |      | Public profile              |
| `/api/v1/leaderboard`            | GET    |      | Get leaderboard             |
| `/api/v1/leaderboard`            | POST   |      | Submit score                |
| `/api/v1/leaderboard/rank/:name` | GET    |      | Player rank                 |
| `/api/v1/games/start`            | POST   |      | Start game session          |
| `/api/v1/games/:id/move`         | PUT    |      | Record a move               |
| `/api/v1/games/:id/complete`     | PUT    |      | Complete game + score       |
| `/api/v1/games/stats`            | GET    |      | Aggregate game stats        |
| `/api/v1/achievements`           | GET    |      | List achievements           |
| `/api/v1/achievements/user/:id`  | GET    |      | A player's achievements     |
| `/api/v1/achievements/unlock`    | POST   |      | Unlock an achievement       |

---

## 🛠️ Development

### Makefile

A `Makefile` wraps the common tasks — run `make help` for the full list:

```bash
make install-all     # Node + Python deps
make dev             # API with hot reload
make test-all        # JS + Python tests
make build           # static frontend -> frontend-dist/
make docker-build    # build both Docker images
make ci              # run the core CI gate locally
make secret          # print a JWT secret
```

### Helper scripts

`scripts/` holds standalone utilities (`build-frontend`, `gen-secret`,
`check-db`, `seed-leaderboard`, `smoke-test`, `export-openapi`,
`validate-openapi`, `clean-leaderboard`) — see [`scripts/README.md`](./scripts/README.md).

### CI (GitHub Actions)

`.github/workflows/ci.yml` runs in order: **1)** format check → **2)** build &
test the server (uploads `server-dist`) → **3)** build the frontend (uploads
`frontend-dist`) → **4)** build & push both Docker images to GHCR → **5)** a
summary job. Images are linked to this repo via the OCI `source` label.

### NPM Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run serve:static     # Serve static files

# Building
npm run build            # Production build with webpack
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format the whole project with Prettier
npm run format:check     # Check formatting (CI gate)

# Testing
npm test                 # Run all tests (53) with coverage
npm run test:watch       # Watch mode

# Backend
npm start                # Start the API server (server/index.js)
npm run db:migrate:pg    # Apply the Postgres gameplay schema (DB_DRIVER=postgres)
npm run clean:leaderboard -- "E2E_*"   # Remove leaderboard rows by name/prefix (needs MONGODB_URI)

# Python (the `mazeforge` library — see src/python/)
npm run py:play          # install + launch the pygame player
npm run py:test          # install + run the Python test suite (pytest)
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
HOST=localhost

# Datastore: mongo (default when MONGODB_URI set) | postgres | memory
DB_DRIVER=mongo
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB=maze-game

# Accounts (JWT)
JWT_SECRET=generate_a_long_random_string
JWT_EXPIRATION=7d

# Optional PostgreSQL (only when DB_DRIVER=postgres)
DATABASE_URL=
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

With nothing set, the API runs on the in-memory driver — fine for local play
and tests.

### Adding New Features

1. **Game Features**: Edit `src/js/game.js`
2. **UI Components**: Edit `src/js/ui-components.js`
3. **API Endpoints**: Add routes in `server/routes/`
4. **Styles**: Edit `src/css/style.css`

---

## 🐍 Python Library (`mazeforge`)

`src/python/` is a standalone, installable, typed Python package — the
algorithmic engine, usable by any app or dev independently of the web game.

- **11 generators**: recursive backtracker, Prim, Kruskal, Wilson,
  Aldous-Broder, hunt-and-kill, Eller, recursive division, binary tree,
  sidewinder, growing tree.
- **7 solvers**: BFS, DFS, Dijkstra, A\* (Manhattan/Euclidean/Chebyshev),
  greedy best-first, wall follower, dead-end filling.
- Distance fields + longest-path (diameter), ASCII & PNG rendering, wall-grid
  interop, seedable/reproducible, zero core dependencies, `py.typed`.

```bash
pip install ./src/python            # or pip install "./src/python[image,play]"
```

```python
import mazeforge as mf
maze = mf.generate(20, 30, "recursive_backtracker", seed=42)
sol = mf.solve(maze, algorithm="astar")
print(mf.to_ascii(maze, path=sol.path))
```

```bash
mazeforge generate -r 20 -c 30 --algo wilson --solve   # CLI
mazeforge play                                          # pygame player
```

Details: [`src/python/README.md`](./src/python/README.md). Tests: `pytest src/python`.

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
# Backend tests
npm test -- __tests__/server

# Frontend tests
npm test -- __tests__/client

# Coverage report
npm test -- --coverage

# Python library tests (51 tests, pytest)
pip install "./src/python[dev]" && pytest src/python
```

### Test Structure

- **JS unit tests**: Game logic, scoring, pathfinding (Jest, 53)
- **JS integration tests**: API endpoints (Supertest)
- **Python tests**: every generator/solver/renderer (pytest, 51) + mypy-clean

### Coverage Goals

- Overall: > 80%
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🚢 Deployment

### Topology

```mermaid
flowchart LR
    user(["Player"]) -->|HTTPS| FE["Static frontend<br/>Render / GitHub Pages"]
    FE -->|"fetch /api/v1/*"| BE["Express API<br/>Vercel serverless"]
    BE --> MDB[("MongoDB Atlas<br/>maze-game")]
    dev(["Maintainer"]) -->|git push| GH["GitHub"]
    GH --> CI["GitHub Actions CI"]
    CI -->|"build + push"| GHCR["GHCR images<br/>backend · frontend"]
    GH -->|deploy hook| FE
    GH -->|deploy hook| BE
    GHCR -.self-host.-> any["Any Docker host"]
```

### CI pipeline

`.github/workflows/ci.yml` runs five ordered jobs — a failure stops the chain:

```mermaid
flowchart LR
    A["1 · format check<br/>prettier --check"] --> B["2 · build + test server<br/>↑ server-dist"]
    B --> C["3 · build frontend<br/>↑ frontend-dist"]
    C --> D["4 · docker build<br/>login GHCR · push backend + frontend"]
    D --> E["5 · summary<br/>::notice pipeline success"]
```

### Docker

Two images are built from the repo: **`Dockerfile.backend`** (the Express API)
and **`Dockerfile.frontend`** (the static site on nginx). CI publishes both to
**GHCR**, linked to this repo:

```
ghcr.io/hoangsonww/the-maze-game-backend
ghcr.io/hoangsonww/the-maze-game-frontend
```

Local full stack (backend + frontend + MongoDB):

```bash
docker compose up --build       # API :3000 (/api-docs) · frontend :8080 · mongo :27017
docker compose --profile postgres up   # also start PostgreSQL
make docker-build               # just build both images
make docker-push                # build + push to a registry (REGISTRY/OWNER/TAG vars)
```

Pull the published images:

```bash
docker pull ghcr.io/hoangsonww/the-maze-game-backend:latest
docker pull ghcr.io/hoangsonww/the-maze-game-frontend:latest
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start server
NODE_ENV=production npm start
```

### Vercel (Backend API + Swagger)

The Express backend is serverless-ready and deploys to Vercel as-is:

```bash
vercel --prod
```

- All requests are routed to `api/index.js` (see `vercel.json`), which exports the shared app from `server/app.js`.
- `GET /` redirects to `/api-docs` — interactive **Swagger UI** whose assets (CSS, JS, favicon) load entirely from a CDN. The raw spec is served at `/openapi.json`.
- The active datastore is **MongoDB** (database `maze-game`). PostgreSQL is wired and correct but inactive; switch with `DB_DRIVER=postgres` and apply `server/database/schema-game.sql`. With no DB configured the API falls back to an in-memory store.
- **CORS allows all origins**, so the GitHub Pages frontend (or anything) can call it directly.
- **Accounts** (`/api/v1/auth/register`, `/login`, `/me`) issue JWTs (bcrypt-hashed passwords); per-user stats and progress live at `/api/v1/users/me/stats` and `/me/games`. Set `JWT_SECRET` to enable them.
- Real-time multiplayer (Socket.IO) runs only via `npm start` (`server/index.js`), not on serverless.

**Environment variables to set in Vercel:**

| Variable                                          | Required          | Notes                                                             |
| ------------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`                                     | yes               | MongoDB connection string                                         |
| `JWT_SECRET`                                      | yes (accounts)    | Long random string; signs auth tokens                             |
| `MONGODB_DB`                                      | no                | Defaults to `maze-game`                                           |
| `DB_DRIVER`                                       | no                | `mongo` (default when `MONGODB_URI` set), `postgres`, or `memory` |
| `NODE_ENV`                                        | recommended       | `production`                                                      |
| `JWT_EXPIRATION`, `BCRYPT_ROUNDS`                 | optional          | Token TTL (default `7d`) / hash cost (default `10`)               |
| `DATABASE_URL` / `DB_*`                           | only for Postgres | Used when `DB_DRIVER=postgres`                                    |
| `SENTRY_DSN`                                      | optional          | Enables error tracking                                            |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | optional          | Rate-limit tuning                                                 |

The static game frontend stays vanilla JS on **GitHub Pages**; point its API calls at the Vercel URL when you deploy the backend.

### GitHub Pages (Static Only)

Automatic deployment via GitHub Actions to `gh-pages` branch.

### Cloud Platforms

<details>
<summary><b>Heroku</b></summary>

```bash
heroku create maze-game-app
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

</details>

<details>
<summary><b>AWS</b></summary>

1. Build Docker image
2. Push to ECR
3. Deploy to ECS/Fargate
4. Configure RDS (PostgreSQL) and ElastiCache (Redis)
</details>

<details>
<summary><b>DigitalOcean</b></summary>

```bash
doctl apps create --spec .do/app.yaml
```

</details>

---

## 🛡️ Security

### Implemented Security Measures

- ✅ Helmet.js security headers
- ✅ bcrypt password hashing + JWT auth
- ✅ Rate limiting (`/api/*`)
- ✅ Input validation (username/email/password, score fields)
- ✅ Parameterized SQL (PostgreSQL driver)
- ✅ Output escaping for user-rendered content (leaderboard, profile)
- ✅ Open CORS — intentional for a public, read-mostly game API
- ✅ HTTPS via the host (Vercel) / GitHub Pages

> The API host serves only JSON + the Swagger docs (no same-origin app), so the
> strict Content-Security-Policy is disabled there; the game frontend ships
> separately on GitHub Pages.

### Security Best Practices

1. **Never commit `.env` files**
2. **Rotate secrets regularly**
3. **Use environment variables for sensitive data**
4. **Keep dependencies updated**: `npm audit fix`
5. **Enable HTTPS in production**

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass: `npm test`
- Run linter: `npm run lint`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Son Nguyen**

- GitHub: [@hoangsonww](https://github.com/hoangsonww)
- Project: [The Maze Game](https://github.com/hoangsonww/The-Maze-Game)

---

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by classic maze games
- Built with modern web technologies

---

## 📞 Support

- 🐛 [Report Bugs](https://github.com/hoangsonww/The-Maze-Game/issues)
- 💡 [Request Features](https://github.com/hoangsonww/The-Maze-Game/issues)
- 💬 [Discussions](https://github.com/hoangsonww/The-Maze-Game/discussions)

---

<div align="center">

**[⬆ back to top](#-the-maze-game---production-ready)**

Made with ❤️ by [Son Nguyen](https://github.com/hoangsonww)

</div>
