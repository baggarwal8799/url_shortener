import pool from '../config/database';
import redis from '../config/redis';
import { generateShortCode } from './shortcode.service';
import validator from 'validator';

export interface CreateUrlRequest {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: Date;
}

export interface UrlResponse {
  id: number;
  userId: number;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  shortUrl: string;
  clickCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH || '7');
const CACHE_TTL = 86400; // 24 hours in seconds

/**
 * Create a shortened URL
 */
export const createUrl = async (
  userId: number,
  data: CreateUrlRequest
): Promise<UrlResponse> => {
  const { originalUrl, customAlias, expiresAt } = data;

  // Validate URL
  if (!validator.isURL(originalUrl, { require_protocol: true })) {
    throw new Error('Invalid URL format');
  }

  // Check if custom alias is provided and validate it
  if (customAlias) {
    // Validate custom alias format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-_]{3,50}$/.test(customAlias)) {
      throw new Error('Custom alias must be 3-50 characters (alphanumeric, hyphens, underscores only)');
    }

    // Check if custom alias already exists
    const existingAlias = await pool.query(
      'SELECT id FROM urls WHERE custom_alias = $1',
      [customAlias]
    );

    if (existingAlias.rows.length > 0) {
      throw new Error('Custom alias already taken');
    }
  }

  // Generate unique short code
  let shortCode = customAlias || generateShortCode(SHORT_CODE_LENGTH);
  let attempts = 0;
  const maxAttempts = 5;

  // If not using custom alias, ensure short code is unique
  if (!customAlias) {
    while (attempts < maxAttempts) {
      const existing = await pool.query(
        'SELECT id FROM urls WHERE short_code = $1',
        [shortCode]
      );

      if (existing.rows.length === 0) {
        break; // Found unique code
      }

      shortCode = generateShortCode(SHORT_CODE_LENGTH);
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error('Failed to generate unique short code. Please try again.');
    }
  }

  // Insert URL into database
  const result = await pool.query(
    `INSERT INTO urls (user_id, original_url, short_code, custom_alias, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, original_url, short_code, custom_alias, click_count, is_active, expires_at, created_at`,
    [userId, originalUrl, shortCode, customAlias || null, expiresAt || null]
  );

  const url = result.rows[0];

  // Cache the URL in Redis for fast lookups
  const cacheKey = `url:${shortCode}`;
  await redis.setex(cacheKey, CACHE_TTL, originalUrl);

  // Return response
  return {
    id: url.id,
    userId: url.user_id,
    originalUrl: url.original_url,
    shortCode: url.short_code,
    customAlias: url.custom_alias,
    shortUrl: `${BASE_URL}/${url.short_code}`,
    clickCount: url.click_count,
    isActive: url.is_active,
    expiresAt: url.expires_at,
    createdAt: url.created_at,
  };
};

/**
 * Get all URLs for a user with pagination
 */
export const getUserUrls = async (
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ urls: UrlResponse[]; total: number; page: number; limit: number }> => {
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM urls WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated URLs
  const result = await pool.query(
    `SELECT id, user_id, original_url, short_code, custom_alias, click_count, is_active, expires_at, created_at
     FROM urls
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const urls = result.rows.map((url) => ({
    id: url.id,
    userId: url.user_id,
    originalUrl: url.original_url,
    shortCode: url.short_code,
    customAlias: url.custom_alias,
    shortUrl: `${BASE_URL}/${url.short_code}`,
    clickCount: url.click_count,
    isActive: url.is_active,
    expiresAt: url.expires_at,
    createdAt: url.created_at,
  }));

  return {
    urls,
    total,
    page,
    limit,
  };
};

/**
 * Delete a URL (soft delete - mark as inactive)
 */
export const deleteUrl = async (
  userId: number,
  shortCode: string
): Promise<void> => {
  // First check if the URL exists and belongs to the user
  const checkResult = await pool.query(
    'SELECT id, short_code FROM urls WHERE (short_code = $1 OR custom_alias = $1) AND user_id = $2',
    [shortCode, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new Error('URL not found or you do not have permission to delete it');
  }

  const url = checkResult.rows[0];

  // Soft delete - mark as inactive
  await pool.query(
    'UPDATE urls SET is_active = false WHERE id = $1',
    [url.id]
  );

  // Remove from Redis cache
  const cacheKey = `url:${url.short_code}`;
  await redis.del(cacheKey);
};
