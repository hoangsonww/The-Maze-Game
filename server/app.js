require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { initSentry, addSentryErrorHandler } = require('./utils/sentry');
const swagger = require('./swagger');

// Route modules
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const achievementRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');
const socialRoutes = require('./routes/social');
const challengesRoutes = require('./routes/challenges');
const mazesRoutes = require('./routes/mazes');

const app = express();

// Behind Vercel / a reverse proxy: trust the first hop for correct client IPs.
app.set('trust proxy', 1);

// Sentry must be initialised before other middleware (no-op without SENTRY_DSN).
initSentry(app);

// Security headers. CSP is disabled because this host only serves the API and
// the Swagger UI (whose assets load from a CDN); the game frontend is hosted
// separately (GitHub Pages).
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — public API, allow all origins. (No credentials: a wildcard origin and
// credentialed requests are mutually exclusive per the CORS spec.)
app.use(cors({ origin: '*' }));

// Rate limiting (API only).
app.use(
  '/api/',
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());
app.use(
  morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    process.env.NODE_ENV === 'production' ? { stream: logger.stream } : undefined
  )
);

// Swagger docs + `/` → /api-docs redirect + /openapi.json
swagger.mount(app);

// Health check
app.get('/api/health', (req, res) => {
  const { resolveDriver } = require('./database/repository');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    dbDriver: resolveDriver(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/challenges', challengesRoutes);
app.use('/api/v1/mazes', mazesRoutes);

// Sentry error handler (before the custom one).
addSentryErrorHandler(app);

// Unknown routes: JSON 404 for the API, otherwise send people to the docs.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  return res.redirect(302, '/api-docs');
});

// Central error handler (must be last).
app.use(errorHandler);

module.exports = app;
