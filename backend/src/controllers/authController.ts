import { Request, Response } from 'express';
import User from '../models/User';
import { hashPassword, comparePassword, convertRoleToEnglish, convertRoleToVietnamese } from '../utils/passwordHelper';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role = 'Sinh viên', studentId, phone } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'Họ tên, email, và mật khẩu là bắt buộc' });
      return;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: 'Email đã được đăng ký' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const englishRole = convertRoleToEnglish(role);

    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      role: englishRole,
      studentId,
      phone
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: englishRole
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: convertRoleToVietnamese(englishRole)
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: convertRoleToVietnamese(user.role),
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Đăng xuất thành công' });
};
