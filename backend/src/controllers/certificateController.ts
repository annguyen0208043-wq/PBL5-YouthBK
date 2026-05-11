import { Response } from 'express';
import Certificate from '../models/Certificate';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

// Lấy tất cả yêu cầu chứng nhận
export const getCertificateRequests = async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await Certificate.findAll({
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'studentId'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const mapped = certificates.map(c => {
      const d = c.toJSON() as any;
      return {
        ...d,
        requestedAt: d.createdAt,
        studentName: d.student?.name
      };
    });

    res.json({ certificates: mapped });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Duyệt chứng nhận
export const approveCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      res.status(404).json({ message: 'Certificate not found' });
      return;
    }

    const admin = await User.findByPk(adminId, { attributes: ['id', 'name'] });

    await certificate.update({
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      approverName: admin?.name || '',
      stampCode: 'BKYOUTH-DOANTRUONG-APPROVED',
      note: 'Đã được Đoàn trường duyệt, có hiệu lực cấp chứng nhận điện tử.'
    });

    res.json({ message: 'Đã duyệt chứng nhận', certificate });
  } catch (error) {
    console.error('Approve certificate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Từ chối chứng nhận
export const rejectCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      res.status(404).json({ message: 'Certificate not found' });
      return;
    }

    await certificate.update({
      status: 'rejected',
      approvedBy: adminId,
      note: 'Hồ sơ chưa đạt yêu cầu. Vui lòng bổ sung minh chứng hoặc liên hệ quản trị viên.'
    });

    res.json({ message: 'Đã từ chối chứng nhận', certificate });
  } catch (error) {
    console.error('Reject certificate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Sinh viên gửi yêu cầu chứng nhận
export const requestCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, activityTitle } = req.body;
    const userId = req.user?.id;

    if (!activityTitle) {
      res.status(400).json({ message: 'Tên hoạt động là bắt buộc' });
      return;
    }

    const certificate = await Certificate.create({
      userId,
      eventId: eventId || null,
      activityTitle,
      status: 'pending'
    });

    res.status(201).json({ message: 'Đã gửi yêu cầu chứng nhận', certificate });
  } catch (error) {
    console.error('Request certificate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
