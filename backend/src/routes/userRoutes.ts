import { Router, Response } from 'express';
import {
  getUserProfile, updateUserProfile, getAllUsers, getUserById,
  createUser, updateUser, changeUserRole, changeUserStatus, resetUserPassword
} from '../controllers/userController';
import { authMiddleware, adminMiddleware, adminOrLienChiMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { uploadAvatar } from '../config/multer';
import cloudinary from '../config/cloudinary';
import User from '../models/User';

const router = Router();

// Profile (mọi user đã login)
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

// Avatar upload
router.post('/profile/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện' });
      return;
    }
    
    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars', resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });
    
    const avatarUrl = uploadResult.secure_url;
    const user = await User.findByPk(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }
    await user.update({ avatar: avatarUrl });
    res.json({ message: 'Cập nhật ảnh đại diện thành công', avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải ảnh' });
  }
});

// Admin / Lien Chi: Quản lý tài khoản và lựa chọn Leader
router.get('/', authMiddleware, adminOrLienChiMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.put('/:id/reset-password', authMiddleware, adminMiddleware, resetUserPassword);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.put('/:id/role', authMiddleware, adminMiddleware, changeUserRole);
router.put('/:id/status', authMiddleware, adminMiddleware, changeUserStatus);

export default router;
