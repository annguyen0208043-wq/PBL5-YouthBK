import { Router } from 'express';
import {
  getNotifications, markAsRead, getSentNotifications,
  getFaculties, searchRecipients, sendNotification
} from '../controllers/notificationController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// User: Thông báo cá nhân
router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markAsRead);

// Admin: Quản lý thông báo
router.get('/sent', authMiddleware, adminMiddleware, getSentNotifications);
router.get('/faculties', authMiddleware, adminMiddleware, getFaculties);
router.get('/recipients/search', authMiddleware, adminMiddleware, searchRecipients);
router.post('/', authMiddleware, adminMiddleware, sendNotification);

export default router;
