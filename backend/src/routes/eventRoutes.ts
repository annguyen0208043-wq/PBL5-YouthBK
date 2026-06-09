import { Router } from 'express';
import {
  createEvent, getEvents, getEventById, updateEvent, deleteEvent, submitEvent,
  registerForEvent, cancelRegistration, getPendingEvents, approveEvent, rejectEvent, requestEventRevision,
  approveUpdate, approveCancel, approvePostpone, rejectRequest,
  requestUpdate, requestCancel, requestPostpone,
  getEventRegistrations, manuallyAddRegistration, updateRegistrationStatus, deleteRegistration,
  toggleEventQR, checkInQR,
  submitEventFeedback, getEventFeedbacks
} from '../controllers/eventController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';
import { uploadEventImages } from '../config/multer';

const router = Router();

// Lấy danh sách đăng ký của 1 sự kiện (Lien Chi / Admin)
router.get('/:id/registrations', authMiddleware, adminOrLienChiMiddleware, getEventRegistrations);
router.post('/:id/registrations/manual', authMiddleware, adminOrLienChiMiddleware, manuallyAddRegistration);
router.put('/registrations/:registrationId', authMiddleware, adminOrLienChiMiddleware, updateRegistrationStatus);
router.delete('/registrations/:registrationId', authMiddleware, adminOrLienChiMiddleware, deleteRegistration);

// Public / General
router.get('/', authMiddleware, getEvents);
router.get('/pending', authMiddleware, adminMiddleware, getPendingEvents);
router.get('/:id', authMiddleware, getEventById);

// LienChi / Admin Create & Update
router.post('/', authMiddleware, adminOrLienChiMiddleware, uploadEventImages.array('images', 10), createEvent);
router.put('/:id', authMiddleware, adminOrLienChiMiddleware, uploadEventImages.array('images', 10), updateEvent);
router.post('/:id/submit', authMiddleware, adminOrLienChiMiddleware, submitEvent);
router.delete('/:id', authMiddleware, adminOrLienChiMiddleware, deleteEvent);

// LienChi Requests (sau khi đã approved)
router.post('/:id/request-update', authMiddleware, adminOrLienChiMiddleware, requestUpdate);
router.post('/:id/request-cancel', authMiddleware, adminOrLienChiMiddleware, requestCancel);
router.post('/:id/request-postpone', authMiddleware, adminOrLienChiMiddleware, requestPostpone);

// Đăng ký sự kiện & Điểm danh (student)
router.post('/:id/register', authMiddleware, registerForEvent);
router.post('/:id/cancel-registration', authMiddleware, cancelRegistration);
router.post('/:id/attendance/qr', authMiddleware, checkInQR);
router.post('/:id/feedback', authMiddleware, submitEventFeedback);

// Admin/LienChi quản lý QR & Feedback
router.put('/:id/qr/toggle', authMiddleware, adminOrLienChiMiddleware, toggleEventQR);
router.get('/:id/feedbacks', authMiddleware, adminOrLienChiMiddleware, getEventFeedbacks);

// Admin: Duyệt / Từ chối / Yêu cầu chỉnh sửa
router.put('/:id/approve', authMiddleware, adminMiddleware, approveEvent);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectEvent);
router.put('/:id/request-revision', authMiddleware, adminMiddleware, requestEventRevision);
router.put('/:id/approve-update', authMiddleware, adminMiddleware, approveUpdate);
router.put('/:id/approve-cancel', authMiddleware, adminMiddleware, approveCancel);
router.put('/:id/approve-postpone', authMiddleware, adminMiddleware, approvePostpone);
router.put('/:id/reject-request', authMiddleware, adminMiddleware, rejectRequest);

export default router;
