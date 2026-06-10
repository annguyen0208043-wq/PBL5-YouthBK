import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import EventTimeline from '../models/EventTimeline';
import EventTimelineDetail from '../models/EventTimelineDetail';
import EventImage from '../models/EventImage';
import EventDocument from '../models/EventDocument';
import EventApproval from '../models/EventApproval';
import User from '../models/User';
import EventFeedback from '../models/EventFeedback';
import { AuthRequest } from '../middlewares/authMiddleware';
import { isBeforeStart, isRegistrationOpen, hasSlots, isOwner } from '../guards/event.guards';
import { writeAuditLog, getClientIp } from '../utils/auditLogHelper';

// Helper to calculate GPS distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function normalizeAudienceText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(khoa|lien chi doan|lien chi|doan khoa)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function canStudentAccessEvent(event: Event, userId: number) {
  if (event.createdByRole === 'admin') {
    return true;
  }

  const [student, creator] = await Promise.all([
    User.findByPk(userId, { attributes: ['faculty', 'department'] }),
    User.findByPk(event.createdBy, { attributes: ['faculty', 'department'] })
  ]);

  const studentFaculty = normalizeAudienceText(student?.faculty || student?.department);
  const creatorFaculty = normalizeAudienceText(creator?.faculty || creator?.department);

  return Boolean(studentFaculty && creatorFaculty && studentFaculty === creatorFaculty);
}

