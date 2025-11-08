import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as urlService from '../services/url.service';

/**
 * Create a shortened URL
 * POST /urls
 */
export const createUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { originalUrl, customAlias, expiresAt } = req.body;

    // Validate required fields
    if (!originalUrl) {
      res.status(400).json({
        success: false,
        message: 'Original URL is required',
      });
      return;
    }

    // Create URL
    const url = await urlService.createUrl(userId, {
      originalUrl,
      customAlias,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'URL shortened successfully',
      data: url,
    });
  } catch (error) {
    console.error('Create URL error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('already taken')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Custom alias must be')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Failed to create short URL. Please try again.',
    });
  }
};

/**
 * Get all URLs for the authenticated user
 * GET /urls
 */
export const getUserUrls = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Get pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
      });
      return;
    }

    // Get user's URLs
    const result = await urlService.getUserUrls(userId, page, limit);

    res.status(200).json({
      success: true,
      message: 'URLs retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get URLs error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve URLs. Please try again.',
    });
  }
};

/**
 * Delete a URL (soft delete)
 * DELETE /urls/:shortCode
 */
export const deleteUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { shortCode } = req.params;

    if (!shortCode) {
      res.status(400).json({
        success: false,
        message: 'Short code is required',
      });
      return;
    }

    // Delete the URL
    await urlService.deleteUrl(userId, shortCode);

    res.status(200).json({
      success: true,
      message: 'URL deleted successfully',
    });
  } catch (error) {
    console.error('Delete URL error:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete URL. Please try again.',
    });
  }
};
