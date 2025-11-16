# Maze Game API Documentation

## Base URL
```
Production: https://mazegame.example.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication
Currently, the API does not require authentication. User identification is done via player IDs stored in localStorage.

## Rate Limiting
- API requests: 100 requests per 15 minutes per IP
- Burst limit: 20 additional requests allowed

---

## Endpoints

### Health Check

#### GET /api/health
Check API health status.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123456,
  "environment": "production"
}
```

---

## Leaderboard

### GET /api/v1/leaderboard
Retrieve leaderboard entries.

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 100 | Number of entries to return (max 100) |
| offset | integer | 0 | Number of entries to skip |
| timeframe | string | 'all' | Filter by time: 'all', 'daily', 'weekly', 'monthly' |

**Response**
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "data": [
    {
      "id": 1234567890,
      "playerName": "Player1",
      "score": 150,
      "completionTime": 45000,
      "difficulty": "medium",
      "moves": 50,
      "timestamp": 1234567890000
    }
  ]
}
```

### POST /api/v1/leaderboard
Submit a score to the leaderboard.

**Request Body**
```json
{
  "playerName": "string (required, max 20 chars)",
  "score": "integer (required)",
  "completionTime": "integer (required, milliseconds)",
  "difficulty": "string (optional: easy|medium|hard|expert)",
  "moves": "integer (optional)"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "playerName": "Player1",
    "score": 150,
    "completionTime": 45000,
    "difficulty": "medium",
    "moves": 50,
    "timestamp": 1234567890000
  }
}
```

**Error Responses**
- 400: Invalid input (missing required fields, name too long)

### GET /api/v1/leaderboard/rank/:playerName
Get a player's rank on the leaderboard.

**Response**
```json
{
  "success": true,
  "data": {
    "rank": 5,
    "entry": {
      "id": 1234567890,
      "playerName": "Player1",
      "score": 150,
      "completionTime": 45000,
      "difficulty": "medium",
      "moves": 50,
      "timestamp": 1234567890000
    },
    "totalEntries": 100
  }
}
```

**Error Responses**
- 404: Player not found

---

## Game Sessions

### POST /api/v1/games/start
Start a new game session.

**Request Body**
```json
{
  "playerId": "string (optional)",
  "difficulty": "string (optional: easy|medium|hard|expert, default: medium)",
  "mode": "string (optional: single|multiplayer, default: single)"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "playerId": "player_123",
    "difficulty": "medium",
    "mode": "single",
    "startTime": 1234567890000,
    "moves": 0,
    "hintsUsed": 0,
    "status": "in_progress"
  }
}
```

### PUT /api/v1/games/:id/move
Record a move in the game.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "moves": 1,
    "status": "in_progress"
  }
}
```

**Error Responses**
- 404: Game session not found
- 400: Game session is not active

### PUT /api/v1/games/:id/complete
Complete a game session and calculate score.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "status": "completed",
    "endTime": 1234567890000,
    "completionTime": 45000,
    "score": 150,
    "moves": 50,
    "hintsUsed": 1
  }
}
```

### GET /api/v1/games/stats
Get aggregate game statistics.

**Response**
```json
{
  "success": true,
  "data": {
    "totalGames": 1000,
    "averageCompletionTime": 52000,
    "averageMoves": 60,
    "averageScore": 120
  }
}
```

---

## Achievements

### GET /api/v1/achievements
Get all available achievements.

**Response**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "first_win",
      "name": "First Victory",
      "description": "Complete your first maze",
      "icon": "🏆",
      "points": 10
    }
  ]
}
```

### GET /api/v1/achievements/user/:userId
Get achievements for a specific user.

**Response**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "first_win",
        "name": "First Victory",
        "description": "Complete your first maze",
        "icon": "🏆",
        "points": 10,
        "unlocked": true,
        "unlockedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalPoints": 10
  }
}
```

### POST /api/v1/achievements/unlock
Unlock an achievement for a user.

**Request Body**
```json
{
  "userId": "string (required)",
  "achievementId": "string (required)"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "first_win",
    "name": "First Victory",
    "description": "Complete your first maze",
    "icon": "🏆",
    "points": 10
  }
}
```

**Error Responses**
- 400: Missing required fields or achievement already unlocked
- 404: Achievement not found

---

## User Management

### POST /api/v1/users/register
Register a new user.

**Request Body**
```json
{
  "username": "string (required)",
  "email": "string (required)"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "username": "player1",
    "email": "player1@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "stats": {
      "gamesPlayed": 0,
      "gamesWon": 0,
      "totalScore": 0,
      "bestTime": null,
      "achievements": []
    }
  }
}
```

**Error Responses**
- 400: Missing required fields
- 409: User already exists

### GET /api/v1/users/:id
Get user profile.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "username": "player1",
    "email": "player1@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "stats": {
      "gamesPlayed": 10,
      "gamesWon": 8,
      "totalScore": 1500,
      "bestTime": 45000,
      "achievements": ["first_win", "speed_demon"]
    }
  }
}
```

