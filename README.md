# 🎮 The Maze Game - Production Ready

<div align="center">

![The Maze Game](./utils/MazeUI.png)

[![CI/CD](https://github.com/hoangsonww/The-Maze-Game/workflows/CI-CD%20Pipeline/badge.svg)](https://github.com/hoangsonww/The-Maze-Game/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/hoangsonww/The-Maze-Game)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoangsonww/The-Maze-Game/pulls)

**A fully-featured, production-ready maze game with multiplayer support, achievements, and global leaderboards.**

[Play Now](https://hoangsonww.github.io/The-Maze-Game/) | [API Docs](./API_DOCUMENTATION.md) | [Report Bug](https://github.com/hoangsonww/The-Maze-Game/issues) | [Request Feature](https://github.com/hoangsonww/The-Maze-Game/issues)

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
- **Persistent Statistics**: Lifetime stats saved locally
- **Achievements System**: 8+ achievements to unlock
- **Sound Effects**: Optional audio feedback
- **Themes**: Multiple visual themes (Default, Dark, Neon)

### 🌐 Multiplayer Features
- **Real-time Multiplayer**: Compete against other players using WebSockets
- **Live Player Tracking**: See opponents' positions in real-time
- **Room-based Matches**: Join or create game rooms
- **Winner Announcements**: Instant win notifications

### 📊 Backend Features
- **Global Leaderboards**: Compete worldwide with timeframe filters
- **RESTful API**: Full-featured API for game data
- **User Management**: Track player profiles and statistics
- **Game Sessions**: Server-side game tracking
- **Rate Limiting**: Protection against abuse
- **Error Logging**: Winston-based comprehensive logging

### 🔒 Production Features
- **CI/CD Pipeline**: Automated testing and deployment
- **Docker Support**: Containerized deployment with Docker Compose
- **Security**: Helmet.js, rate limiting, CORS, CSP headers
- **PWA Support**: Offline capability and installable
- **Service Worker**: Advanced caching strategies
- **Performance Optimization**: Webpack bundling, code splitting, minification
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive Design**: Works on desktop, tablet, and mobile
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

| Feature | Description |
|---------|-------------|
| 🎯 Multiple Difficulties | Easy (10x15) to Expert (25x35) mazes |
| ⏱️ Timer | Real-time countdown and best time tracking |
| 💡 Hints | A* pathfinding hints (costs points) |
| 🏆 Achievements | 8 unique achievements to unlock |
| 📊 Leaderboards | Global rankings with filtering |
| 🎨 Themes | Dark mode and custom themes |
| 🔊 Sound | Optional sound effects |
| ⏸️ Pause | Pause and resume anytime |

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/hoangsonww/The-Maze-Game.git
cd The-Maze-Game

# Start with Docker Compose
docker-compose up -d

# Access the game at http://localhost:3000
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/hoangsonww/The-Maze-Game.git
cd The-Maze-Game

# Install dependencies
npm install

# Start development server
npm run dev

# Access the game at http://localhost:8080
```

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Docker** (optional, for containerized deployment)
- **PostgreSQL** >= 15.x (optional, for production)
- **Redis** >= 7.x (optional, for production)

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
- **P** - Pause/Resume game
- **H** - Use hint (costs points)
- **Mouse/Touch** - Click on-screen buttons

#### Objective
Navigate from the red player (top-left) to the green exit (bottom-right) as quickly as possible with minimal moves.

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
    moves: 50
  })
});
```

---

## 🏗️ Architecture

### Project Structure

```
The-Maze-Game/
├── src/                          # Source code
│   ├── css/                      # Stylesheets
│   │   ├── style.css            # Original styles
│   │   └── style-enhanced.css   # Production styles
│   ├── js/                       # JavaScript
│   │   ├── game.js              # Original game logic
│   │   ├── game-enhanced.js     # Enhanced game with features
│   │   └── ui-components.js     # UI components and modals
│   ├── html/                     # HTML pages
│   │   └── about.html           # About page
│   └── python/                   # Python implementation
│       ├── main.py              # Pygame version
│       └── maze-gen.py          # Maze generator
├── server/                       # Backend server
│   ├── index.js                 # Express server
│   ├── routes/                  # API routes
│   │   ├── leaderboard.js       # Leaderboard endpoints
│   │   ├── game.js              # Game session endpoints
│   │   ├── achievements.js      # Achievements endpoints
│   │   └── user.js              # User management
│   ├── middleware/              # Express middleware
│   │   └── errorHandler.js     # Error handling
│   └── utils/                   # Utilities
│       └── logger.js            # Winston logger
├── __tests__/                    # Test suites
│   ├── server/                  # Backend tests
│   └── client/                  # Frontend tests
├── .github/                      # GitHub configuration
│   └── workflows/               # CI/CD workflows
│       └── ci-cd.yml            # GitHub Actions
├── utils/                        # Static assets
│   ├── favicon.ico              # Favicon
│   └── image-*.png              # PWA icons
├── index.html                    # Original game page
├── index-enhanced.html           # Production game page
├── manifest.json                 # PWA manifest
├── service-worker.js             # Service worker for PWA
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose
├── webpack.config.js             # Webpack bundler config
├── jest.config.js                # Jest test config
├── package.json                  # Dependencies
├── .env.example                  # Environment template
└── README.md                     # This file
```

### Technology Stack

**Frontend**
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS3 with Flexbox/Grid
- Service Worker API (PWA)

**Backend**
- Node.js + Express.js
- Socket.IO (WebSockets)
- Winston (Logging)
- Helmet.js (Security)

**Build Tools**
- Webpack 5
- Babel 7
- PostCSS
- Terser

**Testing**
- Jest
- Supertest

**DevOps**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (Reverse Proxy)

**Optional Services**
- PostgreSQL (Database)
- Redis (Caching)

---

## 📚 API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/v1/leaderboard` | GET | Get leaderboard |
| `/api/v1/leaderboard` | POST | Submit score |
| `/api/v1/games/start` | POST | Start game session |
| `/api/v1/games/:id/complete` | PUT | Complete game |
| `/api/v1/achievements` | GET | Get achievements |
| `/api/v1/users/register` | POST | Register user |

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
npm run format           # Format code with Prettier

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode

# Backend
npm start                # Start production server
npm run backend          # Run Python version
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maze_game
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_secret_here
CORS_ORIGIN=http://localhost:3000
```

### Adding New Features

1. **Game Features**: Edit `src/js/game-enhanced.js`
2. **UI Components**: Edit `src/js/ui-components.js`
3. **API Endpoints**: Add routes in `server/routes/`
4. **Styles**: Edit `src/css/style-enhanced.css`

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
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Content Security Policy
- ✅ HTTPs ready

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

- 📧 Email: support@mazegame.example.com
- 🐛 [Report Bugs](https://github.com/hoangsonww/The-Maze-Game/issues)
- 💡 [Request Features](https://github.com/hoangsonww/The-Maze-Game/issues)
- 💬 [Discussions](https://github.com/hoangsonww/The-Maze-Game/discussions)

---

<div align="center">

**[⬆ back to top](#-the-maze-game---production-ready)**

Made with ❤️ by [Son Nguyen](https://github.com/hoangsonww)

</div>
