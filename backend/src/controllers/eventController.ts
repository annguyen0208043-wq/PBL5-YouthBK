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
    const { title, description, location, startDate, endDate, startTime, endTime, capacity, maxParticipants, maxSlots, category, timeline, registrationDeadline, communityPoints } = req.body;
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
      communityPoints: communityPoints ? parseInt(communityPoints) : 0,
      createdBy: userId,
      createdByRole: role === 'admin' ? 'admin' : 'lienchi',
      status: role === 'admin' ? 'approved' : 'pending', // lienchi create as pending to wait for admin approval
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

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, createdBy } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (createdBy) where.createdBy = createdBy;

    const events = await Event.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role', 'faculty'] },
        { model: EventTimeline, as: 'timelines' },
        { model: EventImage, as: 'images' },
        ...(req.user ? [{ 
          model: require('../models/EventRegistration').default, 
          as: 'registrations',
          where: { userId: req.user.id, status: 'registered' },
          required: false
        }] : [])
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedEvents = events.map(e => {
      const data = e.toJSON() as any;
      if (req.user && data.registrations) {
        data.isRegistered = data.registrations.length > 0;
      }
      return data;
    });

    res.json({ events: formattedEvents });
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
    const { title, description, location, startDate, endDate, startTime, endTime, maxSlots, category, registrationDeadline, status, communityPoints } = req.body;

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
      category: category !== undefined ? category : event.category,
      communityPoints: communityPoints !== undefined ? parseInt(communityPoints) : event.communityPoints,
      status: status || event.status
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

// ----------------------------------------------------------------------
// 6. REGISTRATION ENDPOINTS (STUDENTS)
// ----------------------------------------------------------------------

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      await transaction.rollback();
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const event = await Event.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }

    if (event.status !== 'approved' && event.status !== 'ongoing') {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện chưa mở đăng ký' });
      return;
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Đã hết hạn đăng ký' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId: id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingRegistration && existingRegistration.status === 'registered') {
      await transaction.rollback();
      res.status(400).json({ message: 'Bạn đã đăng ký sự kiện này rồi' });
      return;
    }

    if (event.maxSlots && event.currentSlots >= event.maxSlots) {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện đã đủ số lượng' });
      return;
    }

    if (existingRegistration && existingRegistration.status === 'cancelled') {
      existingRegistration.status = 'registered';
      existingRegistration.registrationDate = new Date();
      await existingRegistration.save({ transaction });
    } else {
      await EventRegistration.create({
        eventId: event.id,
        userId,
        status: 'registered',
        registrationDate: new Date()
      }, { transaction });
    }

    event.currentSlots += 1;
    await event.save({ transaction });

    await transaction.commit();
    res.json({ message: 'Đăng ký thành công', currentSlots: event.currentSlots });
  } catch (error) {
    await transaction.rollback();
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      await transaction.rollback();
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const event = await Event.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId: id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!existingRegistration || existingRegistration.status !== 'registered') {
      await transaction.rollback();
      res.status(400).json({ message: 'Bạn chưa đăng ký sự kiện này' });
      return;
    }

    const startTime = event.startTime || event.startDate;
    if (startTime) {
      const startDateTime = new Date(startTime).getTime();
      const nowTime = new Date().getTime();
      const diffHours = (startDateTime - nowTime) / (1000 * 60 * 60);

      if (diffHours < 12) {
        await transaction.rollback();
        res.status(400).json({ message: 'Không thể hủy đăng ký khi sự kiện sắp diễn ra trong vòng 12 tiếng' });
        return;
      }
    }

    existingRegistration.status = 'cancelled';
    await existingRegistration.save({ transaction });

    if (event.currentSlots > 0) {
      event.currentSlots -= 1;
      await event.save({ transaction });
    }

    await transaction.commit();
    res.json({ message: 'Hủy đăng ký thành công', currentSlots: event.currentSlots });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// ----------------------------------------------------------------------
