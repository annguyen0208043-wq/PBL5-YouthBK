import { Request, Response } from 'express';
import Notification from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Lấy thông báo của user hiện tại
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const recipients = await NotificationRecipient.findAll({
      where: { userId },
      include: [{ model: Notification, include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email'] }] }],
      order: [['createdAt', 'DESC']]
    });
    const notifications = recipients.map(r => {
      const data = r.toJSON() as any;
      return { ...data.Notification, isRead: data.isRead, readAt: data.readAt, recipientId: data.id };
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const recipient = await NotificationRecipient.findOne({ where: { notificationId: id, userId } });
    if (!recipient) {
      const notification = await Notification.findByPk(id);
      if (!notification) { res.status(404).json({ message: 'Notification not found' }); return; }
      await notification.update({ isRead: true });
      res.json({ message: 'Notification marked as read', notification });
      return;
    }
    await recipient.update({ isRead: true, readAt: new Date() });
    // Cập nhật readCount
    const notification = await Notification.findByPk(id);
    if (notification) {
      const readCount = await NotificationRecipient.count({ where: { notificationId: id, isRead: true } });
      await notification.update({ readCount });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Lấy thông báo đã gửi
export const getSentNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const notifications = await Notification.findAll({
      where: { senderId: userId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Lấy danh sách khoa/faculty
export const getFaculties = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['faculty'],
      where: { faculty: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
      group: ['faculty']
    });
    const faculties = users.map(u => u.faculty).filter(Boolean) as string[];
    res.json({ faculties });
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Tìm kiếm người nhận thông báo
export const searchRecipients = async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;
    const searchQuery = (q as string || '').trim();
    if (!searchQuery) { res.json({ users: [] }); return; }
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } },
          { studentId: { [Op.like]: `%${searchQuery}%` } }
        ]
      },
      attributes: ['id', 'name', 'email', 'studentId', 'faculty', 'role'],
      limit: parseInt(limit as string)
    });
    const mappedUsers = users.map(u => {
      const d = u.toJSON();
      return { ...d, fullName: d.name };
    });
    res.json({ users: mappedUsers });
  } catch (error) {
    console.error('Search recipients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Gửi thông báo
export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetType, faculty, recipientUserIds } = req.body;
    const senderId = req.user?.id;
    if (!title || !content) { res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' }); return; }

    let recipientIds: number[] = [];

    if (targetType === 'all_students') {
      const students = await User.findAll({ where: { role: 'student', isActive: true }, attributes: ['id'] });
      recipientIds = students.map(s => s.id);
    } else if (targetType === 'faculty' && faculty) {
      const users = await User.findAll({ where: { faculty, isActive: true }, attributes: ['id'] });
      recipientIds = users.map(u => u.id);
    } else if (targetType === 'specific_users' && recipientUserIds?.length > 0) {
      recipientIds = recipientUserIds;
    }

    const notification = await Notification.create({
      title, content, message: content, type: 'admin',
      targetType, targetValue: faculty || null,
      senderId, recipientCount: recipientIds.length, readCount: 0
    });

    if (recipientIds.length > 0) {
      await NotificationRecipient.bulkCreate(
        recipientIds.map(userId => ({ notificationId: notification.id, userId, isRead: false }))
      );
    }

    res.status(201).json({ message: 'Gửi thông báo thành công', recipientCount: recipientIds.length, notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
