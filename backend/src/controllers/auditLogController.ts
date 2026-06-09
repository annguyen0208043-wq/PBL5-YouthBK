import { Response } from 'express';
import { Op } from 'sequelize';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50', startDate, endDate } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    // Search filter on action or details
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } },
        { targetType: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email', 'role', 'faculty']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      logs: rows
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
