import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as analyticsService from '../services/analytics.service';
import pool from '../config/database';

/**
 * Get analytics for a specific short code
 * GET /analytics/:shortCode
 */
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // Check if URL belongs to user
    const ownershipCheck = await pool.query(
      'SELECT id FROM urls WHERE (short_code = $1 OR custom_alias = $1) AND user_id = $2',
      [shortCode, userIdNum]
    );

    if (ownershipCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics for this URL',
      });
      return;
    }

    // Get analytics
    const analytics = await analyticsService.getAnalytics(shortCode);

    if (!analytics) {
      res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics. Please try again.',
    });
  }
};
