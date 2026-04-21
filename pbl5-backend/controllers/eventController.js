const { Event, EventTimeline, EventImage } = require('../models');

const createEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime, maxParticipants, category, timeline } = req.body;
    
    if (!title || !location || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ: title, location, startTime, endTime' });
    }

    // Determine event status based on user role
    const userRole = (req.user?.role || '').trim().toLowerCase();
    const isDoanTruong = ['đoàn trường', 'doan truong', 'admin'].includes(userRole);
    const eventStatus = isDoanTruong ? 'Sắp diễn ra' : 'Chờ duyệt';

    // Create event
    const newEvent = await Event.create({
      title,
      description,
      location,
      startTime,
      endTime,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      category: category || null,
      createdBy: req.user.id,
      status: eventStatus
    });

    // Add timeline items
    if (timeline) {
      try {
        const timelineItems = JSON.parse(timeline);
        if (Array.isArray(timelineItems) && timelineItems.length > 0) {
          await Promise.all(timelineItems.map(item =>
            EventTimeline.create({
              eventId: newEvent.id,
              dateTime: new Date(item.dateTime),
              description: item.description
            })
          ));
        }
      } catch (err) {
        console.error('Timeline parsing error:', err);
      }
    }

    // Add image files
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(file => {
        // Convert absolute path to relative path for storage
        const relativePath = file.path.replace(/\\/g, '/').split('uploads')[1];
        return EventImage.create({
          eventId: newEvent.id,
          imagePath: `/uploads${relativePath}`,
          fileName: file.originalname
        });
      }));
    }

    // Fetch event with relations
    const eventWithDetails = await Event.findByPk(newEvent.id, {
      include: [
        { association: 'timelines' },
        { association: 'images' }
      ]
    });

    return res.status(201).json({
      message: 'Tạo sự kiện thành công',
      event: eventWithDetails
    });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        { association: 'timelines' },
        { association: 'images' }
      ],
      order: [['startTime', 'ASC']]
    });
    return res.status(200).json({ events });
  } catch (err) {
    console.error('getAllEvents error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getPendingEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'Chờ duyệt' },
      include: [
        { association: 'timelines' },
        { association: 'images' },
        { association: 'creator', attributes: ['id', 'fullName', 'email', 'role'] }
      ],
      order: [['startTime', 'ASC']]
    });
    return res.status(200).json({ events });
  } catch (err) {
    console.error('getPendingEvents error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { note } = req.body;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Sự kiện không tồn tại' });
    }

    // Update event status
    await event.update({ status: 'Sắp diễn ra' });

    // Create approval record
    const { EventApproval } = require('../models');
    await EventApproval.create({
      eventId: eventId,
      approvedBy: req.user.id,
      status: 'Duyệt',
      note: note || null
    });

    // Fetch updated event
    const updatedEvent = await Event.findByPk(eventId, {
      include: [
        { association: 'timelines' },
        { association: 'images' },
        { association: 'creator', attributes: ['id', 'fullName', 'email', 'role'] }
      ]
    });

    return res.status(200).json({
      message: 'Duyệt sự kiện thành công',
      event: updatedEvent
    });
  } catch (err) {
    console.error('approveEvent error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { note } = req.body;

    if (!note || note.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Sự kiện không tồn tại' });
    }

    // Update event status
    await event.update({ status: 'Từ chối' });

    // Create approval record
    const { EventApproval } = require('../models');
    await EventApproval.create({
      eventId: eventId,
      approvedBy: req.user.id,
      status: 'Từ chối',
      note: note
    });

    // Fetch updated event
    const updatedEvent = await Event.findByPk(eventId, {
      include: [
        { association: 'timelines' },
        { association: 'images' },
        { association: 'creator', attributes: ['id', 'fullName', 'email', 'role'] }
      ]
    });

    return res.status(200).json({
      message: 'Từ chối sự kiện thành công',
      event: updatedEvent
    });
  } catch (err) {
    console.error('rejectEvent error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const requestEventRevision = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { note } = req.body;

    if (!note || note.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp nội dung yêu cầu chỉnh sửa' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Sự kiện không tồn tại' });
    }

    // Update event status
    await event.update({ status: 'Cần chỉnh sửa' });

    // Create approval record
    const { EventApproval } = require('../models');
    await EventApproval.create({
      eventId: eventId,
      approvedBy: req.user.id,
      status: 'Yêu cầu chỉnh sửa',
      note: note
    });

    // Fetch updated event
    const updatedEvent = await Event.findByPk(eventId, {
      include: [
        { association: 'timelines' },
        { association: 'images' },
        { association: 'creator', attributes: ['id', 'fullName', 'email', 'role'] }
      ]
    });

    return res.status(200).json({
      message: 'Yêu cầu chỉnh sửa sự kiện thành công',
      event: updatedEvent
    });
  } catch (err) {
    console.error('requestEventRevision error:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { createEvent, getAllEvents, getPendingEvents, approveEvent, rejectEvent, requestEventRevision };
