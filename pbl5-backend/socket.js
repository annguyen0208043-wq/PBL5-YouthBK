const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, NotificationRecipient } = require('./models');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user.id, role: user.role };
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    try {
      const userId = socket.user?.id;
      const room = `user_${userId}`;
      socket.join(room);
      socket.on('disconnect', () => {
      });

      // client can request to mark as read via socket
      socket.on('mark_as_read', async (payload) => {
        try {
          const { notificationId } = payload || {};
          if (!notificationId) return;
          const recipient = await NotificationRecipient.findOne({ where: { notificationId, userId } });
          if (!recipient) return;
          if (!recipient.readAt) {
            await recipient.update({ readAt: new Date() });
            // Notify client(s) in the same room about update
            io.to(room).emit('notification_read', { notificationId, userId });
          }
        } catch (err) {
          console.error('socket mark_as_read error:', err.message);
        }
      });
    } catch (err) {
      console.error('socket connection error:', err.message);
    }
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