// 1. PUBLIC / GENERAL ENDPOINTS
export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, createdBy } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      // Exclude draft from public/students list if requested by student
      if (req.user?.role === 'student') {
        where.status = { [Op.ne]: 'draft' };
      }
    }
    if (category) where.category = category;
    if (createdBy) where.createdBy = createdBy;

    const events = await Event.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role', 'faculty'] },
        { model: User, as: 'leader', attributes: ['id', 'name', 'email', 'role', 'faculty'] },
        { model: EventImage, as: 'images' },
        ...(req.user ? [{
          model: EventRegistration,
          as: 'registrations',
          where: { 
            userId: req.user.id,
            status: { [Op.in]: ['registered', 'attended', 'confirmed', 'pending'] }
          },
          required: false
        }] : [])
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedEvents = events.map(e => {
      const data = e.toJSON() as any;
      if (req.user && data.registrations && data.registrations.length > 0) {
        // At this point, registrations are already filtered to valid statuses only
        data.isRegistered = true;
        data.userRegistrationStatus = data.registrations[0].status;
      } else {
        data.isRegistered = false;
        data.userRegistrationStatus = null;
      }
      return data;
    });

    res.json({ events: formattedEvents });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const canViewApprovalMessages = ['admin', 'lienchi'].includes(req.user?.role || '');

    const event = await Event.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'faculty'] },
        { model: User, as: 'leader', attributes: ['id', 'name', 'email', 'role', 'faculty'] },
        { 
          model: EventTimeline, 
          as: 'timelines',
          include: [{ model: EventTimelineDetail, as: 'details' }]
        },
        { model: EventImage, as: 'images' },
        { model: EventDocument, as: 'documents', include: [{ model: User, as: 'uploader', attributes: ['name'] }] },
        ...(canViewApprovalMessages ? [{
          model: EventApproval,
          as: 'approvals',
          include: [{ model: User, as: 'approver', attributes: ['name'] }]
        }] : []),
        ...(req.user ? [{
          model: EventRegistration,
          as: 'registrations',
          where: { 
            userId: req.user.id,
            status: { [Op.in]: ['registered', 'attended', 'confirmed', 'pending'] }
          },
          required: false
        }] : [])
      ],
      order: [
        [{ model: EventTimeline, as: 'timelines' }, 'sortOrder', 'ASC'],
        [{ model: EventTimeline, as: 'timelines' }, { model: EventTimelineDetail, as: 'details' }, 'sortOrder', 'ASC']
      ]
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const data = event.toJSON() as any;
    if (req.user && data.registrations && data.registrations.length > 0) {
      // At this point, registrations are already filtered to valid statuses only
      data.isRegistered = true;
      data.userRegistrationStatus = data.registrations[0].status;
    } else {
      data.isRegistered = false;
      data.userRegistrationStatus = null;
    }

    res.json({ event: data });
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 2. LIEN CHI / ADMIN CREATION & UPDATE
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const {
      title,
      description,
      category,
      plannedStartDate,
      plannedEndDate,
      registrationDeadline,
      locationName,
      locationLat,
      locationLng,
      attendanceRadius,
      minParticipants,
      maxParticipants,
      timeline,
      submit,
      leaderId
    } = req.body;
    
    const userId = req.user?.id!;
    const role = req.user?.role!;

    if (!title || !locationName || !plannedStartDate || !plannedEndDate) {
      await transaction.rollback();
      res.status(400).json({ message: 'Tiêu đề, địa điểm và thời gian dự kiến là bắt buộc' });
      return;
    }

    // Determine initial status
    let status: any = 'draft';
    if (role === 'admin') {
      status = 'open_registration'; // Admin bypasses approval
    } else if (submit === 'true' || submit === true) {
      status = 'pending';
    }

    const event = await Event.create({
      title,
      description,
      category,
      plannedStartDate,
      plannedEndDate,
      actualStartDate: role === 'admin' ? plannedStartDate : null,
      actualEndDate: role === 'admin' ? plannedEndDate : null,
      registrationDeadline: registrationDeadline || null,
      locationName,
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      attendanceRadius: attendanceRadius ? parseInt(attendanceRadius, 10) : null,
      minParticipants: minParticipants ? parseInt(minParticipants, 10) : null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      status,
      createdBy: userId,
      createdByRole: role === 'admin' ? 'admin' : 'lienchi',
      leaderId: leaderId ? parseInt(leaderId, 10) : null
    }, { transaction });

    // Handle Timeline (phases and details)
    if (timeline) {
      const parsedTimeline = typeof timeline === 'string' ? JSON.parse(timeline) : timeline;
      if (Array.isArray(parsedTimeline)) {
        for (let i = 0; i < parsedTimeline.length; i++) {
          const phase = parsedTimeline[i];
          const createdPhase = await EventTimeline.create({
            eventId: event.id,
            title: phase.title,
            startDate: phase.startDate,
            endDate: phase.endDate,
            description: phase.description || null,
            sortOrder: phase.sortOrder || i
          }, { transaction });

          if (phase.details && Array.isArray(phase.details)) {
            for (let j = 0; j < phase.details.length; j++) {
              const detail = phase.details[j];
              await EventTimelineDetail.create({
                timelineId: createdPhase.id,
                eventId: event.id,
                dateTime: detail.dateTime,
                title: detail.title,
                content: detail.content || null,
                sortOrder: detail.sortOrder || j
              }, { transaction });
            }
          }
        }
      }
    }

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    // Save cover and other images
    if (files && files.images) {
      const captions = req.body.imageCaptions ? (typeof req.body.imageCaptions === 'string' ? JSON.parse(req.body.imageCaptions) : req.body.imageCaptions) : [];
      const covers = req.body.imageIsCovers ? (typeof req.body.imageIsCovers === 'string' ? JSON.parse(req.body.imageIsCovers) : req.body.imageIsCovers) : [];

      for (let i = 0; i < files.images.length; i++) {
        const file = files.images[i];
        await EventImage.create({
          eventId: event.id,
          imageUrl: `/uploads/events/${file.filename}`,
          caption: captions[i] || null,
          isCover: covers[i] === true || covers[i] === 'true' || covers[i] === 1 ? 1 : 0,
          sortOrder: i
        }, { transaction });
      }
    }

    // Save attachments
    if (files && files.documents) {
      for (let i = 0; i < files.documents.length; i++) {
        const file = files.documents[i];
        await EventDocument.create({
          eventId: event.id,
          fileName: file.originalname,
          fileUrl: `/uploads/events/${file.filename}`,
          fileType: file.filename.split('.').pop() || null,
          fileSize: file.size,
          uploadedBy: userId
        }, { transaction });
      }
    }

    await transaction.commit();

    const fullEvent = await Event.findByPk(event.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines', include: [{ model: EventTimelineDetail, as: 'details' }] },
        { model: EventImage, as: 'images' },
        { model: EventDocument, as: 'documents' }
      ]
    });

    // Ghi nhật ký
    const statusLabel: Record<string, string> = {
      open_registration: 'Mở đăng ký (không cần duyệt)',
      pending: 'Chờ duyệt',
      draft: 'Lưu nháp',
    };
    writeAuditLog({
      userId,
      action: `Tạo sự kiện "${title}"`,
      targetType: 'Event',
      targetId: event.id,
      details: `Trạng thái ban đầu: ${statusLabel[status] ?? status}`,
      ipAddress: getClientIp(req) ?? undefined,
    });

    res.status(201).json({ message: 'Tạo sự kiện thành công', event: fullEvent });
  } catch (error) {
    await transaction.rollback();
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, { transaction });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const userId = req.user?.id!;
    const role = req.user?.role!;

    if (role !== 'admin' && !isOwner(event, userId)) {
      await transaction.rollback();
      res.status(403).json({ message: 'Không có quyền chỉnh sửa sự kiện này' });
      return;
    }

    // Lien Chi can only edit during draft or revision_required
    if (role !== 'admin' && !['draft', 'revision_required'].includes(event.status)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Chỉ được sửa đổi sự kiện ở trạng thái Nháp hoặc Yêu cầu chỉnh sửa' });
      return;
    }

    const {
      title,
      description,
      category,
      plannedStartDate,
      plannedEndDate,
      registrationDeadline,
      locationName,
      locationLat,
      locationLng,
      attendanceRadius,
      minParticipants,
      maxParticipants,
      timeline,
      submit,
      leaderId
    } = req.body;

    let updatedStatus = event.status;
    if (role !== 'admin' && (submit === 'true' || submit === true)) {
      updatedStatus = 'pending';
    } else if (role === 'admin') {
      updatedStatus = 'open_registration';
    }

    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      category: category !== undefined ? category : event.category,
      plannedStartDate: plannedStartDate || event.plannedStartDate,
      plannedEndDate: plannedEndDate || event.plannedEndDate,
      registrationDeadline: registrationDeadline !== undefined ? (registrationDeadline || null) : event.registrationDeadline,
      locationName: locationName || event.locationName,
      locationLat: locationLat !== undefined ? (locationLat ? parseFloat(locationLat) : null) : event.locationLat,
      locationLng: locationLng !== undefined ? (locationLng ? parseFloat(locationLng) : null) : event.locationLng,
      attendanceRadius: attendanceRadius !== undefined ? (attendanceRadius ? parseInt(attendanceRadius, 10) : null) : event.attendanceRadius,
      minParticipants: minParticipants !== undefined ? (minParticipants ? parseInt(minParticipants, 10) : null) : event.minParticipants,
      maxParticipants: maxParticipants !== undefined ? (maxParticipants ? parseInt(maxParticipants, 10) : null) : event.maxParticipants,
      status: updatedStatus,
      leaderId: leaderId !== undefined ? (leaderId ? parseInt(leaderId, 10) : null) : event.leaderId
    }, { transaction });

    // Handle Timeline updates (delete and recreate)
    if (timeline) {
      const parsedTimeline = typeof timeline === 'string' ? JSON.parse(timeline) : timeline;
      if (Array.isArray(parsedTimeline)) {
        await EventTimelineDetail.destroy({ where: { eventId: id }, transaction });
        await EventTimeline.destroy({ where: { eventId: id }, transaction });

        for (let i = 0; i < parsedTimeline.length; i++) {
          const phase = parsedTimeline[i];
          const createdPhase = await EventTimeline.create({
            eventId: event.id,
            title: phase.title,
            startDate: phase.startDate,
            endDate: phase.endDate,
            description: phase.description || null,
            sortOrder: phase.sortOrder || i
          }, { transaction });

          if (phase.details && Array.isArray(phase.details)) {
            for (let j = 0; j < phase.details.length; j++) {
              const detail = phase.details[j];
              await EventTimelineDetail.create({
                timelineId: createdPhase.id,
                eventId: event.id,
                dateTime: detail.dateTime,
                title: detail.title,
                content: detail.content || null,
                sortOrder: detail.sortOrder || j
              }, { transaction });
            }
          }
        }
      }
    }

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    // Manage image uploads: optionally replace or append images.
    // Here we will keep old files, unless user explicitly sends replacement.
    // If new images are sent: append them. Or if 'replaceImages' flag is true, delete old.
    if (files && files.images) {
      if (req.body.replaceImages === 'true' || req.body.replaceImages === true) {
        await EventImage.destroy({ where: { eventId: id }, transaction });
      }
      
      const captions = req.body.imageCaptions ? (typeof req.body.imageCaptions === 'string' ? JSON.parse(req.body.imageCaptions) : req.body.imageCaptions) : [];
      const covers = req.body.imageIsCovers ? (typeof req.body.imageIsCovers === 'string' ? JSON.parse(req.body.imageIsCovers) : req.body.imageIsCovers) : [];

      for (let i = 0; i < files.images.length; i++) {
        const file = files.images[i];
        await EventImage.create({
          eventId: event.id,
          imageUrl: `/uploads/events/${file.filename}`,
          caption: captions[i] || null,
          isCover: covers[i] === true || covers[i] === 'true' || covers[i] === 1 ? 1 : 0,
          sortOrder: i
        }, { transaction });
      }
    }

    // Append attachments
    if (files && files.documents) {
      if (req.body.replaceDocuments === 'true' || req.body.replaceDocuments === true) {
        await EventDocument.destroy({ where: { eventId: id }, transaction });
      }
      for (let i = 0; i < files.documents.length; i++) {
        const file = files.documents[i];
        await EventDocument.create({
          eventId: event.id,
          fileName: file.originalname,
          fileUrl: `/uploads/events/${file.filename}`,
          fileType: file.filename.split('.').pop() || null,
          fileSize: file.size,
          uploadedBy: userId
        }, { transaction });
      }
    }

    await transaction.commit();

    const fullEvent = await Event.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: EventTimeline, as: 'timelines', include: [{ model: EventTimelineDetail, as: 'details' }] },
        { model: EventImage, as: 'images' },
        { model: EventDocument, as: 'documents' }
      ]
    });

    res.json({ message: 'Cập nhật sự kiện thành công', event: fullEvent });
  } catch (error) {
    await transaction.rollback();
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Không có quyền thao tác' });
      return;
    }
    
    if (!['draft', 'revision_required'].includes(event.status)) {
      res.status(400).json({ message: 'Trạng thái sự kiện không hợp lệ để gửi duyệt' });
      return;
    }

    await event.update({ status: 'pending' });
    res.json({ message: 'Đã gửi duyệt sự kiện thành công', event });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

    if (req.user?.role !== 'admin') {
      if (!isOwner(event, req.user?.id!) || event.status !== 'draft') {
        res.status(403).json({ message: 'Chỉ được xóa sự kiện nháp của chính mình' });
        return;
      }
    }

    // Cascade delete is handled by database, but we clean up dependencies just in case
    await EventTimelineDetail.destroy({ where: { eventId: id } });
    await EventTimeline.destroy({ where: { eventId: id } });
    await EventImage.destroy({ where: { eventId: id } });
    await EventDocument.destroy({ where: { eventId: id } });
    await EventRegistration.destroy({ where: { eventId: id } });
    await EventApproval.destroy({ where: { eventId: id } });
    await event.destroy();

    res.json({ message: 'Xóa sự kiện thành công' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 3. ADMIN REVIEW ENDPOINTS
export const getPendingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'faculty'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const { actualStartDate, actualEndDate, note } = req.body;
    
    const event = await Event.findByPk(id, { transaction });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }
    if (event.status !== 'pending') {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    const start = actualStartDate || event.plannedStartDate;
    const end = actualEndDate || event.plannedEndDate;

    await event.update({
      status: 'open_registration',
      actualStartDate: start,
      actualEndDate: end
    }, { transaction });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: req.user?.id!,
      status: 'approved',
      note: note || 'Đã duyệt sự kiện'
    }, { transaction });

    await transaction.commit();

    // Ghi nhật ký
    writeAuditLog({
      userId: req.user!.id,
      action: `Duyệt sự kiện "${event.title}"`,
      targetType: 'Event',
      targetId: event.id,
      details: note ? `Ghi chú: ${note}` : undefined,
      ipAddress: getClientIp(req) ?? undefined,
    });

    res.json({ message: 'Duyệt sự kiện thành công. Sự kiện đã mở đăng ký.', event });
  } catch (error) {
    await transaction.rollback();
    console.error('Approve event error:', error);
    res.status(500).json({ message: 'Internal error' });
  }
};

