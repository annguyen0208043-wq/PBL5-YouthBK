const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '7d',
  });
};

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và password là bắt buộc' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed });

    const token = generateToken(user);
    return res.status(201).json({ message: 'Đăng ký thành công', user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và password là bắt buộc' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    const token = generateToken(user);
    return res.status(200).json({ message: 'Đăng nhập thành công', user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { register, login };
