const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

let io = null;

// Store connected users: { odckr'admin': [socketIds], 'user_userId': [socketIds] }
const connectedUsers = new Map();

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URI || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        // Allow connection without auth for public events
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET
      );

      const user = await User.findById(decoded.userId).select('-hash -salt -verificationCode');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      // Allow connection but mark as unauthenticated
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room if authenticated
    if (socket.user) {
      const userId = socket.user._id.toString();
      socket.join(`user_${userId}`);

      // Track connected user
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);

      // Join role-based rooms
      if (socket.user.roles.includes('ADMIN') || socket.user.roles.includes('SUPERADMIN')) {
        socket.join('admins');
        console.log(`👤 Admin joined: ${socket.user.email}`);
      }

      if (socket.user.roles.includes('LECTURER')) {
        socket.join('lecturers');
      }

      if (socket.user.roles.includes('LEARNER')) {
        socket.join('learners');
      }

      console.log(`👤 User connected: ${socket.user.email} (${socket.user.roles.join(', ')})`);
    }

    // Handle joining specific rooms
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);

      if (socket.user) {
        const userId = socket.user._id.toString();
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Emit event to all admins
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToAdmins = (event, data) => {
  if (!io) return;
  io.to('admins').emit(event, data);
};

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit event to all lecturers
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToLecturers = (event, data) => {
  if (!io) return;
  io.to('lecturers').emit(event, data);
};

/**
 * Emit event to all learners
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToLearners = (event, data) => {
  if (!io) return;
  io.to('learners').emit(event, data);
};

/**
 * Emit event to all connected users
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Emit event to a specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

/**
 * Force logout a user from all connected sessions
 * Used when user logs in from another device (single session enforcement)
 * @param {string} userId - User ID
 * @param {string} reason - Reason for force logout
 * @param {object} metadata - Additional metadata (new device info, etc.)
 */
const forceLogoutUser = (userId, reason = 'logged_in_elsewhere', metadata = {}) => {
  if (!io) return;

  const userRoom = `user_${userId}`;

  // Emit force_logout to all connected sockets for this user
  io.to(userRoom).emit('force_logout', {
    reason,
    message: getForceLogoutMessage(reason),
    timestamp: new Date().toISOString(),
    ...metadata
  });

  console.log(`🔒 Force logout emitted to user ${userId}: ${reason}`);
};

/**
 * Get human-readable message for force logout reason
 */
const getForceLogoutMessage = (reason) => {
  const messages = {
    'logged_in_elsewhere': 'You have been logged out because your account was accessed from another device.',
    'password_changed': 'You have been logged out because your password was changed.',
    'account_suspended': 'Your account has been suspended by an administrator.',
    'session_expired': 'Your session has expired. Please log in again.',
    'security_logout': 'You have been logged out for security reasons.'
  };
  return messages[reason] || 'You have been logged out.';
};

/**
 * Check if a user is online
 * @param {string} userId - User ID
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

/**
 * Get all online users count
 * @returns {number}
 */
const getOnlineUsersCount = () => {
  return connectedUsers.size;
};

module.exports = {
  initializeSocket,
  getIO,
  emitToAdmins,
  emitToUser,
  emitToLecturers,
  emitToLearners,
  emitToAll,
  emitToRoom,
  forceLogoutUser,
  isUserOnline,
  getOnlineUsersCount
};
