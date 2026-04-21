const { Op } = require('sequelize');
const { Notification, NotificationRecipient, User, sequelize } = require('../models');

const normalizeRole = (value) => (value || '').trim().toLowerCase();

const buildUserSearchCondition = (query) => {
  if (!query) {
    return {};
  }

  return {
    [Op.or]: [
      { fullName: { [Op.like]: `%${query}%` } },
      { studentId: { [Op.like]: `%${query}%` } },
      { email: { [Op.like]: `%${query}%` } },
    ],
  };
};

const createNotification = async (req, res) => {
  const transaction = await sequelize.transaction();
  let isCommitted = false;

  try {
    const { title, content, targetType, faculty, recipientUserIds } = req.body;

    if (!title || !content || !targetType) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Tiêu đề, nội dung và kiểu người nhận là bắt buộc' });
    }

    const normalizedTargetType = String(targetType).trim();
    let users = [];
    let targetValue = null;

    if (normalizedTargetType === 'all_students') {
      users = await User.findAll({
        where: {
          role: {
            [Op.like]: '%Sinh vi%',
          },
        },
        attributes: ['id'],
        transaction,
      });
    } else if (normalizedTargetType === 'faculty') {
      if (!faculty) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Vui lòng cung cấp liên chi đoàn/khoa cần gửi' });
      }

      targetValue = faculty;
      users = await User.findAll({
        where: {
          faculty,
        },
        attributes: ['id'],
        transaction,
      });
    } else if (normalizedTargetType === 'specific_users') {
      if (!Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Vui lòng chọn ít nhất một tài khoản cụ thể' });
      }

      const uniqueUserIds = [...new Set(recipientUserIds.map((id) => Number(id)).filter(Boolean))];
      users = await User.findAll({
        where: {
          id: {
            [Op.in]: uniqueUserIds,
          },
        },
        attributes: ['id'],
        transaction,
      });

      if (users.length !== uniqueUserIds.length) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Danh sách người nhận có tài khoản không tồn tại' });
      }

      targetValue = uniqueUserIds.join(',');
    } else {
      await transaction.rollback();
      return res.status(400).json({ message: 'Kiểu người nhận không hợp lệ' });
    }

    if (users.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Không tìm thấy người nhận phù hợp để gửi thông báo' });
    }

    const notification = await Notification.create({
      title,
      content,
      targetType: normalizedTargetType,
      targetValue,
      createdBy: req.user.id,
    }, { transaction });

    await NotificationRecipient.bulkCreate(
      users.map((user) => ({
        notificationId: notification.id,
        userId: user.id,
      })),
      { transaction }
    );

    await transaction.commit();
    isCommitted = true;

    const createdNotification = await Notification.findByPk(notification.id, {
      include: [
        { association: 'sender', attributes: ['id', 'fullName', 'email', 'role'] },
        { association: 'recipients', attributes: ['id', 'userId', 'readAt'] },
      ],
    });

    return res.status(201).json({
      message: 'Gửi thông báo thành công',
      notification: createdNotification,
      recipientCount: users.length,
    });
  } catch (err) {
    if (!isCommitted) {
      await transaction.rollback();
    }
    console.error('createNotification error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await NotificationRecipient.findAll({
      where: { userId: req.user.id },
      include: [
        {
          association: 'notification',
          include: [
            { association: 'sender', attributes: ['id', 'fullName', 'email', 'role'] },
          ],
        },
      ],
      order: [[{ model: Notification, as: 'notification' }, 'createdAt', 'DESC']],
    });

    return res.status(200).json({
      notifications: notifications.map((item) => ({
        id: item.notification.id,
        title: item.notification.title,
        content: item.notification.content,
        targetType: item.notification.targetType,
        targetValue: item.notification.targetValue,
        createdAt: item.notification.createdAt,
        sender: item.notification.sender,
        readAt: item.readAt,
      })),
    });
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const recipient = await NotificationRecipient.findOne({
      where: {
        notificationId,
        userId: req.user.id,
      },
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Thông báo không tồn tại hoặc bạn không phải người nhận' });
    }

    if (!recipient.readAt) {
      await recipient.update({ readAt: new Date() });
    }

    return res.status(200).json({ message: 'Đã đánh dấu đã đọc', readAt: recipient.readAt });
  } catch (err) {
    console.error('markNotificationAsRead error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getFacultyTargets = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        faculty: {
          [Op.not]: null,
        },
      },
      attributes: ['faculty'],
      group: ['faculty'],
      order: [['faculty', 'ASC']],
    });

    return res.status(200).json({
      faculties: users.map((user) => user.faculty).filter(Boolean),
    });
  } catch (err) {
    console.error('getFacultyTargets error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const searchRecipients = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const role = String(req.query.role || '').trim();
    const faculty = String(req.query.faculty || '').trim();

    const where = {
      ...buildUserSearchCondition(q),
    };

    if (role) {
      where.role = role;
    }

    if (faculty) {
      where.faculty = faculty;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'fullName', 'studentId', 'email', 'role', 'faculty', 'status'],
      order: [['fullName', 'ASC']],
      limit,
    });

    return res.status(200).json({ users });
  } catch (err) {
    console.error('searchRecipients error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getSentNotifications = async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);

    if (role !== 'đoàn trường' && role !== 'doan truong' && role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xem danh sách thông báo đã gửi' });
    }

    const notifications = await Notification.findAll({
      where: { createdBy: req.user.id },
      include: [
        { association: 'sender', attributes: ['id', 'fullName', 'email', 'role'] },
        { association: 'recipients', attributes: ['id', 'userId', 'readAt'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        targetType: notification.targetType,
        targetValue: notification.targetValue,
        createdAt: notification.createdAt,
        sender: notification.sender,
        recipientCount: notification.recipients.length,
        readCount: notification.recipients.filter((recipient) => recipient.readAt).length,
      })),
    });
  } catch (err) {
    console.error('getSentNotifications error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  getFacultyTargets,
  searchRecipients,
  getSentNotifications,
};
