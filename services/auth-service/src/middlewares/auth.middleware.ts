import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../services/jwt.service';
import { isTokenBlacklisted } from '../services/auth.service';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer "

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info and token to request
    req.user = decoded;
    req.token = token;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
