import { Request, Response } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import CommunityPointHistory from '../models/CommunityPointHistory';
import { AuthRequest } from '../middlewares/authMiddleware';
import { hashPassword, convertRoleToEnglish, convertRoleToVietnamese } from '../utils/passwordHelper';
import { Op } from 'sequelize';
import { writeAuditLog, getClientIp } from '../utils/auditLogHelper';

const DEFAULT_RESET_PASSWORD = process.env.DEFAULT_RESET_PASSWORD || '123456';

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
    
    const isStudentOrMonitor = ['student', 'monitor'].includes(user.role?.toLowerCase());
    
    await user.update({
      name: isStudentOrMonitor ? user.name : (fullName || name || user.name),
      phone: phone !== undefined ? phone : user.phone,
      avatar: avatar !== undefined ? avatar : user.avatar,
      department: isStudentOrMonitor ? user.department : (department !== undefined ? department : user.department),
      faculty: isStudentOrMonitor ? user.faculty : (faculty !== undefined ? faculty : user.faculty)
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
    const { fullName, email, password, role = 'Sinh viên', studentId, phone, faculty, department, status = 'Hoạt động' } = req.body;
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
    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      role: englishRole,
      studentId: studentId || null,
      phone: phone || null,
      faculty: faculty || null,
      department: department || null,
      status,
      isActive: status === 'Hoạt động'
    });
    const createdUser = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    const d = createdUser!.toJSON();
    writeAuditLog({
      userId: req.user!.id,
      action: `Tạo tài khoản mới cho "${fullName}" (${email})`,
      targetType: 'User',
      targetId: user.id,
      details: `Vai trò: ${role}`,
      ipAddress: getClientIp(req) ?? undefined,
    });
    res.status(201).json({ message: 'Tạo tài khoản thành công', user: { ...d, fullName: d.name, role: convertRoleToVietnamese(d.role) } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, faculty, role, department } = req.body;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!fullName || !email) { res.status(400).json({ message: 'Họ tên và email là bắt buộc' }); return; }
    if (email !== user.email) {
      const existingEmail = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingEmail) { res.status(409).json({ message: 'Email đã được sử dụng' }); return; }
    }
    const englishRole = role ? convertRoleToEnglish(role) : user.role;
    await user.update({
      name: fullName,
      email,
      phone: phone !== undefined ? phone : user.phone,
      faculty: faculty !== undefined ? faculty : user.faculty,
      role: englishRole,
      department: department !== undefined ? department : user.department
    });
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
    writeAuditLog({
      userId: req.user!.id,
      action: `Thay đổi vai trò của "${user.name}" thành "${role}"`,
      targetType: 'User',
      targetId: user.id,
      ipAddress: getClientIp(req) ?? undefined,
    });
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
    writeAuditLog({
      userId: req.user!.id,
      action: `Cập nhật trạng thái tài khoản "${user.name}" thành "${status}"`,
      targetType: 'User',
      targetId: user.id,
      ipAddress: getClientIp(req) ?? undefined,
    });
    res.json({ message: `Đã cập nhật trạng thái thành "${status}"`, user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const hashedPassword = await hashPassword(DEFAULT_RESET_PASSWORD);
    await user.update({ password: hashedPassword });
    writeAuditLog({
      userId: req.user!.id,
      action: `Reset mật khẩu mặc định cho "${user.name}"`,
      targetType: 'User',
      targetId: user.id,
      ipAddress: getClientIp(req) ?? undefined,
    });
    res.json({
      message: `Đã reset mật khẩu về mặc định: ${DEFAULT_RESET_PASSWORD}`,
      defaultPassword: DEFAULT_RESET_PASSWORD
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getUserPointsHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const history = await CommunityPointHistory.findAll({
      where: { userId },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ history });
  } catch (error) {
    console.error('Get user points history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClassStudentsPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'monitor') {
      res.status(403).json({ message: 'Chỉ ban cán sự mới có quyền truy cập dữ liệu này' });
      return;
    }

    const monitor = await User.findByPk(userId);
    if (!monitor || !monitor.department) {
      res.status(400).json({ message: 'Không tìm thấy thông tin lớp học của ban cán sự' });
      return;
    }

    const students = await User.findAll({
      where: {
        department: monitor.department,
        role: { [Op.in]: ['student', 'monitor'] }
      },
      attributes: ['id', 'name', 'email', 'studentId', 'phone', 'department', 'communityPoints', 'status'],
      order: [['studentId', 'ASC']]
    });

    const mappedStudents = students.map(student => {
      const d = student.toJSON();
      return { ...d, fullName: d.name };
    });

    res.json({ students: mappedStudents, className: monitor.department });
  } catch (error) {
    console.error('Get class students points error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStudentPointsHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const monitorId = req.user?.id;
    const monitorRole = req.user?.role;

    if (monitorRole !== 'monitor') {
      res.status(403).json({ message: 'Chỉ ban cán sự mới có quyền truy cập dữ liệu này' });
      return;
    }

    const monitor = await User.findByPk(monitorId);
    const targetStudent = await User.findByPk(id);

    if (!monitor || !targetStudent) {
      res.status(404).json({ message: 'Không tìm thấy thông tin' });
      return;
    }

    // Security check: ensure target student is in the same class (department) as the monitor
    if (monitor.department !== targetStudent.department) {
      res.status(403).json({ message: 'Không thể xem thông tin sinh viên ngoài lớp' });
      return;
    }

    const history = await CommunityPointHistory.findAll({
      where: { userId: id },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ history, studentName: targetStudent.name });
  } catch (error) {
    console.error('Get student points history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
