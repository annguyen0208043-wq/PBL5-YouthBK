import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { uploadMemory } from '../config/multer';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint upload file, yêu cầu đăng nhập
router.post('/', authMiddleware, uploadMemory.single('file'), uploadFile);

export default router;
