import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * Generate JWT access token
 */
export const generateToken = (payload: JwtPayload): string => {
  // Using hardcoded expiry to avoid TypeScript issues
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return token;
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return decoded;
};
