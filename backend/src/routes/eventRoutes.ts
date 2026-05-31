import { Router } from 'express';
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, submitEvent,
  registerForEvent, getPendingEvents, approveEvent, rejectEvent, requestEventRevision,
  approveUpdate, approveCancel, approvePostpone, rejectRequest,
  requestUpdate, requestCancel, requestPostpone
} from '../controllers/eventController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';
import { uploadEventImages } from '../config/multer';

const router = Router();

// Public / General
router.get('/', getAllEvents);
router.get('/pending', authMiddleware, adminMiddleware, getPendingEvents);
router.get('/:id', getEventById);

// LienChi / Admin Create & Update
router.post('/', authMiddleware, adminOrLienChiMiddleware, uploadEventImages.array('images', 10), createEvent);
router.put('/:id', authMiddleware, adminOrLienChiMiddleware, uploadEventImages.array('images', 10), updateEvent);
router.post('/:id/submit', authMiddleware, adminOrLienChiMiddleware, submitEvent);
router.delete('/:id', authMiddleware, adminOrLienChiMiddleware, deleteEvent);

// LienChi Requests (sau khi đã approved)
router.post('/:id/request-update', authMiddleware, adminOrLienChiMiddleware, requestUpdate);
router.post('/:id/request-cancel', authMiddleware, adminOrLienChiMiddleware, requestCancel);
router.post('/:id/request-postpone', authMiddleware, adminOrLienChiMiddleware, requestPostpone);

// Đăng ký sự kiện (student)
router.post('/register', authMiddleware, registerForEvent);

// Admin: Duyệt / Từ chối / Yêu cầu chỉnh sửa
router.put('/:id/approve', authMiddleware, adminMiddleware, approveEvent);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectEvent);
router.put('/:id/request-revision', authMiddleware, adminMiddleware, requestEventRevision);
router.put('/:id/approve-update', authMiddleware, adminMiddleware, approveUpdate);
router.put('/:id/approve-cancel', authMiddleware, adminMiddleware, approveCancel);
router.put('/:id/approve-postpone', authMiddleware, adminMiddleware, approvePostpone);
router.put('/:id/reject-request', authMiddleware, adminMiddleware, rejectRequest);

export default router;
