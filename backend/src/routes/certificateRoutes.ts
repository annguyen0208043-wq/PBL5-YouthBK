import { Router } from 'express';
import {
  getCertificateRequests, approveCertificate, rejectCertificate, requestCertificate
} from '../controllers/certificateController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Admin: Quản lý chứng nhận
router.get('/', authMiddleware, adminMiddleware, getCertificateRequests);
router.put('/:id/approve', authMiddleware, adminMiddleware, approveCertificate);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectCertificate);

// Student: Yêu cầu chứng nhận
router.post('/request', authMiddleware, requestCertificate);

export default router;
