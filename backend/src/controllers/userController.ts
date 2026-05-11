import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { hashPassword, convertRoleToEnglish, convertRoleToVietnamese } from '../utils/passwordHelper';
import { Op } from 'sequelize';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, fullName, phone, avatar, department, faculty } = req.body;
    const user = await User.findByPk(userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    await user.update({
      name: fullName || name || user.name,
      phone: phone !== undefined ? phone : user.phone,
      avatar: avatar !== undefined ? avatar : user.avatar,
      department: department !== undefined ? department : user.department,
      faculty: faculty !== undefined ? faculty : user.faculty
    });
    const updatedUser = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
    const mappedUsers = users.map(user => {
      const d = user.toJSON();
      return { ...d, fullName: d.name, role: convertRoleToVietnamese(d.role) };
    });
    res.json({ users: mappedUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const d = user.toJSON();
    res.json({ user: { ...d, fullName: d.name, role: convertRoleToVietnamese(d.role) } });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role = 'Sinh viên', studentId, phone, faculty, status = 'Hoạt động' } = req.body;
    if (!fullName || !email || !password) { res.status(400).json({ message: 'Họ tên, email, và mật khẩu là bắt buộc' }); return; }
    if (password.length < 6) { res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự' }); return; }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) { res.status(409).json({ message: 'Email đã được đăng ký' }); return; }
    if (studentId) {
      const existingSId = await User.findOne({ where: { studentId } });
      if (existingSId) { res.status(409).json({ message: 'MSSV/Mã cán bộ đã tồn tại' }); return; }
    }
    const hashedPassword = await hashPassword(password);
    const englishRole = convertRoleToEnglish(role);
    const user = await User.create({ name: fullName, email, password: hashedPassword, role: englishRole, studentId: studentId || null, phone: phone || null, faculty: faculty || null, status, isActive: status === 'Hoạt động' });
    const createdUser = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    const d = createdUser!.toJSON();
    res.status(201).json({ message: 'Tạo tài khoản thành công', user: { ...d, fullName: d.name, role: convertRoleToVietnamese(d.role) } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, faculty, role } = req.body;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!fullName || !email) { res.status(400).json({ message: 'Họ tên và email là bắt buộc' }); return; }
    if (email !== user.email) {
      const existingEmail = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingEmail) { res.status(409).json({ message: 'Email đã được sử dụng' }); return; }
    }
    const englishRole = role ? convertRoleToEnglish(role) : user.role;
    await user.update({ name: fullName, email, phone: phone !== undefined ? phone : user.phone, faculty: faculty !== undefined ? faculty : user.faculty, role: englishRole });
    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    const d = updatedUser!.toJSON();
    res.json({ message: 'Cập nhật tài khoản thành công', user: { ...d, fullName: d.name, role: convertRoleToVietnamese(d.role) } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const englishRole = convertRoleToEnglish(role);
    await user.update({ role: englishRole });
    res.json({ message: `Đã cập nhật vai trò thành "${role}"`, user: { id: user.id, role: convertRoleToVietnamese(englishRole) } });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const changeUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    await user.update({ status, isActive: status === 'Hoạt động' });
    res.json({ message: `Đã cập nhật trạng thái thành "${status}"`, user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