**Error Responses**
- 404: User not found

### PUT /api/v1/users/:id/stats
Update user statistics.

**Request Body**
```json
{
  "gamesPlayed": "integer (optional)",
  "gamesWon": "integer (optional)",
  "totalScore": "integer (optional)",
  "bestTime": "integer (optional)"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1234567890.123,
    "username": "player1",
    "stats": {
      "gamesPlayed": 11,
      "gamesWon": 9,
      "totalScore": 1650,
      "bestTime": 42000
    }
  }
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Events

#### join-room
Join a multiplayer game room.
```javascript
socket.emit('join-room', roomId);
```

**Server Response**
```javascript
socket.on('player-joined', (data) => {
  // data: { playerId, playerCount }
});
```

#### player-move
Broadcast player movement.
```javascript
socket.emit('player-move', { roomId, position: { x, y } });
```

**Server Response**
```javascript
socket.on('opponent-move', (data) => {
  // data: { playerId, position: { x, y } }
});
```

#### game-complete
Notify when a player completes the game.
```javascript
socket.emit('game-complete', { roomId, time, moves });
```

**Server Response**
```javascript
socket.on('game-finished', (data) => {
  // data: { winner, time, moves }
});
```

#### leave-room
Leave a multiplayer room.
```javascript
socket.emit('leave-room', roomId);
```

**Server Response**
```javascript
socket.on('player-left', (data) => {
  // data: { playerId, playerCount }
});
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message here",
  "stack": "Stack trace (development only)"
}
```

### Common HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error

---

## Score Calculation

Score is calculated using the following formula:

```
baseScore = 100
timePenalty = (completionTime / 1000) * 0.1
movePenalty = moves * 0.5
hintPenalty = hintsUsed * hintCost

difficultyMultiplier = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
  expert: 3.0
}

finalScore = MAX(0, (baseScore - timePenalty - movePenalty - hintPenalty) * difficultyMultiplier)
```

---

## Achievements List

| ID | Name | Description | Points | Unlock Condition |
|----|------|-------------|--------|------------------|
| first_win | First Victory | Complete your first maze | 10 | Win 1 game |
| speed_demon | Speed Demon | Complete a maze in under 30 seconds | 25 | Complete in < 30s |
| perfectionist | Perfectionist | Complete a maze without using any hints | 20 | Win with 0 hints |
| efficient | Efficient Navigator | Complete a maze with minimal moves | 30 | Win with optimal path |
| marathon | Marathon Runner | Complete 100 mazes | 50 | Win 100 games |
| expert_conqueror | Expert Conqueror | Complete an expert difficulty maze | 40 | Win on expert |
| streak_master | Streak Master | Win 10 games in a row | 35 | 10 win streak |
| night_owl | Night Owl | Play between midnight and 4 AM | 15 | Play 12am-4am |

---

## Examples

### JavaScript Fetch Example
```javascript
// Submit score to leaderboard
async function submitScore(playerName, score, completionTime) {
  try {
    const response = await fetch('/api/v1/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        score,
        completionTime,
        difficulty: 'medium',
        moves: 50,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('Score submitted:', data.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### cURL Example
```bash
# Get leaderboard
curl -X GET "http://localhost:3000/api/v1/leaderboard?limit=10&timeframe=daily"

# Submit score
curl -X POST http://localhost:3000/api/v1/leaderboard \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "TestPlayer",
    "score": 150,
    "completionTime": 45000,
    "difficulty": "medium",
    "moves": 50
  }'
```

---

## Versioning

The API uses URL versioning. Current version: **v1**

Future versions will be available at `/api/v2/`, etc.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/hoangsonww/The-Maze-Game/issues
- Email: support@mazegame.example.com
