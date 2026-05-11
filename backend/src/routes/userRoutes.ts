import { Router } from 'express';
import {
  getUserProfile, updateUserProfile, getAllUsers, getUserById,
  createUser, updateUser, changeUserRole, changeUserStatus
} from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Profile (mọi user đã login)
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

// Admin: Quản lý tài khoản
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.put('/:id/role', authMiddleware, adminMiddleware, changeUserRole);
router.put('/:id/status', authMiddleware, adminMiddleware, changeUserStatus);

export default router;
