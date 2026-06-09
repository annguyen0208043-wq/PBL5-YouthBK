import { Router } from 'express';
import {
  addMembers,
  createDirectConversation,
  createGroupConversation,
  getConversations,
  getInvitations,
  getMessages,
  inviteMember,
  markAsRead,
  respondInvitation,
  searchChatUsers,
  sendMessage,
  uploadMessage
} from '../controllers/chatController';
import multer from '../config/multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/users/search', authMiddleware, searchChatUsers);
router.get('/conversations', authMiddleware, getConversations);
router.post('/direct', authMiddleware, createDirectConversation);
router.post('/groups', authMiddleware, createGroupConversation);
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages);
router.post('/conversations/:conversationId/messages', authMiddleware, sendMessage);

// upload attachments for a message
const chatUploadDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(chatUploadDir)) fs.mkdirSync(chatUploadDir, { recursive: true });
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => cb(null, `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});

const uploadChatMiddleware = (req: any, res: any, next: any) => {
  const uploader = multer({ storage: chatStorage } as any).array('files', 6);
  uploader(req, res, (err: any) => {
    if (err) return next(err);
    next();
  });
};

router.post('/conversations/:conversationId/messages/upload', authMiddleware, uploadChatMiddleware, uploadMessage);
router.put('/conversations/:conversationId/read', authMiddleware, markAsRead);
router.post('/conversations/:conversationId/members', authMiddleware, addMembers);
router.post('/conversations/:conversationId/invitations', authMiddleware, inviteMember);
router.get('/invitations', authMiddleware, getInvitations);
router.patch('/invitations/:invitationId', authMiddleware, respondInvitation);
router.post('/send', authMiddleware, sendMessage);

export default router;