export const rejectEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const event = await Event.findByPk(id, { transaction });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }
    if (event.status !== 'pending') {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    await event.update({
      status: 'cancelled',
      rejectionReason: reason
    }, { transaction });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: req.user?.id!,
      status: 'rejected',
      note: reason || 'Từ chối duyệt sự kiện'
    }, { transaction });

    await transaction.commit();

    // Ghi nhật ký
    writeAuditLog({
      userId: req.user!.id,
      action: `Từ chối sự kiện "${event.title}"`,
      targetType: 'Event',
      targetId: event.id,
      details: reason ? `Lý do: ${reason}` : undefined,
      ipAddress: getClientIp(req) ?? undefined,
    });

    res.json({ message: 'Đã từ chối duyệt sự kiện. Trạng thái chuyển thành Hủy.', event });
  } catch (error) {
    await transaction.rollback();
    console.error('Reject event error:', error);
    res.status(500).json({ message: 'Internal error' });
  }
};

export const requestEventRevision = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { id } = req.params;
    const { message, revisionDeadline } = req.body;

    if (!message || !revisionDeadline) {
      await transaction.rollback();
      res.status(400).json({ message: 'Lời nhắn và Hạn chỉnh sửa là bắt buộc' });
      return;
    }
    
    const event = await Event.findByPk(id, { transaction });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }
    if (event.status !== 'pending') {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện không ở trạng thái chờ duyệt' });
      return;
    }

    await event.update({
      status: 'revision_required',
      revisionMessage: message,
      revisionDeadline
    }, { transaction });

    await EventApproval.create({
      eventId: event.id,
      approvedBy: req.user?.id!,
      status: 'revision_requested',
      note: message,
      revisionDeadline
    }, { transaction });

    await transaction.commit();

    // Ghi nhật ký
    writeAuditLog({
      userId: req.user!.id,
      action: `Yêu cầu chỉnh sửa sự kiện "${event.title}"`,
      targetType: 'Event',
      targetId: event.id,
      details: `Lời nhắn: ${message}`,
      ipAddress: getClientIp(req) ?? undefined,
    });

    res.json({ message: 'Đã gửi yêu cầu chỉnh sửa cho Liên chi đoàn', event });
  } catch (error) {
    await transaction.rollback();
    console.error('Revision request error:', error);
    res.status(500).json({ message: 'Internal error' });
  }
};

