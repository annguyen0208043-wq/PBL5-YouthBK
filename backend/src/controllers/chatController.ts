import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Conversation from '../models/Conversation';
import ConversationMember from '../models/ConversationMember';
import ChatInvitation from '../models/ChatInvitation';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getIo } from '../sockets/chatSocket';

const userAttributes = ['id', 'name', 'email', 'studentId', 'avatar', 'role', 'faculty', 'department'];

function normalizeContent(content: unknown): string {
  return typeof content === 'string' ? content.trim().slice(0, 4000) : '';
}

function buildDirectKey(firstUserId: number, secondUserId: number): string {
  return [firstUserId, secondUserId].sort((a, b) => a - b).join(':');
}

async function ensureMember(conversationId: number, userId: number) {
  return ConversationMember.findOne({ where: { conversationId, userId } });
}

async function serializeConversation(conversation: Conversation, currentUserId: number) {
  const memberships = await ConversationMember.findAll({
    where: { conversationId: conversation.id },
    include: [{ model: User, as: 'user', attributes: userAttributes }],
    order: [['role', 'DESC'], ['joinedAt', 'ASC']]
  });

  const lastMessage = await Message.findOne({
    where: { conversationId: conversation.id },
    include: [{ model: User, as: 'sender', attributes: userAttributes }],
    order: [['createdAt', 'DESC']]
  });

  const currentMembership = memberships.find((member) => member.userId === currentUserId);
  const unreadCount = await Message.count({
    where: {
      conversationId: conversation.id,
      senderId: { [Op.ne]: currentUserId },
      ...(currentMembership?.lastReadMessageId ? { id: { [Op.gt]: currentMembership.lastReadMessageId } } : {})
    }
  });

    return {
      ...conversation.toJSON(),
      members: memberships.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        lastReadMessageId: (member as any).lastReadMessageId || null,
        user: member.get('user')
      })),
      lastMessage,
      unreadCount
    };
}

