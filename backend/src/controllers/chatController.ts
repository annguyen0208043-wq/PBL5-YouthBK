import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await Conversation.findAll({
      order: [['updatedAt', 'DESC']]
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.findAll({
      where: { conversationId },
      include: ['sender'],
      order: [['createdAt', 'ASC']]
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user?.id;

    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content
    });

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
