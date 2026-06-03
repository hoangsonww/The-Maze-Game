/**
 * OpenAPI specification + a Swagger UI page whose assets (CSS, JS, and even the
 * favicon) are ALL loaded from a public CDN — nothing is served locally, which
 * keeps the serverless bundle tiny.
 *
 *   GET /openapi.json  -> the raw spec
 *   GET /api-docs      -> Swagger UI (CDN assets)
 *   GET /              -> 302 redirect to /api-docs
 */

const SWAGGER_CDN = 'https://unpkg.com/swagger-ui-dist@5.17.14';

const ok = (description, ref) => ({
  description,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'The Maze Game API',
    version: '1.2.0',
    description:
      'Backend API for The Maze Game. The leaderboard, game-session and ' +
      'achievement endpoints are backed by MongoDB (database `maze-game`) and ' +
      'are live. Account/social/maze/challenge/admin endpoints require the ' +
      'PostgreSQL driver (DB_DRIVER=postgres) and are documented for when it ' +
      'is switched on.',
    contact: { name: 'Son Nguyen', url: 'https://github.com/hoangsonww/The-Maze-Game' },
    license: { name: 'MIT' },
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'Health', description: 'Service status' },
    { name: 'Auth', description: 'Account creation and login' },
    { name: 'Users', description: 'Per-user stats and progress' },
    { name: 'Leaderboard', description: 'Global score leaderboard' },
    { name: 'Games', description: 'Game sessions and statistics' },
    { name: 'Achievements', description: 'Player achievements' },
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Register' } } },
        },
        responses: {
          201: ok('Account created (returns token + user)', 'AuthResponse'),
          400: ok('Validation error', 'Error'),
          409: ok('Username or email taken', 'Error'),
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in (username or email + password)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } },
        },
        responses: {
          200: ok('Logged in (returns token + user)', 'AuthResponse'),
          401: ok('Invalid credentials', 'Error'),
        },
      },
    },
    '/api/v1/auth/reset/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Password reset step 1 — verify username + email',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetVerify' } } },
        },
        responses: {
          200: { description: 'Match found, proceed to step 2' },
          400: ok('Missing fields', 'Error'),
          404: ok('No matching account', 'Error'),
        },
      },
    },
    '/api/v1/auth/reset': {
      post: {
        tags: ['Auth'],
        summary: 'Password reset step 2 — set a new password (re-verifies, logs in)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Reset' } } },
        },
        responses: {
          200: ok('Password changed (returns token + user)', 'AuthResponse'),
          400: ok('Validation error', 'Error'),
          404: ok('No matching account', 'Error'),
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current account + stats',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile' }, 401: ok('Unauthorized', 'Error') },
      },
    },
    '/api/v1/users/me/stats': {
      get: {
        tags: ['Users'],
        summary: "Current user's stats & progress",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Stats' }, 401: ok('Unauthorized', 'Error') },
      },
    },
    '/api/v1/users/me/games': {
      post: {
        tags: ['Users'],
        summary: 'Record a finished game against the user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GameResult' } } },
        },
        responses: { 201: { description: 'Updated stats' }, 401: ok('Unauthorized', 'Error') },
      },
    },
    '/api/v1/users/me': {
      patch: {
        tags: ['Users'],
        summary: 'Update your username and/or email',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateProfile' } },
          },
        },
        responses: {
          200: { description: 'Updated profile' },
          400: ok('Validation error', 'Error'),
          409: ok('Username/email taken', 'Error'),
        },
      },
    },
    '/api/v1/users/me/password': {
      post: {
        tags: ['Users'],
        summary: 'Change your password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangePassword' } },
          },
        },
        responses: { 200: { description: 'Password updated' }, 400: ok('Too short', 'Error') },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Public profile (username + stats)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Public profile' }, 404: ok('Not found', 'Error') },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/api/v1/leaderboard': {
      get: {
        tags: ['Leaderboard'],
        summary: 'Get the global leaderboard',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 1000 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          {
            name: 'timeframe',
            in: 'query',
            schema: { type: 'string', enum: ['all', 'daily', 'weekly', 'monthly'], default: 'all' },
          },
        ],
        responses: { 200: ok('Leaderboard entries', 'LeaderboardList') },
      },
      post: {
        tags: ['Leaderboard'],
        summary: 'Submit a score',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ScoreSubmission' } },
          },
        },
        responses: {
          201: ok('Created entry', 'LeaderboardEntryResponse'),
          400: ok('Validation error', 'Error'),
        },
      },
    },
    '/api/v1/leaderboard/rank/{playerName}': {
      get: {
        tags: ['Leaderboard'],
        summary: "Get a player's best rank",
        parameters: [
          { name: 'playerName', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Rank info' }, 404: ok('Player not found', 'Error') },
      },
    },
    '/api/v1/games/start': {
      post: {
        tags: ['Games'],
        summary: 'Start a new game session',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GameStart' } } },
        },
        responses: { 201: ok('Session created', 'GameSessionResponse') },
      },
    },
    '/api/v1/games/{id}/move': {
      put: {
        tags: ['Games'],
        summary: 'Record a move',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: ok('Updated session', 'GameSessionResponse'),
          400: ok('Session not active', 'Error'),
          404: ok('Session not found', 'Error'),
        },
      },
    },
    '/api/v1/games/{id}/complete': {
      put: {
        tags: ['Games'],
        summary: 'Complete a session and compute the score',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: ok('Completed session', 'GameSessionResponse'),
          404: ok('Session not found', 'Error'),
        },
      },
    },
    '/api/v1/games/stats': {
      get: {
        tags: ['Games'],
        summary: 'Aggregate statistics across completed games',
        responses: { 200: { description: 'Stats' } },
      },
    },
    '/api/v1/achievements': {
      get: {
        tags: ['Achievements'],
        summary: 'List all achievements',
        responses: { 200: { description: 'Achievement catalog' } },
      },
    },
    '/api/v1/achievements/user/{userId}': {
      get: {
        tags: ['Achievements'],
        summary: "Get a player's achievements and total points",
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Player achievements' } },
      },
    },
    '/api/v1/achievements/unlock': {
      post: {
        tags: ['Achievements'],
        summary: 'Unlock an achievement',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AchievementUnlock' } },
          },
        },
        responses: {
          201: { description: 'Unlocked' },
          400: ok('Missing fields / already unlocked', 'Error'),
          404: ok('Achievement not found', 'Error'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { success: { type: 'boolean', example: false }, error: { type: 'string' } },
      },
      Register: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'mazerunner', minLength: 3, maxLength: 20 },
          email: { type: 'string', format: 'email', example: 'me@example.com' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'hunter2!' },
        },
      },
      Login: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: { type: 'string', description: 'username or email', example: 'mazerunner' },
          password: { type: 'string', format: 'password', example: 'hunter2!' },
        },
      },
      ResetVerify: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
          username: { type: 'string', example: 'mazerunner' },
          email: { type: 'string', format: 'email', example: 'me@example.com' },
        },
      },
      Reset: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'mazerunner' },
          email: { type: 'string', format: 'email', example: 'me@example.com' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'newpass1' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'JWT bearer token' },
              user: { type: 'object' },
            },
          },
        },
      },
      GameResult: {
        type: 'object',
        properties: {
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
          score: { type: 'integer', example: 145 },
          timeMs: { type: 'integer', example: 17000 },
          moves: { type: 'integer', example: 80 },
          won: { type: 'boolean', example: true },
        },
      },
      UpdateProfile: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'newname' },
          email: { type: 'string', format: 'email', example: 'new@example.com' },
        },
      },
      ChangePassword: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', format: 'password', minLength: 6, example: 'newpass1' },
        },
      },
      LeaderboardEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          playerName: { type: 'string' },
          score: { type: 'integer' },
          completionTime: { type: 'integer', description: 'milliseconds' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
          moves: { type: 'integer' },
          timestamp: { type: 'integer', description: 'epoch ms' },
        },
      },
      LeaderboardList: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer' },
          total: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
        },
      },
      LeaderboardEntryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/LeaderboardEntry' },
        },
      },
      ScoreSubmission: {
        type: 'object',
        required: ['playerName', 'score', 'completionTime'],
        properties: {
          playerName: { type: 'string', maxLength: 20, example: 'Player' },
          score: { type: 'integer', example: 145 },
          completionTime: { type: 'integer', example: 17000 },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard', 'expert'],
            example: 'medium',
          },
          moves: { type: 'integer', example: 80 },
        },
      },
      GameStart: {
        type: 'object',
        properties: {
          playerId: { type: 'string', example: 'player_123' },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard', 'expert'],
            default: 'medium',
          },
          mode: { type: 'string', default: 'single' },
        },
      },
      GameSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          playerId: { type: 'string', nullable: true },
          difficulty: { type: 'string' },
          mode: { type: 'string' },
          startTime: { type: 'integer' },
          moves: { type: 'integer' },
          hintsUsed: { type: 'integer' },
          status: { type: 'string', enum: ['in_progress', 'completed', 'abandoned'] },
          score: { type: 'integer', nullable: true },
          completionTime: { type: 'integer', nullable: true },
        },
      },
      GameSessionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/GameSession' },
        },
      },
      AchievementUnlock: {
        type: 'object',
        required: ['userId', 'achievementId'],
        properties: {
          userId: { type: 'string', example: 'player_123' },
          achievementId: { type: 'string', example: 'first_win' },
        },
      },
    },
  },
};

const docsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>The Maze Game API — Docs</title>
  <link rel="icon" type="image/png" href="${SWAGGER_CDN}/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="${SWAGGER_CDN}/favicon-16x16.png" sizes="16x16" />
  <link rel="stylesheet" href="${SWAGGER_CDN}/swagger-ui.css" />
  <style>body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_CDN}/swagger-ui-bundle.js" crossorigin></script>
  <script src="${SWAGGER_CDN}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`;

/**
 * Wire the docs routes onto an Express app.
 */
function mount(app) {
  app.get('/openapi.json', (req, res) => res.json(spec));
  app.get(['/api-docs', '/docs'], (req, res) => {
    res.type('html').send(docsHtml);
  });
  app.get('/', (req, res) => res.redirect(302, '/api-docs'));
}

module.exports = { spec, docsHtml, mount, SWAGGER_CDN };