// 4. BELOW MINIMUM RESOLUTION (LIEN CHI)
export const handleBelowMinimum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, note } = req.body; // action: 'proceed' or 'cancel'

    if (!['proceed', 'cancel'].includes(action)) {
      res.status(400).json({ message: 'Hành động không hợp lệ. Chỉ chấp nhận proceed hoặc cancel.' });
      return;
    }

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Không có quyền quyết định cho sự kiện này' });
      return;
    }

    if (event.status !== 'below_minimum') {
      res.status(400).json({ message: 'Sự kiện không nằm ở trạng thái cần xử lý số lượng tối thiểu' });
      return;
    }

    if (action === 'proceed') {
      // If proceeding, reset status to open_registration (to allow transition to ongoing later)
      // or change to ongoing if starting time already passed.
      const now = new Date();
      const start = event.actualStartDate || event.plannedStartDate;
      const finalStatus = now >= new Date(start) ? 'ongoing' : 'open_registration';

      await event.update({
        status: finalStatus,
        belowMinAction: 'proceed',
        belowMinNote: note || 'Quyết định tiếp tục tổ chức sự kiện'
      });
    } else {
      await event.update({
        status: 'cancelled',
        belowMinAction: 'cancel',
        belowMinNote: note || 'Hủy sự kiện do không đủ số lượng đăng ký tối thiểu'
      });
    }

    res.json({ message: 'Xử lý trạng thái dưới số lượng tối thiểu thành công', event });
  } catch (error) {
    console.error('Handle below minimum error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 5. REGISTRATION ENDPOINTS (STUDENTS)
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

    if (req.user?.role === 'student' && !(await canStudentAccessEvent(event, userId))) {
      await transaction.rollback();
      res.status(403).json({ message: 'Sá»± kiá»‡n nÃ y chá»‰ dÃ nh cho sinh viÃªn thuá»™c khoa phÃ¹ há»£p' });
      return;
    }

    // Check if registration is allowed using guard
    if (!isRegistrationOpen(event)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Đăng ký sự kiện hiện không mở hoặc đã hết hạn' });
      return;
    }

    if (!hasSlots(event)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện đã đủ số lượng giới hạn' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId: id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingRegistration && ['registered', 'attended', 'confirmed'].includes(existingRegistration.status)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Bạn đã đăng ký sự kiện này rồi' });
      return;
    }

    if (existingRegistration && existingRegistration.status === 'cancelled') {
      existingRegistration.status = 'registered';
      existingRegistration.registrationDate = new Date();
      await existingRegistration.save({ transaction });
    } else if (existingRegistration && existingRegistration.status === 'absent') {
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
    res.json({ message: 'Đăng ký tham gia thành công', currentSlots: event.currentSlots });
  } catch (error) {
    await transaction.rollback();
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký' });
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
      res.status(400).json({ message: 'Bạn chưa đăng ký hoặc không thể hủy đăng ký ở trạng thái hiện tại' });
      return;
    }

    // Check registration deadline
    if (event.registrationDeadline) {
      const now = new Date();
      const deadline = new Date(event.registrationDeadline);
      if (now >= deadline) {
        await transaction.rollback();
        res.status(400).json({ message: 'Hạn đăng ký đã hết, không thể hủy đăng ký' });
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

// 6. REGISTRATION MANAGEMENT (LIEN CHI / ADMIN)
export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      res.status(403).json({ message: 'Không có quyền xem danh sách đăng ký' });
      return;
    }

    const registrations = await EventRegistration.findAll({
      where: { eventId: id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'fullName', 'studentId', 'department', 'faculty', 'email', 'phone']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ registrations });
  } catch (error) {
    console.error('Get registrations error:', error);
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
      res.status(404).json({ message: 'Sự kiện không tìm thấy' });
      return;
    }

    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      await transaction.rollback();
      res.status(403).json({ message: 'Không có quyền thao tác' });
      return;
    }

    const student = await User.findOne({ where: { studentId }, transaction });
    if (!student) {
      await transaction.rollback();
      res.status(404).json({ message: `Không tìm thấy sinh viên với MSSV: ${studentId}` });
      return;
    }

    if (event.maxParticipants && event.currentSlots >= event.maxParticipants) {
      await transaction.rollback();
      res.status(400).json({ message: 'Sự kiện đã đủ số lượng tối đa' });
      return;
    }

    const existingRegistration = await EventRegistration.findOne({
      where: { eventId: id, userId: student.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingRegistration && ['registered', 'attended', 'confirmed'].includes(existingRegistration.status)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Sinh viên này đã có trong danh sách và có trạng thái hợp lệ' });
      return;
    }

    let registration;
    if (existingRegistration && (existingRegistration.status === 'cancelled' || existingRegistration.status === 'absent')) {
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

    const fullRegistration = await EventRegistration.findByPk(registration.id, {
      include: [{ model: User, attributes: ['id', 'name', 'fullName', 'studentId', 'department', 'faculty', 'email'] }]
    });

    res.json({ message: 'Thêm sinh viên thành công', registration: fullRegistration });
  } catch (error) {
    await transaction.rollback();
    console.error('Manual add registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRegistrationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { registrationId } = req.params;
    const { status } = req.body; // 'registered' | 'attended' | 'confirmed' | 'absent' | 'cancelled'

    const registration = await EventRegistration.findByPk(registrationId, { transaction, include: [Event] });
    if (!registration) {
      await transaction.rollback();
      res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký' });
      return;
    }

    const event = registration.getDataValue('Event') as any;
    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      await transaction.rollback();
      res.status(403).json({ message: 'Không có quyền thao tác' });
      return;
    }

    if (!['registered', 'attended', 'confirmed', 'absent', 'cancelled'].includes(status)) {
      await transaction.rollback();
      res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      return;
    }

    const oldStatus = registration.status;
    const lockEvent = await Event.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });

    // Handle slot counters based on transitions
    // slots increment when transition is from invalid state (cancelled, absent) to valid state (registered, attended, confirmed)
    // slots decrement when transition is from valid to invalid state
    const isValid = (s: string) => ['registered', 'attended', 'confirmed'].includes(s);

    if (!isValid(oldStatus) && isValid(status)) {
      if (lockEvent && lockEvent.maxParticipants && lockEvent.currentSlots >= lockEvent.maxParticipants) {
        await transaction.rollback();
        res.status(400).json({ message: 'Sự kiện đã đầy, không thể khôi phục đăng ký này' });
        return;
      }
      lockEvent!.currentSlots += 1;
      await lockEvent!.save({ transaction });
    } else if (isValid(oldStatus) && !isValid(status)) {
      if (lockEvent!.currentSlots > 0) {
        lockEvent!.currentSlots -= 1;
        await lockEvent!.save({ transaction });
      }
    }

    registration.status = status;
    if (status === 'confirmed') {
      registration.confirmedBy = req.user?.id!;
      registration.confirmedAt = new Date();
    }
    await registration.save({ transaction });
    await transaction.commit();

    res.json({ message: 'Cập nhật trạng thái sinh viên thành công', registration });
  } catch (error) {
    await transaction.rollback();
    console.error('Update registration status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Event.sequelize!.transaction();
  try {
    const { registrationId } = req.params;

    const registration = await EventRegistration.findByPk(registrationId, { transaction, include: [Event] });
    if (!registration) {
      await transaction.rollback();
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    const event = registration.getDataValue('Event') as any;
    if (req.user?.role !== 'admin' && !isOwner(event, req.user?.id!)) {
      await transaction.rollback();
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const lockEvent = await Event.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });
    const isValid = ['registered', 'attended', 'confirmed'].includes(registration.status);
    
    if (isValid && lockEvent!.currentSlots > 0) {
      lockEvent!.currentSlots -= 1;
      await lockEvent!.save({ transaction });
    }

    await registration.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Xóa sinh viên khỏi danh sách thành công' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 7. QR CHECKIN & FEEDBACK
export const toggleEventQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { active, latitude, longitude } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }

    if (req.user?.role !== 'admin' && event.createdBy !== req.user?.id) {
      res.status(403).json({ message: 'Không có quyền thao tác' });
      return;
    }

    if (active) {
      event.qrActive = true;
      if (!event.qrCode) {
        event.qrCode = `BKYOUTH-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      }
      // Only set coordinates if they are not already set/pinned at creation/edit time
      if (event.locationLat === null || event.locationLng === null) {
        if (latitude !== undefined && longitude !== undefined) {
          event.locationLat = latitude;
          event.locationLng = longitude;
        }
      }
    } else {
      event.qrActive = false;
    }

    await event.save();
    res.json({
      message: active ? 'Đã kích hoạt điểm danh QR' : 'Đã dừng điểm danh QR',
      qrCode: event.qrCode,
      qrActive: event.qrActive
    });
  } catch (error) {
    console.error('Toggle QR error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkInGPS = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Sự kiện không tồn tại' });
      return;
    }

    if (event.status !== 'ongoing') {
      res.status(400).json({ message: 'Sự kiện chưa bắt đầu hoặc đã kết thúc. Chỉ có thể điểm danh khi sự kiện đang diễn ra.' });
      return;
    }

    if (!event.qrActive) {
      res.status(400).json({ message: 'Chức năng điểm danh hiện không bật' });
      return;
    }

    // Check GPS radius (always mandatory)
    if (!event.locationLat || !event.locationLng || !event.attendanceRadius) {
      res.status(400).json({ message: 'Sự kiện chưa được cấu hình địa điểm định vị và bán kính điểm danh.' });
      return;
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      res.status(400).json({ message: 'Yêu cầu cấp quyền truy cập vị trí thiết bị để thực hiện điểm danh' });
      return;
    }

    const distKm = getDistanceFromLatLonInKm(
      Number(event.locationLat),
      Number(event.locationLng),
      Number(latitude),
      Number(longitude)
    );
    const distM = distKm * 1000;
    if (distM > event.attendanceRadius) {
      res.status(400).json({
        message: `Vị trí điểm danh của bạn nằm ngoài bán kính cho phép (${Math.round(distM)}m, giới hạn ${event.attendanceRadius}m)`
      });
      return;
    }

    const registration = await EventRegistration.findOne({
      where: { eventId: id, userId }
    });

    if (!registration) {
      res.status(400).json({ message: 'Bạn chưa đăng ký tham gia sự kiện này' });
      return;
    }

    if (['attended', 'confirmed'].includes(registration.status)) {
      res.status(400).json({ message: 'Bạn đã hoàn tất điểm danh trước đó' });
      return;
    }

    registration.status = 'attended';
    registration.attendedAt = new Date();
    registration.attendanceLat = latitude;
    registration.attendanceLng = longitude;
    await registration.save();

    res.json({ message: 'Điểm danh thành công!' });
  } catch (error) {
    console.error('Check-in GPS error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitEventFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id!;

    const registration = await EventRegistration.findOne({
      where: {
        eventId: id,
        userId,
        status: { [Op.in]: ['attended', 'confirmed'] }
      }
    });

    if (!registration) {
      res.status(403).json({ message: 'Chỉ sinh viên đã tham gia sự kiện mới được quyền đánh giá' });
      return;
    }

    const existingFeedback = await EventFeedback.findOne({
      where: { eventId: id, userId }
    });

    if (existingFeedback) {
      res.status(400).json({ message: 'Bạn đã đánh giá sự kiện này rồi' });
      return;
    }

    const feedback = await EventFeedback.create({
      eventId: Number(id),
      userId,
      rating,
      comment
    });

    res.status(201).json({ message: 'Gửi đánh giá thành công. Cảm ơn bạn!', feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }

    if (req.user?.role !== 'admin' && event.createdBy !== req.user?.id) {
      res.status(403).json({ message: 'Không có quyền xem các đánh giá của sự kiện này' });
      return;
    }

    const feedbacks = await EventFeedback.findAll({
      where: { eventId: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const scanStudentQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { studentQrCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: 'Sự kiện không tồn tại' });
      return;
    }

    if (req.user?.role !== 'admin' && event.createdBy !== req.user?.id) {
      res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
      return;
    }

    if (event.status !== 'ongoing') {
      res.status(400).json({ message: 'Sự kiện chưa bắt đầu hoặc đã kết thúc.' });
      return;
    }

    if (!event.qrActive) {
      res.status(400).json({ message: 'Phiên điểm danh hiện đang tắt.' });
      return;
    }

    // Parse STUDENT-CHECKIN-${eventId}-${studentUserId}
    const match = studentQrCode?.match(/^STUDENT-CHECKIN-(\d+)-(\d+)$/);
    if (!match) {
      res.status(400).json({ message: 'Mã QR sinh viên không đúng định dạng.' });
      return;
    }

    const parsedEventId = parseInt(match[1], 10);
    const studentUserId = parseInt(match[2], 10);

    if (parsedEventId !== event.id) {
      res.status(400).json({ message: 'Mã QR này thuộc về sự kiện khác.' });
      return;
    }

    const registration = await EventRegistration.findOne({
      where: { eventId: event.id, userId: studentUserId },
      include: [{ model: User, attributes: ['id', 'name', 'studentId'] }]
    });

    if (!registration) {
      res.status(400).json({ message: 'Sinh viên này chưa đăng ký tham gia sự kiện này.' });
      return;
    }

    if (['attended', 'confirmed'].includes(registration.status)) {
      const student = registration.getDataValue('User') as any;
      res.status(400).json({ message: `Sinh viên ${student?.name || ''} (${student?.studentId || ''}) đã được điểm danh trước đó.` });
      return;
    }

    registration.status = 'attended';
    registration.attendedAt = new Date();
    await registration.save();

    const student = registration.getDataValue('User') as any;
    res.json({
      message: `Điểm danh thành công cho sinh viên ${student?.name || ''} (${student?.studentId || ''})!`,
      studentName: student?.name || 'N/A',
      studentId: student?.studentId || 'N/A'
    });
  } catch (error) {
    console.error('Scan student QR error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
