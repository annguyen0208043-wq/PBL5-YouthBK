import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import User from '../models/User';
import Event from '../models/Event';
import Notification from '../models/Notification';
import { Op } from 'sequelize';

export const getLienChiDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user?.id);
    if (!user || !user.faculty) {
      res.status(403).json({ message: 'User faculty not found' });
      return;
    }

    const faculty = user.faculty;
    const lienchiId = user.id;

    // 1. KPI Stats
    const totalStudents = await User.count({ where: { role: 'student', faculty } });
    
    // Total events created by this Lien Chi
    const totalEvents = await Event.count({ where: { createdBy: lienchiId } });

    // Events in current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const eventsThisMonth = await Event.count({
      where: {
        createdBy: lienchiId,
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    const totalNotifications = await Notification.count({ where: { senderId: lienchiId } });

    // Participation Rate
    const eventsWithSlots = await Event.findAll({
      where: { createdBy: lienchiId, maxParticipants: { [Op.ne]: null } },
      attributes: ['currentSlots', 'maxParticipants']
    });

    let totalSlots = 0;
    let totalMax = 0;
    eventsWithSlots.forEach(e => {
      totalSlots += e.currentSlots;
      totalMax += (e.maxParticipants || 0);
    });
    const participationRate = totalMax > 0 ? Math.round((totalSlots / totalMax) * 100) : 0;

    // 2. Event Frequency & Types
    const allEvents = await Event.findAll({
      where: { createdBy: lienchiId },
      attributes: ['id', 'title', 'category', 'plannedStartDate', 'currentSlots', 'maxParticipants', 'status', 'createdAt']
    });

    const eventFrequencyByMonth: Record<string, number> = {};
    const eventTypesCount: Record<string, number> = {};

    allEvents.forEach(e => {
      if (e.plannedStartDate) {
        const d = new Date(e.plannedStartDate);
        const monthKey = `T${d.getMonth() + 1}/${d.getFullYear()}`;
        eventFrequencyByMonth[monthKey] = (eventFrequencyByMonth[monthKey] || 0) + 1;
      }
      const cat = e.category || 'Khác';
      eventTypesCount[cat] = (eventTypesCount[cat] || 0) + 1;
    });

    const eventFrequency = Object.keys(eventFrequencyByMonth).map(month => ({
      name: month,
      events: eventFrequencyByMonth[month]
    }));

    const eventTypes = Object.keys(eventTypesCount).map(type => ({
      name: type,
      value: eventTypesCount[type]
    }));

    // 3. Top Events
    const sortedEvents = [...allEvents].sort((a, b) => b.currentSlots - a.currentSlots);
    const topEvents = sortedEvents.slice(0, 5).map(e => ({
      id: e.id,
      title: e.title,
      participants: e.currentSlots,
      maxParticipants: e.maxParticipants,
      status: e.status
    }));

    // 4. Notification Stats
    const notifications = await Notification.findAll({
      where: { senderId: lienchiId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'createdAt', 'readCount', 'recipientCount']
    });

    let totalReads = 0;
    let totalRecipients = 0;
    
    const allNotifications = await Notification.findAll({
      where: { senderId: lienchiId },
      attributes: ['readCount', 'recipientCount']
    });

    allNotifications.forEach(n => {
      totalReads += (n.readCount || 0);
      totalRecipients += (n.recipientCount || 0);
    });

    const notificationReadRate = totalRecipients > 0 ? Math.round((totalReads / totalRecipients) * 100) : 0;

    // 5. Recent Activity
    const recentEvents = [...allEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const recentActivity = [
      ...recentEvents.map(e => ({
        id: `ev-${e.id}`,
        type: 'event',
        title: `Tạo sự kiện mới: ${e.title}`,
        time: e.createdAt
      })),
      ...notifications.map(n => ({
        id: `notif-${n.id}`,
        type: 'notification',
        title: `Gửi thông báo: ${n.title}`,
        time: n.createdAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    res.json({
      kpi: {
        totalStudents,
        totalEvents,
        eventsThisMonth,
        participationRate,
        totalNotifications
      },
      charts: {
        eventFrequency,
        eventTypes
      },
      topEvents,
      notificationStats: {
        totalNotifications,
        readRate: notificationReadRate,
        recent: notifications
      },
      recentActivity
    });

  } catch (error: any) {
    console.error('getLienChiDashboard Error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dashboard' });
  }
};
