const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['fullName', 'ASC']]
    });
    return res.status(200).json({ users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Create new user (by admin)
const createUser = async (req, res) => {
  try {
    const { fullName, studentId, phone, email, role, password, faculty, status } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Họ tên, email và password là bắt buộc' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    if (studentId) {
      const existingStudent = await User.findOne({ where: { studentId } });
      if (existingStudent) {
        return res.status(409).json({ message: 'Mã số sinh viên đã tồn tại' });
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      studentId: studentId || null,
      phone: phone || null,
      email,
      role: role || 'Sinh viên',
      password: hashed,
      faculty: faculty || null,
      status: status || 'Hoạt động'
    });

    return res.status(201).json({
      message: 'Tạo tài khoản thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        role: user.role,
        faculty: user.faculty,
        status: user.status
      }
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, phone, email, faculty, role, status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: 'Email đã tồn tại' });
      }
    }

    // Update user fields
    await user.update({
      fullName: fullName !== undefined ? fullName : user.fullName,
      phone: phone !== undefined ? phone : user.phone,
      email: email !== undefined ? email : user.email,
      faculty: faculty !== undefined ? faculty : user.faculty,
      role: role !== undefined ? role : user.role,
      status: status !== undefined ? status : user.status
    });

    return res.status(200).json({
      message: 'Cập nhật tài khoản thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        role: user.role,
        faculty: user.faculty,
        status: user.status
      }
    });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting own account
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    await user.destroy();
    return res.status(200).json({ message: 'Xóa tài khoản thành công' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Vui lòng cung cấp vai trò' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    await user.update({ role });
    return res.status(200).json({
      message: 'Cập nhật vai trò thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('updateUserRole error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    await user.update({ status });
    return res.status(200).json({
      message: 'Cập nhật trạng thái thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không khớp' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashed });

    return res.status(200).json({ message: 'Thay đổi mật khẩu thành công' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const role = String(req.query.role || '').trim();
    const faculty = String(req.query.faculty || '').trim();

    const where = {};

    if (q) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${q}%` } },
        { studentId: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (faculty) {
      where.faculty = faculty;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['fullName', 'ASC']],
      limit,
    });

    return res.status(200).json({ users });
  } catch (err) {
    console.error('searchUsers error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  changePassword,
  searchUsers
};
