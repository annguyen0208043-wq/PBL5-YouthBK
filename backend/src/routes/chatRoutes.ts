import { Router } from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/:conversationId/messages', authMiddleware, getMessages);
router.post('/send', authMiddleware, sendMessage);

export default router;
