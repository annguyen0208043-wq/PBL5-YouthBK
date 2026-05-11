import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  
  try {
    const options: VerifyOptions = {};
    return jwt.verify(token, secret, options) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};