// 7. LIEN CHI / ADMIN REGISTRATION MANAGEMENT
// ----------------------------------------------------------------------

export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Not authorized to view registrations for this event' });
      return;
    }

    const registrations = await EventRegistration.findAll({
      where: { eventId: id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'fullName', 'studentId', 'department', 'faculty', 'email', 'phone', 'communityPoints']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ registrations });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const manuallyAddRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const event = await Event.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      await transaction.rollback();
      res.status(403).json({ message: 'Not authorized to manage registrations for this event' });
      return;
    }

    const student = await User.findOne({ where: { studentId }, transaction });
    if (!student) {
      await transaction.rollback();
      res.status(404).json({ message: `Không tìm thấy sinh viên với MSSV: ${studentId}` });
      return;
    }

    if (event.maxSlots && event.currentSlots >= event.maxSlots) {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện đã đủ số lượng' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId: id, userId: student.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingRegistration && existingRegistration.status !== 'cancelled') {
      await transaction.rollback();
      res.status(400).json({ message: 'Sinh viên này đã có trong danh sách' });
      return;
    }

    let registration;
    if (existingRegistration && existingRegistration.status === 'cancelled') {
      existingRegistration.status = 'registered';
      existingRegistration.registrationDate = new Date();
      registration = await existingRegistration.save({ transaction });
    } else {
      registration = await EventRegistration.create({
        eventId: id,
        userId: student.id,
        status: 'registered',
        registrationDate: new Date()
      }, { transaction });
    }

    event.currentSlots += 1;
    await event.save({ transaction });

    await transaction.commit();

    // Fetch full registration to return
    const fullRegistration = await EventRegistration.findByPk(registration.id, {
      include: [{ model: User, attributes: ['id', 'name', 'fullName', 'studentId', 'department', 'faculty', 'email'] }]
    });

    res.json({ message: 'Thêm sinh viên thành công', registration: fullRegistration });
  } catch (error) {
    await transaction.rollback();
    console.error('Manually add registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRegistrationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    const registration = await EventRegistration.findByPk(registrationId, { include: [Event] });
    if (!registration) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    const event = registration.getDataValue('Event') as any;
    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Not authorized to manage this registration' });
      return;
    }

    if (!['registered', 'attended', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    // Nếu chuyển từ cancelled -> registered/attended thì tăng slot
    // Nếu chuyển từ registered/attended -> cancelled thì giảm slot
    const transaction = await Event.sequelize!.transaction();
    try {
      const lockEvent = await Event.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });
      
      if (registration.status === 'cancelled' && status !== 'cancelled') {
        if (lockEvent && lockEvent.maxSlots && lockEvent.currentSlots >= lockEvent.maxSlots) {
           await transaction.rollback();
           res.status(400).json({ message: 'Sự kiện đã đầy, không thể khôi phục đăng ký' });
           return;
        }
        lockEvent!.currentSlots += 1;
        await lockEvent!.save({ transaction });
      } else if (registration.status !== 'cancelled' && status === 'cancelled') {
        lockEvent!.currentSlots -= 1;
        await lockEvent!.save({ transaction });
      }

      registration.status = status;
      await registration.save({ transaction });
      
      await transaction.commit();
      res.json({ message: 'Cập nhật trạng thái thành công', registration });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    const registration = await EventRegistration.findByPk(registrationId, { include: [Event] });
    if (!registration) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    const event = registration.getDataValue('Event') as any;
    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Not authorized to manage this registration' });
      return;
    }

    const transaction = await Event.sequelize!.transaction();
    try {
      const lockEvent = await Event.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });
      
      if (registration.status !== 'cancelled') {
        lockEvent!.currentSlots -= 1;
        await lockEvent!.save({ transaction });
      }

      await registration.destroy({ transaction });
      await transaction.commit();
      
      res.json({ message: 'Xóa sinh viên thành công' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
