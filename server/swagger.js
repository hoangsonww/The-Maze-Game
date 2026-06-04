/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

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
    version: '1.3.0',
    description:
      'Backend API for The Maze Game. **Auth, Users, Leaderboard, Games and ' +
      'Achievements** are backed by MongoDB (database `maze-game`) and are live. ' +
      'The **Social, Challenges, Mazes and Admin** groups require the PostgreSQL ' +
      'driver (`DB_DRIVER=postgres`) and are documented here for when it is ' +
      'switched on. Authenticated endpoints take a JWT via `Authorization: ' +
      'Bearer <token>` (obtain one from `/api/v1/auth/register` or `/login`).',
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
    {
      name: 'Social',
      description:
        'Friends and activity (requires DB_DRIVER=postgres; inactive on the Mongo deploy)',
    },
    {
      name: 'Challenges',
      description: 'Daily challenges and tournaments (requires DB_DRIVER=postgres)',
    },
    {
      name: 'Mazes',
      description: 'User-created custom mazes (requires DB_DRIVER=postgres)',
    },
    {
      name: 'Admin',
      description: 'Administration (admin/moderator role; requires DB_DRIVER=postgres)',
    },
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

    // ----- Social (requires DB_DRIVER=postgres) -----
    '/api/v1/social/friends': {
      get: {
        tags: ['Social'],
        summary: "List the current user's accepted friends",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Friends list' }, 401: ok('Unauthorized', 'Error') },
      },
    },
    '/api/v1/social/friend-requests': {
      get: {
        tags: ['Social'],
        summary: 'List incoming pending friend requests',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pending requests' }, 401: ok('Unauthorized', 'Error') },
      },
    },
    '/api/v1/social/friend-request': {
      post: {
        tags: ['Social'],
        summary: 'Send a friend request',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/FriendRequest' } },
          },
        },
        responses: {
          201: { description: 'Request created' },
          400: ok('Bad request', 'Error'),
          409: ok('Already exists', 'Error'),
        },
      },
    },
    '/api/v1/social/friend-request/{id}': {
      put: {
        tags: ['Social'],
        summary: 'Accept or reject a friend request',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'requester user id',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/FriendRequestAction' } },
          },
        },
        responses: {
          200: { description: 'Updated' },
          400: ok('Invalid action', 'Error'),
          404: ok('Not found', 'Error'),
        },
      },
    },
    '/api/v1/social/friends/{id}': {
      delete: {
        tags: ['Social'],
        summary: 'Remove a friend',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Removed' }, 404: ok('Not found', 'Error') },
      },
    },
    '/api/v1/social/search': {
      get: {
        tags: ['Social'],
        summary: 'Search users by username',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2 },
            description: 'username fragment (min 2 chars)',
          },
        ],
        responses: { 200: { description: 'Matching users' }, 400: ok('Query too short', 'Error') },
      },
    },
    '/api/v1/social/activity': {
      get: {
        tags: ['Social'],
        summary: "Recent completed games of the user's friends",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Activity feed' }, 401: ok('Unauthorized', 'Error') },
      },
    },

    // ----- Challenges (requires DB_DRIVER=postgres) -----
    '/api/v1/challenges/daily': {
      get: {
        tags: ['Challenges'],
        summary: "Today's daily challenge (auto-created if missing)",
        description: 'Optional bearer token — include it to get `completed_by_user`.',
        responses: { 200: { description: 'Daily challenge' } },
      },
    },
    '/api/v1/challenges/daily/complete': {
      post: {
        tags: ['Challenges'],
        summary: "Submit today's daily-challenge result",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/DailyComplete' } },
          },
        },
        responses: {
          200: { description: 'Recorded (returns final score + bonus)' },
          400: ok('Missing fields', 'Error'),
          404: ok('No challenge today', 'Error'),
          409: ok('Already completed', 'Error'),
        },
      },
    },
    '/api/v1/challenges/daily/leaderboard': {
      get: {
        tags: ['Challenges'],
        summary: "Today's daily-challenge leaderboard (top 100)",
        responses: { 200: { description: 'Leaderboard' } },
      },
    },
    '/api/v1/challenges/tournaments': {
      get: {
        tags: ['Challenges'],
        summary: 'List upcoming and active tournaments',
        responses: { 200: { description: 'Tournaments with participant counts' } },
      },
    },
    '/api/v1/challenges/tournaments/{id}/join': {
      post: {
        tags: ['Challenges'],
        summary: 'Join an upcoming tournament',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          201: { description: 'Joined' },
          404: ok('Not found / already started', 'Error'),
          409: ok('Full / already joined', 'Error'),
        },
      },
    },
    '/api/v1/challenges/tournaments/{id}/leaderboard': {
      get: {
        tags: ['Challenges'],
        summary: 'Tournament leaderboard (top 100)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Leaderboard' } },
      },
    },

    // ----- Mazes (requires DB_DRIVER=postgres) -----
    '/api/v1/mazes/custom': {
      get: {
        tags: ['Mazes'],
        summary: 'Browse public custom mazes',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['created_at', 'rating', 'popular'],
              default: 'created_at',
            },
          },
          {
            name: 'difficulty',
            in: 'query',
            schema: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
          },
        ],
        responses: { 200: { description: 'Custom mazes' } },
      },
      post: {
        tags: ['Mazes'],
        summary: 'Create a custom maze',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMaze' } } },
        },
        responses: { 201: { description: 'Created' }, 400: ok('Validation error', 'Error') },
      },
    },
    '/api/v1/mazes/custom/{id}': {
      get: {
        tags: ['Mazes'],
        summary: 'Get a custom maze (public, or your own private one)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Maze' }, 404: ok('Not found', 'Error') },
      },
      put: {
        tags: ['Mazes'],
        summary: 'Update your custom maze',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMaze' } } },
        },
        responses: {
          200: { description: 'Updated' },
          400: ok('No updates', 'Error'),
          404: ok('Not found / unauthorized', 'Error'),
        },
      },
      delete: {
        tags: ['Mazes'],
        summary: 'Delete your custom maze',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Deleted' },
          404: ok('Not found / unauthorized', 'Error'),
        },
      },
    },
    '/api/v1/mazes/custom/{id}/play': {
      post: {
        tags: ['Mazes'],
        summary: 'Increment a maze play count',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Recorded' } },
      },
    },
    '/api/v1/mazes/custom/{id}/rate': {
      post: {
        tags: ['Mazes'],
        summary: 'Rate a custom maze (1-5)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RateMaze' } } },
        },
        responses: { 200: { description: 'Rating submitted' }, 400: ok('Invalid rating', 'Error') },
      },
    },
    '/api/v1/mazes/my': {
      get: {
        tags: ['Mazes'],
        summary: "List the current user's custom mazes",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Your mazes' }, 401: ok('Unauthorized', 'Error') },
      },
    },

    // ----- Admin (admin/moderator role; requires DB_DRIVER=postgres) -----
    '/api/v1/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform statistics (users / games / achievements / mazes)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Stats' }, 403: ok('Forbidden', 'Error') },
      },
    },
    '/api/v1/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (paginated, filterable)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'username or email fragment',
          },
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['user', 'admin', 'moderator'] },
          },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Users page' }, 403: ok('Forbidden', 'Error') },
      },
    },
    '/api/v1/admin/users/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update a user (activate / change role)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AdminUpdateUser' } },
          },
        },
        responses: {
          200: { description: 'Updated' },
          400: ok('Invalid role / no updates', 'Error'),
          404: ok('Not found', 'Error'),
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Deleted' }, 404: ok('Not found', 'Error') },
      },
    },
    '/api/v1/admin/games': {
      get: {
        tags: ['Admin'],
        summary: 'List game sessions (paginated, filterable)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['in_progress', 'completed', 'abandoned'] },
          },
          {
            name: 'difficulty',
            in: 'query',
            schema: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
          },
        ],
        responses: { 200: { description: 'Games page' }, 403: ok('Forbidden', 'Error') },
      },
    },
    '/api/v1/admin/announcements': {
      post: {
        tags: ['Admin'],
        summary: 'Email an announcement to users',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Announcement' } },
          },
        },
        responses: { 200: { description: 'Sent' }, 400: ok('Missing fields', 'Error') },
      },
    },
    '/api/v1/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'DAU, mode popularity, and difficulty distribution',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Analytics' }, 403: ok('Forbidden', 'Error') },
      },
    },
    '/api/v1/admin/tournaments': {
      post: {
        tags: ['Admin'],
        summary: 'Create a tournament',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateTournament' } },
          },
        },
        responses: { 201: { description: 'Created' }, 400: ok('Missing fields', 'Error') },
      },
    },
    '/api/v1/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Recent error events (admin role only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'level', in: 'query', schema: { type: 'string', default: 'info' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: { 200: { description: 'Log events' }, 403: ok('Forbidden', 'Error') },
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
      FriendRequest: {
        type: 'object',
        required: ['friendId'],
        properties: {
          friendId: {
            type: 'string',
            format: 'uuid',
            description: 'user id to befriend',
            example: '665f1c…',
          },
        },
      },
      FriendRequestAction: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['accept', 'reject'], example: 'accept' },
        },
      },
      DailyComplete: {
        type: 'object',
        required: ['score', 'completionTime', 'moves'],
        properties: {
          score: { type: 'integer', example: 180 },
          completionTime: { type: 'integer', description: 'milliseconds', example: 22000 },
          moves: { type: 'integer', example: 95 },
        },
      },
      CreateMaze: {
        type: 'object',
        required: ['name', 'mazeData', 'rows', 'cols'],
        properties: {
          name: { type: 'string', example: 'My twisty maze' },
          description: { type: 'string', example: 'A tricky one' },
          mazeData: { type: 'object', description: 'maze layout (JSON; e.g. a wall grid)' },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard', 'expert'],
            example: 'hard',
          },
          rows: { type: 'integer', minimum: 5, maximum: 50, example: 20 },
          cols: { type: 'integer', minimum: 5, maximum: 50, example: 20 },
          isPublic: { type: 'boolean', default: false },
        },
      },
      UpdateMaze: {
        type: 'object',
        description: 'Any subset of these fields',
        properties: {
          name: { type: 'string', example: 'Renamed maze' },
          description: { type: 'string' },
          isPublic: { type: 'boolean' },
        },
      },
      RateMaze: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
          comment: { type: 'string', example: 'Loved it' },
        },
      },
      AdminUpdateUser: {
        type: 'object',
        description: 'Any subset of these fields',
        properties: {
          isActive: { type: 'boolean', example: true },
          role: { type: 'string', enum: ['user', 'admin', 'moderator'], example: 'moderator' },
        },
      },
      Announcement: {
        type: 'object',
        required: ['subject', 'message'],
        properties: {
          subject: { type: 'string', example: 'New season!' },
          message: { type: 'string', example: 'Tournaments are live.' },
          targetRole: {
            type: 'string',
            enum: ['all', 'user', 'admin', 'moderator'],
            default: 'all',
          },
        },
      },
      CreateTournament: {
        type: 'object',
        required: ['name', 'startTime', 'endTime', 'difficulty'],
        properties: {
          name: { type: 'string', example: 'Weekend Cup' },
          description: { type: 'string' },
          startTime: { type: 'string', format: 'date-time', example: '2026-06-10T18:00:00Z' },
          endTime: { type: 'string', format: 'date-time', example: '2026-06-12T18:00:00Z' },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard', 'expert'],
            example: 'hard',
          },
          prizePool: { type: 'integer', example: 1000 },
          maxParticipants: { type: 'integer', example: 64 },
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
