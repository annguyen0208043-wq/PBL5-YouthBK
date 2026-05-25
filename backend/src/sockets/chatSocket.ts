import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import Conversation from '../models/Conversation';
import ConversationMember from '../models/ConversationMember';
import Message from '../models/Message';
import User from '../models/User';
import { verifyToken } from '../utils/jwt';

const userAttributes = ['id', 'name', 'email', 'studentId', 'avatar', 'role', 'faculty', 'department'];

function roomName(conversationId: number): string {
  return `conversation:${conversationId}`;
}

async function isConversationMember(conversationId: number, userId: number): Promise<boolean> {
  const membership = await ConversationMember.findOne({ where: { conversationId, userId } });
  return Boolean(membership);
}

let io: Server | null = null;

export function getIo(): Server | null {
  return io;
}

export function registerChatSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.toString().split(' ')[1];
      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const user = verifyToken(token);
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = Number(socket.data.user?.id);
    socket.join(`user:${userId}`);

    const memberships = await ConversationMember.findAll({ where: { userId } });
    memberships.forEach((membership) => socket.join(roomName(membership.conversationId)));

    socket.on('conversation:join', async ({ conversationId }) => {
      const id = Number(conversationId);
      if (id && await isConversationMember(id, userId)) {
        socket.join(roomName(id));
      }
    });

    socket.on('chat:typing', async ({ conversationId, isTyping }) => {
      const id = Number(conversationId);
      if (!id || !(await isConversationMember(id, userId))) return;
      socket.to(roomName(id)).emit('chat:typing', { conversationId: id, userId, isTyping: Boolean(isTyping) });
    });

    socket.on('chat:message', async ({ conversationId, content }, ack) => {
      try {
        const id = Number(conversationId);
        const normalizedContent = typeof content === 'string' ? content.trim().slice(0, 4000) : '';

        if (!id || !normalizedContent || !(await isConversationMember(id, userId))) {
          ack?.({ ok: false, message: 'Invalid message' });
          return;
        }

        const message = await Message.create({ conversationId: id, senderId: userId, content: normalizedContent });
        await Conversation.update({ updatedAt: new Date() }, { where: { id } });
        await ConversationMember.update({ lastReadMessageId: message.id }, { where: { conversationId: id, userId } });

        const hydratedMessage = await Message.findByPk(message.id, {
          include: [{ model: User, as: 'sender', attributes: userAttributes }]
        });

        if (io) io.to(roomName(id)).emit('chat:message', { conversationId: id, message: hydratedMessage });
        ack?.({ ok: true, message: hydratedMessage });
      } catch (error) {
        console.error('Socket send message error:', error);
        ack?.({ ok: false, message: 'Internal server error' });
      }
    });

    socket.on('chat:read', async ({ conversationId, messageId }) => {
      const id = Number(conversationId);
      const readMessageId = Number(messageId);
      if (!id || !(await isConversationMember(id, userId))) return;

      await ConversationMember.update(
        { lastReadMessageId: readMessageId || null },
        { where: { conversationId: id, userId } }
      );
      socket.to(roomName(id)).emit('chat:read', { conversationId: id, userId, messageId: readMessageId || null });
    });
  });

  return io;
}
