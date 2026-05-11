import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

export const lienChiMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'lienchi') {
    res.status(403).json({ message: 'LienChi access required' });
    return;
  }
  next();
};

// Middleware cho phép cả admin và liên chi đoàn
export const adminOrLienChiMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'lienchi')) {
    res.status(403).json({ message: 'Admin or LienChi access required' });
    return;
  }
  next();
};
