const express = require('express');
const multer = require('multer');
const path = require('path');
const { createEvent, getAllEvents, getPendingEvents, approveEvent, rejectEvent, requestEventRevision } = require('../controllers/eventController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Lấy danh sách sự kiện
router.get('/', getAllEvents);

// Lấy danh sách sự kiện chờ duyệt
router.get('/pending', verifyToken, isAdmin, getPendingEvents);

// Tạo sự kiện mới (Yêu cầu đăng nhập và có quyền Đoàn trường/Admin)
router.post('/', verifyToken, upload.array('images', 10), createEvent);

// Duyệt sự kiện
router.put('/:eventId/approve', verifyToken, isAdmin, approveEvent);

// Từ chối sự kiện
router.put('/:eventId/reject', verifyToken, isAdmin, rejectEvent);

// Yêu cầu chỉnh sửa sự kiện
router.put('/:eventId/request-revision', verifyToken, isAdmin, requestEventRevision);

module.exports = router;
