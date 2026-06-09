import { Router } from 'express';
import {
  getNotifications, markAsRead, getSentNotifications, getUnreadCount,
  getFaculties, searchRecipients, sendNotification
} from '../controllers/notificationController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// User: Thông báo cá nhân
router.get('/', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.put('/:id/read', authMiddleware, markAsRead);

// Admin / LienChi: Quản lý thông báo
router.get('/sent', authMiddleware, adminOrLienChiMiddleware, getSentNotifications);
router.get('/faculties', authMiddleware, adminOrLienChiMiddleware, getFaculties);
router.get('/recipients/search', authMiddleware, adminOrLienChiMiddleware, searchRecipients);
router.post('/', authMiddleware, adminOrLienChiMiddleware, sendNotification);

export default router;
