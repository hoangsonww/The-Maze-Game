/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * Local / Docker entrypoint.
 *
 * Wraps the shared Express app (server/app.js) in an HTTP server, attaches
 * Socket.IO for real-time multiplayer, and starts listening. Vercel does NOT
 * use this file — it imports the app directly via api/index.js (Socket.IO is
 * not supported on serverless).
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const logger = require('./utils/logger');

const httpServer = createServer(app);

// Socket.IO for multiplayer
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);
    io.to(roomId).emit('player-joined', { playerId: socket.id, playerCount: room ? room.size : 0 });
    logger.info(`Player ${socket.id} joined room ${roomId}`);
  });

  socket.on('player-move', (data) => {
    socket.to(data.roomId).emit('opponent-move', { playerId: socket.id, position: data.position });
  });

  socket.on('game-complete', (data) => {
    io.to(data.roomId).emit('game-finished', {
      winner: socket.id,
      time: data.time,
      moves: data.moves,
    });
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);
    io.to(roomId).emit('player-left', { playerId: socket.id, playerCount: room ? room.size : 0 });
  });

  socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
  logger.info(`📚 API docs at http://${HOST}:${PORT}/api-docs`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io, httpServer };
