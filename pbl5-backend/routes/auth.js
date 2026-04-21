const express = require('express');
const { register, login, createUserByAdmin } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// API tạo tài khoản người dùng bởi Quản trị viên
router.post('/create-user', verifyToken, isAdmin, createUserByAdmin);

module.exports = router;
