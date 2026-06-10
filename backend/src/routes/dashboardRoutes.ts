import { Router } from 'express';
import { getLienChiDashboard } from '../controllers/dashboardController';
import { authMiddleware, adminOrLienChiMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// /api/dashboard/lien-chi
router.get('/lien-chi', authMiddleware, adminOrLienChiMiddleware, getLienChiDashboard);

export default router;
