# 🎮 The Maze Game - Production Ready

<div align="center">

![The Maze Game](./utils/MazeUI.png)

[![CI/CD](https://github.com/hoangsonww/The-Maze-Game/workflows/CI-CD%20Pipeline/badge.svg)](https://github.com/hoangsonww/The-Maze-Game/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/hoangsonww/The-Maze-Game)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoangsonww/The-Maze-Game/pulls)

**A fully-featured maze game: procedural mazes, difficulty levels, A\* hints, accounts, per-user stats & progress, achievements, global leaderboards, and multiplayer — with a MongoDB-backed, Vercel-deployable API documented in Swagger.**

[Play Now](https://hoangsonww.github.io/The-Maze-Game/) | [API Docs](./API_DOCUMENTATION.md) | [Live Swagger](https://maze-game-api.vercel.app/api-docs) | [Report Bug](https://github.com/hoangsonww/The-Maze-Game/issues)

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

👉 **[Play Now](https://hoangsonww.github.io/The-Maze-Game/)**

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
│   └── python/                   # Pygame implementation (main.py, maze-gen.py)
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
├── vercel.json                   # Serverless routing
├── .vercelignore                 # Excludes the frontend from the API bundle
├── .prettierrc.json / .prettierignore
├── Dockerfile · docker-compose.yml · nginx.conf · Jenkinsfile
├── webpack.config.js · jest.config.js · manifest.json · service-worker.js
└── README.md · API_DOCUMENTATION.md
```

### Technology Stack

**Frontend**

- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS3 with Flexbox/Grid
- Service Worker API (PWA)

**Frontend** (vanilla, GitHub Pages)

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
npm run backend          # Run the Python/Pygame version
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
```

### Test Structure

- **Unit Tests**: Game logic, scoring, pathfinding
- **Integration Tests**: API endpoints
- **E2E Tests**: Full game flow (coming soon)

### Coverage Goals

- Overall: > 80%
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
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
