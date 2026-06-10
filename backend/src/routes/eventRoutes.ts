import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  submitEvent,
  endEvent,
  registerForEvent,
  cancelRegistration,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  requestEventRevision,
  handleBelowMinimum,
  getEventRegistrations,
  manuallyAddRegistration,
  updateRegistrationStatus,
  deleteRegistration,
  toggleEventQR,
  checkInGPS,
  scanStudentQR,
  submitEventFeedback,
  getEventFeedbacks
} from '../controllers/eventController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';

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
router.post('/', authMiddleware, adminOrLienChiMiddleware, createEvent);
router.put('/:id', authMiddleware, adminOrLienChiMiddleware, updateEvent);
router.post('/:id/submit', authMiddleware, adminOrLienChiMiddleware, submitEvent);
router.delete('/:id', authMiddleware, adminOrLienChiMiddleware, deleteEvent);

// Kết thúc sự kiện sớm (Lien Chi / Admin)
router.post('/:id/end', authMiddleware, adminOrLienChiMiddleware, endEvent);

// Below Minimum Resolution (Lien Chi)
router.post('/:id/below-min', authMiddleware, adminOrLienChiMiddleware, handleBelowMinimum);

// Đăng ký sự kiện & Điểm danh (student)
router.post('/:id/register', authMiddleware, registerForEvent);
router.post('/:id/cancel-registration', authMiddleware, cancelRegistration);
router.post('/:id/attendance/gps', authMiddleware, checkInGPS);
router.post('/:id/attendance/scan-student', authMiddleware, adminOrLienChiMiddleware, scanStudentQR);
router.post('/:id/feedback', authMiddleware, submitEventFeedback);

// Admin/LienChi quản lý QR
router.put('/:id/qr/toggle', authMiddleware, adminOrLienChiMiddleware, toggleEventQR);
router.get('/:id/feedbacks', authMiddleware, getEventFeedbacks);

// Admin: Duyệt / Từ chối / Yêu cầu chỉnh sửa
router.put('/:id/approve', authMiddleware, adminMiddleware, approveEvent);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectEvent);
router.put('/:id/request-revision', authMiddleware, adminMiddleware, requestEventRevision);

export default router;
