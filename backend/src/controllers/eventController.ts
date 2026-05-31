import { Request, Response } from 'express';
import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import EventTimeline from '../models/EventTimeline';
import EventImage from '../models/EventImage';
import EventApproval from '../models/EventApproval';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Op } from 'sequelize';
import { isBeforeStart, isApproved, isRegistrationOpen, hasSlots, noActiveRequest, isOwner } from '../guards/event.guards';

// ----------------------------------------------------------------------
// 1. PUBLIC / GENERAL ENDPOINTS
// ----------------------------------------------------------------------

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, location, startDate, endDate, startTime, endTime, capacity, maxParticipants, maxSlots, category, timeline, registrationDeadline } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

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
      registrationDeadline,
      capacity: capacity || maxParticipants,
      maxParticipants: maxParticipants || capacity,
      maxSlots: maxSlots || maxParticipants || capacity,
      category,
      createdBy: userId,
      createdByRole: role === 'admin' ? 'admin' : 'lienchi',
      status: role === 'admin' ? 'approved' : 'draft', // lienchi create as draft
      currentSlots: 0,
      reviewHistory: []
    });

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
    const { status, category, createdBy } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (createdBy) where.createdBy = createdBy;

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
        { model: EventImage, as: 'images' }
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
    const { title, description, location, startDate, endDate, startTime, endTime, maxSlots, category, registrationDeadline } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Not authorized to update this event' });
      return;
    }

    // lienchi only allowed to update when in draft or revision_required
    if (req.user?.role !== 'admin') {
      if (!['draft', 'revision_required'].includes(event.status)) {
        res.status(400).json({ message: 'Chỉ được sửa khi sự kiện đang ở trạng thái nháp hoặc yêu cầu sửa. Nếu đã duyệt, vui lòng dùng requestUpdate' });
        return;
      }
    }

    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      location: location || event.location,
      startDate: startDate || event.startDate,
      endDate: endDate || event.endDate,
      startTime: startTime || event.startTime,
      endTime: endTime || event.endTime,
      registrationDeadline: registrationDeadline || event.registrationDeadline,
      maxSlots: maxSlots !== undefined ? maxSlots : event.maxSlots,
      category: category !== undefined ? category : event.category
    });

    // Handle timeline & images similar to createEvent (omitted for brevity, assume unchanged or keep standard logic)
    const { timeline } = req.body;
    if (timeline) {
      const timelineItems = typeof timeline === 'string' ? JSON.parse(timeline) : timeline;
      if (Array.isArray(timelineItems)) {
        await EventTimeline.destroy({ where: { eventId: id } });
        if (timelineItems.length > 0) {
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
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      await EventImage.destroy({ where: { eventId: id } });
      await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          EventImage.create({
            eventId: event.id,
            imageUrl: `/uploads/events/${file.filename}`
          })
        )
      );
    }

    const fullEvent = await Event.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' }
      ]
    });

    res.json({ message: 'Event updated successfully', event: fullEvent });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) { res.status(403).json({ message: 'Not authorized' }); return; }
    
    if (!['draft', 'revision_required'].includes(event.status)) {
      res.status(400).json({ message: 'Sự kiện không ở trạng thái hợp lệ để gửi duyệt' }); return;
    }

    await event.update({ status: 'pending' });
    res.json({ message: 'Đã gửi duyệt sự kiện', event });
  } catch (error) {
    res.status(500).json({ message: 'Internal error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (req.user?.role !== 'admin') {
      if (!isOwner(event, req.user?.id!) || event.status !== 'draft') {
        res.status(403).json({ message: 'Chỉ được xóa sự kiện nháp của chính mình' }); return;
      }
    }

    await EventTimeline.destroy({ where: { eventId: id } });
    await EventImage.destroy({ where: { eventId: id } });
    await EventRegistration.destroy({ where: { eventId: id } });
    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ----------------------------------------------------------------------
// 2. REGISTRATION
// ----------------------------------------------------------------------

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;
    const userId = req.user?.id;

    const event = await Event.findByPk(eventId);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (!isApproved(event)) { res.status(400).json({ message: 'Sự kiện chưa mở đăng ký' }); return; }
    if (!isRegistrationOpen(event)) { res.status(400).json({ message: 'Đã hết hạn đăng ký' }); return; }
    if (!hasSlots(event)) { res.status(400).json({ message: 'Sự kiện đã đủ người' }); return; }

    const existingRegistration = await EventRegistration.findOne({ where: { eventId, userId, status: 'registered' } });
    if (existingRegistration) { res.status(409).json({ message: 'Bạn đã đăng ký sự kiện này' }); return; }

    const registration = await EventRegistration.create({ eventId, userId, status: 'registered' });
    await event.increment('currentSlots', { by: 1 });

    res.status(201).json({ message: 'Registered for event successfully', registration });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ----------------------------------------------------------------------
// 3. ADMIN REVIEW ENDPOINTS
// ----------------------------------------------------------------------

export const getPendingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'ASC']]
    });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'pending') { res.status(400).json({ message: 'Sự kiện không chờ duyệt' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'approved', by: req.user?.id, at: new Date() });

    await event.update({ status: 'approved', reviewHistory: history });
    res.json({ message: 'Đã duyệt sự kiện thành công', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const rejectEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'pending') { res.status(400).json({ message: 'Sự kiện không chờ duyệt' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'rejected', by: req.user?.id, at: new Date(), message: reason });

    await event.update({ status: 'cancelled', rejectionReason: reason, reviewHistory: history });
    res.json({ message: 'Đã từ chối sự kiện', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const requestEventRevision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'pending') { res.status(400).json({ message: 'Sự kiện không chờ duyệt' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'revision_requested', by: req.user?.id, at: new Date(), message });

    await event.update({ status: 'revision_required', revisionMessage: message, reviewHistory: history });
    res.json({ message: 'Đã gửi yêu cầu chỉnh sửa', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const approveUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'update_requested') { res.status(400).json({ message: 'Không có yêu cầu sửa nào đang chờ' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'update_approved', by: req.user?.id, at: new Date() });

    const changes = event.pendingChanges || {};
    await event.update({
      ...changes,
      status: 'approved',
      pendingChanges: null,
      pendingChangeType: null,
      reviewHistory: history
    });
    res.json({ message: 'Đã duyệt yêu cầu sửa', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const approveCancel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'cancel_requested') { res.status(400).json({ message: 'Không có yêu cầu hủy nào đang chờ' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'cancel_approved', by: req.user?.id, at: new Date() });

    await event.update({
      status: 'cancelled',
      pendingChanges: null,
      pendingChangeType: null,
      reviewHistory: history
    });

    // TODO: Send notifications to registered students
    res.json({ message: 'Đã duyệt yêu cầu hủy', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const approvePostpone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (event.status !== 'postpone_requested') { res.status(400).json({ message: 'Không có yêu cầu hoãn' }); return; }

    let history = event.reviewHistory || [];
    history.push({ action: 'postpone_approved', by: req.user?.id, at: new Date() });

    await event.update({
      status: 'postponed',
      pendingChanges: null,
      pendingChangeType: null,
      reviewHistory: history
    });

    // TODO: Send notifications to registered students
    res.json({ message: 'Đã duyệt yêu cầu hoãn', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const rejectRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
    if (!['update_requested', 'cancel_requested', 'postpone_requested'].includes(event.status)) {
      res.status(400).json({ message: 'Không có yêu cầu nào' }); return;
    }

    let history = event.reviewHistory || [];
    history.push({ action: 'update_rejected', by: req.user?.id, at: new Date(), message: reason });

    await event.update({
      status: 'approved', // back to approved
      pendingChanges: null,
      pendingChangeType: null,
      reviewHistory: history
    });
    res.json({ message: 'Đã từ chối yêu cầu, giữ nguyên trạng thái cũ', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

// ----------------------------------------------------------------------
// 4. LIEN CHI REQUEST ENDPOINTS
// ----------------------------------------------------------------------

export const requestUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const changes = req.body.changes;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (!isOwner(event, req.user?.id!)) { res.status(403).json({ message: 'Not authorized' }); return; }
    if (!isApproved(event)) { res.status(400).json({ message: 'Sự kiện chưa được duyệt' }); return; }
    if (!isBeforeStart(event)) { res.status(400).json({ message: 'Sự kiện đã bắt đầu' }); return; }
    if (!noActiveRequest(event)) { res.status(400).json({ message: 'Đang có yêu cầu chờ duyệt' }); return; }

    await event.update({
      status: 'update_requested',
      pendingChanges: changes,
      pendingChangeType: 'update'
    });
    res.json({ message: 'Đã gửi yêu cầu sửa sự kiện', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const requestCancel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (!isOwner(event, req.user?.id!)) { res.status(403).json({ message: 'Not authorized' }); return; }
    if (!isApproved(event)) { res.status(400).json({ message: 'Sự kiện chưa được duyệt' }); return; }
    if (!isBeforeStart(event)) { res.status(400).json({ message: 'Sự kiện đã bắt đầu' }); return; }
    if (!noActiveRequest(event)) { res.status(400).json({ message: 'Đang có yêu cầu chờ duyệt' }); return; }

    await event.update({
      status: 'cancel_requested',
      pendingChangeReason: reason,
      pendingChangeType: 'cancel'
    });
    res.json({ message: 'Đã gửi yêu cầu hủy sự kiện', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};

export const requestPostpone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, proposedDate } = req.body;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (!isOwner(event, req.user?.id!)) { res.status(403).json({ message: 'Not authorized' }); return; }
    if (!isApproved(event)) { res.status(400).json({ message: 'Sự kiện chưa được duyệt' }); return; }
    if (!isBeforeStart(event)) { res.status(400).json({ message: 'Sự kiện đã bắt đầu' }); return; }
    if (!noActiveRequest(event)) { res.status(400).json({ message: 'Đang có yêu cầu chờ duyệt' }); return; }

    await event.update({
      status: 'postpone_requested',
      pendingChangeReason: reason,
      pendingProposedDate: proposedDate,
      pendingChangeType: 'postpone'
    });
    res.json({ message: 'Đã gửi yêu cầu hoãn sự kiện', event });
  } catch (error) { res.status(500).json({ message: 'Internal error' }); }
};
