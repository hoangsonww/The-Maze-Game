const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('Sentry initialized successfully');

  return Sentry;
};

/**
 * Add Sentry error handler (must be added AFTER all routes)
 */
const addSentryErrorHandler = (app) => {
  // The error handler must be registered before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
};

/**
 * Capture exception manually
 */
const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  }
  logger.error('Exception captured:', { error: error.message, context });
};

/**
 * Capture message
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      contexts: { custom: context },
    });
  }
  logger.log(level, message, context);
};

/**
 * Add breadcrumb
 */
const addBreadcrumb = (breadcrumb) => {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

/**
 * Set user context
 */
const setUser = (user) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }
};

/**
 * Start a transaction for performance monitoring
 */
const startTransaction = (name, op = 'http.server') => {
  if (process.env.SENTRY_DSN) {
    return Sentry.startTransaction({ name, op });
  }
  return null;
};

module.exports = {
  initSentry,
  addSentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  startTransaction,
  Sentry,
};
