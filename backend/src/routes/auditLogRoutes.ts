import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/audit-logs - Chỉ admin mới được xem nhật ký hoạt động
router.get('/', authMiddleware, adminMiddleware, getAuditLogs);

export default router;
