const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res.status(403).json({ message: 'Không có token được cung cấp!' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = await User.findByPk(decoded.id);
    
    if (!req.user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Không thể xác thực token!' });
  }
};

const isAdmin = (req, res, next) => {
  const role = (req.user?.role || '').trim().toLowerCase();
  
  if (role === 'đoàn trường' || role === 'doan truong' || role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Yêu cầu quyền Quản trị viên (Đoàn trường)!' });
  }
};

module.exports = { verifyToken, isAdmin };
