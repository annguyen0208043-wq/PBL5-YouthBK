import { Router } from 'express';
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent,
  registerForEvent, getPendingEvents, approveEvent, rejectEvent, requestEventRevision
} from '../controllers/eventController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';
import { uploadEventImages } from '../config/multer';

const router = Router();

// Public
router.get('/', getAllEvents);
router.get('/pending', authMiddleware, adminMiddleware, getPendingEvents);
router.get('/:id', getEventById);

// Tạo sự kiện (admin hoặc liên chi đoàn) - có upload ảnh
router.post('/', authMiddleware, adminOrLienChiMiddleware, uploadEventImages.array('images', 10), createEvent);
router.put('/:id', authMiddleware, adminOrLienChiMiddleware, updateEvent);
router.delete('/:id', authMiddleware, adminOrLienChiMiddleware, deleteEvent);

// Đăng ký sự kiện (student)
router.post('/register', authMiddleware, registerForEvent);

// Admin: Duyệt / Từ chối / Yêu cầu chỉnh sửa
router.put('/:id/approve', authMiddleware, adminMiddleware, approveEvent);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectEvent);
router.put('/:id/request-revision', authMiddleware, adminMiddleware, requestEventRevision);

export default router;