export const searchChatUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const query = String(req.query.q || '').trim();

    if (!currentUserId || query.length < 2) {
      res.json({ users: [] });
      return;
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId },
        isActive: true,
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { studentId: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: userAttributes,
      limit: 12,
      order: [['name', 'ASC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Search chat users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const memberships = await ConversationMember.findAll({
      where: { userId },
      include: [{ model: Conversation, as: 'conversation' }],
      order: [[{ model: Conversation, as: 'conversation' }, 'updatedAt', 'DESC']]
    });

    const conversations = await Promise.all(
      memberships
        .map((membership) => membership.get('conversation') as Conversation | undefined)
        .filter((conversation): conversation is Conversation => Boolean(conversation))
        .map((conversation) => serializeConversation(conversation, userId))
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const conversationId = Number(req.params.conversationId);
    const limit = Math.min(Number(req.query.limit) || 80, 100);

    if (!userId || !conversationId) {
      res.status(400).json({ message: 'Invalid conversation' });
      return;
    }

    const membership = await ensureMember(conversationId, userId);
    if (!membership) {
      res.status(403).json({ message: 'Bạn không thuộc hội thoại này' });
      return;
    }

    const messages = await Message.findAll({
      where: { conversationId },
      include: [{ model: User, as: 'sender', attributes: userAttributes }],
      order: [['createdAt', 'DESC']],
      limit
    });

    const orderedMessages = messages.reverse();
    const newestMessage = orderedMessages[orderedMessages.length - 1];
    if (newestMessage) {
      await membership.update({ lastReadMessageId: newestMessage.id });
    }

    res.json({ messages: orderedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDirectConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const identifier = String(req.body.identifier || '').trim();

    if (!currentUserId || !identifier) {
      res.status(400).json({ message: 'MSSV hoặc email là bắt buộc' });
      return;
    }

    const targetUser = await User.findOne({
      where: {
        id: { [Op.ne]: currentUserId },
        isActive: true,
        [Op.or]: [{ email: identifier }, { studentId: identifier }]
      },
      attributes: userAttributes
    });

    if (!targetUser) {
      res.status(404).json({ message: 'Không tìm thấy sinh viên phù hợp' });
      return;
    }

    const currentUser = await User.findByPk(currentUserId, { attributes: userAttributes });
    const directKey = buildDirectKey(currentUserId, targetUser.id);

    let conversation = await Conversation.findOne({ where: { directKey } });
    if (!conversation) {
      conversation = await Conversation.create({
        name: `${currentUser?.name || 'Sinh viên'} - ${targetUser.name}`,
        type: 'direct',
        directKey,
        createdBy: currentUserId
      });

      await ConversationMember.bulkCreate([
        { conversationId: conversation.id, userId: currentUserId, role: 'owner' },
        { conversationId: conversation.id, userId: targetUser.id, role: 'member' }
      ]);
    }

    res.status(201).json({ conversation: await serializeConversation(conversation, currentUserId) });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createGroupConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const name = String(req.body.name || '').trim().slice(0, 120);
    const memberIds: number[] = Array.isArray(req.body.memberIds)
      ? req.body.memberIds.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    if (!currentUserId || !name) {
      res.status(400).json({ message: 'Tên nhóm là bắt buộc' });
      return;
    }

    // Create conversation with owner only. Other users will be invited.
    const conversation = await Conversation.create({ name, type: 'group', directKey: null, createdBy: currentUserId });

    await ConversationMember.create({ conversationId: conversation.id, userId: currentUserId, role: 'owner' });

    // Create invitations for provided memberIds (if any)
    for (const uid of Array.from(new Set(memberIds.filter((id) => id !== currentUserId)))) {
      try {
        await ChatInvitation.findOrCreate({ where: { conversationId: conversation.id, invitedUserId: uid, status: 'pending' }, defaults: { invitedBy: currentUserId } });
      } catch (e) {
        // ignore per-user errors
      }
    }

    res.status(201).json({ conversation: await serializeConversation(conversation, currentUserId) });
  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversationId = Number(req.params.conversationId || req.body.conversationId);
    const userId = req.user?.id;
    const content = normalizeContent(req.body.content);

    if (!userId || !conversationId || !content) {
      res.status(400).json({ message: 'Nội dung tin nhắn là bắt buộc' });
      return;
    }

    const membership = await ensureMember(conversationId, userId);
    if (!membership) {
      res.status(403).json({ message: 'Bạn không thuộc hội thoại này' });
      return;
    }

    const message = await Message.create({ conversationId, senderId: userId, content, attachments: null });
    await Conversation.update({ updatedAt: new Date() }, { where: { id: conversationId } });
    await membership.update({ lastReadMessageId: message.id });

    const hydratedMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: userAttributes }]
    });

    // emit to socket room
    try {
      const io = getIo();
      if (io) io.to(`conversation:${conversationId}`).emit('chat:message', { conversationId, message: hydratedMessage });
    } catch (e) {
      console.error('Emit message error:', e);
    }

    res.status(201).json({ message: 'Message sent successfully', data: hydratedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user?.id;
    const content = normalizeContent(req.body.content) || '';

    if (!userId || !conversationId) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    const membership = await ensureMember(conversationId, userId);
    if (!membership) {
      res.status(403).json({ message: 'Bạn không thuộc hội thoại này' });
      return;
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const attachments = files.map((file) => ({ url: `/uploads/chat/${file.filename}`, filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, size: file.size }));

    const message = await Message.create({ conversationId, senderId: userId, content, attachments });
    await Conversation.update({ updatedAt: new Date() }, { where: { id: conversationId } });
    await membership.update({ lastReadMessageId: message.id });

    const hydratedMessage = await Message.findByPk(message.id, { include: [{ model: User, as: 'sender', attributes: userAttributes }] });

    // emit
    try {
      const io = getIo();
      if (io) io.to(`conversation:${conversationId}`).emit('chat:message', { conversationId, message: hydratedMessage });
    } catch (e) {
      console.error('Emit upload message error:', e);
    }

    res.status(201).json({ message: 'Uploaded message', data: hydratedMessage });
  } catch (error) {
    console.error('Upload message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const conversationId = Number(req.params.conversationId);
    const memberIds: number[] = Array.isArray(req.body.memberIds)
      ? req.body.memberIds.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    if (!currentUserId || !conversationId || memberIds.length === 0) {
      res.status(400).json({ message: 'Danh sách thành viên là bắt buộc' });
      return;
    }

    const conversation = await Conversation.findByPk(conversationId);
    const currentMember = await ensureMember(conversationId, currentUserId);
    if (!conversation || !currentMember || (conversation.type === 'group' && currentMember.role !== 'owner')) {
      res.status(403).json({ message: 'Bạn không có quyền thêm thành viên' });
      return;
    }

    const existingMembers = await ConversationMember.findAll({ where: { conversationId } });
    const existingIds = new Set(existingMembers.map((member) => member.userId));
    const newMemberIds = Array.from(new Set(memberIds)).filter((id) => !existingIds.has(id));

    if (newMemberIds.length > 0) {
      await ConversationMember.bulkCreate(
        newMemberIds.map((userId) => ({ conversationId, userId, role: 'member' }))
      );
    }

    res.json({ conversation: await serializeConversation(conversation, currentUserId) });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const conversationId = Number(req.params.conversationId);
    const identifier = String(req.body.identifier || '').trim();
    const message = String(req.body.message || '').trim().slice(0, 240) || null;

    if (!currentUserId || !conversationId || !identifier) {
      res.status(400).json({ message: 'Người nhận lời mời là bắt buộc' });
      return;
    }

    const conversation = await Conversation.findByPk(conversationId);
    const currentMember = await ensureMember(conversationId, currentUserId);
    if (!conversation || conversation.type !== 'group' || !currentMember) {
      res.status(403).json({ message: 'Bạn không thể mời vào hội thoại này' });
      return;
    }

    const targetUser = await User.findOne({
      where: {
        isActive: true,
        [Op.or]: [{ email: identifier }, { studentId: identifier }]
      },
      attributes: userAttributes
    });

    if (!targetUser) {
      res.status(404).json({ message: 'Không tìm thấy sinh viên phù hợp' });
      return;
    }

    const existingMember = await ensureMember(conversationId, targetUser.id);
    if (existingMember) {
      res.status(409).json({ message: 'Sinh viên này đã ở trong nhóm' });
      return;
    }

    const [invitation] = await ChatInvitation.findOrCreate({
      where: { conversationId, invitedUserId: targetUser.id, status: 'pending' },
      defaults: { invitedBy: currentUserId, message }
    });

    res.status(201).json({ invitation });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const invitations = await ChatInvitation.findAll({
      where: { invitedUserId: userId, status: 'pending' },
      include: [
        { model: Conversation, as: 'conversation' },
        { model: User, as: 'inviter', attributes: userAttributes }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const respondInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invitationId = Number(req.params.invitationId);
    const action = String(req.body.action || '').trim();

    if (!userId || !invitationId || !['accepted', 'declined'].includes(action)) {
      res.status(400).json({ message: 'Phản hồi lời mời không hợp lệ' });
      return;
    }

    const invitation = await ChatInvitation.findOne({
      where: { id: invitationId, invitedUserId: userId, status: 'pending' }
    });

    if (!invitation) {
      res.status(404).json({ message: 'Không tìm thấy lời mời' });
      return;
    }

    await invitation.update({ status: action as 'accepted' | 'declined', respondedAt: new Date() });

    if (action === 'accepted') {
      await ConversationMember.findOrCreate({
        where: { conversationId: invitation.conversationId, userId },
        defaults: { role: 'member' }
      });
    }

      // notify conversation about new member (create a message)
      if (action === 'accepted') {
        try {
          const user = await User.findByPk(userId, { attributes: userAttributes });
          const joinMsg = await Message.create({ conversationId: invitation.conversationId, senderId: userId, content: `${user?.name || 'Một thành viên'} đã tham gia nhóm` });
          const hydrated = await Message.findByPk(joinMsg.id, { include: [{ model: User, as: 'sender', attributes: userAttributes }] });
          const io = getIo();
          if (io) io.to(`conversation:${invitation.conversationId}`).emit('chat:message', { conversationId: invitation.conversationId, message: hydrated });
        } catch (e) {
          console.error('Send join message error:', e);
        }
      }

      res.json({ invitation });
  } catch (error) {
    console.error('Respond invitation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const conversationId = Number(req.params.conversationId);
    if (!userId || !conversationId) {
      res.status(400).json({ message: 'Invalid conversation' });
      return;
    }

    const membership = await ensureMember(conversationId, userId);
    if (!membership) {
      res.status(403).json({ message: 'Bạn không thuộc hội thoại này' });
      return;
    }

    const newestMessage = await Message.findOne({ where: { conversationId }, order: [['createdAt', 'DESC']] });
    await membership.update({ lastReadMessageId: newestMessage?.id || null });

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
