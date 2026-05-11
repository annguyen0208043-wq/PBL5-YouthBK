import { Request, Response } from 'express';
import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import EventTimeline from '../models/EventTimeline';
import EventImage from '../models/EventImage';
import EventApproval from '../models/EventApproval';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Op } from 'sequelize';

// ==========================================
// PUBLIC / GENERAL ENDPOINTS
// ==========================================

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, location, startDate, endDate, startTime, endTime, capacity, maxParticipants, category, timeline } = req.body;
    const userId = req.user?.id;

    if (!title || !location || (!startDate && !startTime) || (!endDate && !endTime)) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const event = await Event.create({
      title,
      description,
      location,
      startDate: startDate || startTime,
      endDate: endDate || endTime,
      startTime: startTime || startDate,
      endTime: endTime || endDate,
      capacity: capacity || maxParticipants,
      maxParticipants: maxParticipants || capacity,
      category,
      createdBy: userId,
      status: 'pending'
    });

    // Xử lý timeline nếu có
    if (timeline) {
      const timelineItems = typeof timeline === 'string' ? JSON.parse(timeline) : timeline;
      if (Array.isArray(timelineItems) && timelineItems.length > 0) {
        await Promise.all(
          timelineItems.map((item: any) =>
            EventTimeline.create({
              eventId: event.id,
              dateTime: item.dateTime,
              description: item.description
            })
          )
        );
      }
    }

    // Xử lý upload ảnh nếu có (multer)
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          EventImage.create({
            eventId: event.id,
            imageUrl: `/uploads/events/${file.filename}`
          })
        )
      );
    }

    // Lấy lại event với relations
    const fullEvent = await Event.findByPk(event.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' }
      ]
    });

    res.status(201).json({ message: 'Event created successfully', event: fullEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const events = await Event.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ events });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' },
        { model: EventApproval, as: 'approvals', include: [{ model: User, as: 'approver', attributes: ['id', 'name', 'email'] }] }
      ]
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, location, startDate, endDate, startTime, endTime, capacity, maxParticipants, category, status } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Admin có thể sửa mọi event, người tạo chỉ sửa event của mình
    if (req.user?.role !== 'admin' && event.createdBy !== req.user?.id) {
      res.status(403).json({ message: 'Not authorized to update this event' });
      return;
    }

    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      location: location || event.location,
      startDate: startDate || event.startDate,
      endDate: endDate || event.endDate,
      startTime: startTime || event.startTime,
      endTime: endTime || event.endTime,
      capacity: capacity !== undefined ? capacity : event.capacity,
      maxParticipants: maxParticipants !== undefined ? maxParticipants : event.maxParticipants,
      category: category !== undefined ? category : event.category,
      status: status || event.status
    });

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Admin có thể xóa mọi event
    if (req.user?.role !== 'admin' && event.createdBy !== req.user?.id) {
      res.status(403).json({ message: 'Not authorized to delete this event' });
      return;
    }

    // Xóa các dữ liệu liên quan
    await EventTimeline.destroy({ where: { eventId: id } });
    await EventImage.destroy({ where: { eventId: id } });
    await EventApproval.destroy({ where: { eventId: id } });
    await EventRegistration.destroy({ where: { eventId: id } });
    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;
    const userId = req.user?.id;

    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId, userId }
    });

    if (existingRegistration) {
      res.status(409).json({ message: 'Already registered for this event' });
      return;
    }

    const registration = await EventRegistration.create({
      eventId,
      userId,
      status: 'registered'
    });

    res.status(201).json({ message: 'Registered for event successfully', registration });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==========================================
// ADMIN ENDPOINTS - Đoàn trường
// ==========================================

// Lấy danh sách sự kiện chờ duyệt
export const getPendingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ events });
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Duyệt sự kiện
export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user?.id;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (event.status !== 'pending' && event.status !== 'revision_requested') {
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    await event.update({ status: 'approved' });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: adminId,
      status: 'approved',
      note: note || null
    });

    res.json({ message: 'Đã duyệt sự kiện thành công', event });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Từ chối sự kiện
export const rejectEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user?.id;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (event.status !== 'pending' && event.status !== 'revision_requested') {
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    await event.update({ status: 'rejected' });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: adminId,
      status: 'rejected',
      note: note || 'Hồ sơ không đạt yêu cầu'
    });

    res.json({ message: 'Đã từ chối sự kiện', event });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Yêu cầu chỉnh sửa sự kiện
export const requestEventRevision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user?.id;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (event.status !== 'pending') {
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    await event.update({ status: 'revision_requested' });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: adminId,
      status: 'revision_requested',
      note: note || 'Yêu cầu chỉnh sửa hồ sơ'
    });

    res.json({ message: 'Đã gửi yêu cầu chỉnh sửa', event });
  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
