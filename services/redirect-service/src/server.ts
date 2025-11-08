import Fastify from 'fastify';
import dotenv from 'dotenv';
import pool from './config/database';
import redis from './config/redis';
import { getProducer, disconnectProducer } from './config/kafka';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  },
});

const PORT = parseInt(process.env.PORT || '3003');
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400');
const KAFKA_TOPIC = process.env.KAFKA_TOPIC_CLICKS || 'click.events';

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    // Test Redis connection
    await redis.ping();

    return {
      success: true,
      message: 'Redirect Service is running!',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Redirect endpoint - Ultra-fast redirect
fastify.get<{ Params: { shortCode: string } }>('/:shortCode', async (request, reply) => {
  const { shortCode } = request.params;

  try {
    // Step 1: Check Redis cache first (fastest path)
    const cacheKey = `url:${shortCode}`;
    const cachedUrl = await redis.get(cacheKey);

    let originalUrl: string;

    if (cachedUrl) {
      // Cache hit - use cached URL
      originalUrl = cachedUrl;
      fastify.log.info(`Cache HIT for ${shortCode}`);
    } else {
      // Cache miss - query database
      fastify.log.info(`Cache MISS for ${shortCode}`);

      const result = await pool.query(
        `SELECT original_url, is_active, expires_at
         FROM urls
         WHERE short_code = $1 OR custom_alias = $1`,
        [shortCode]
      );

      if (result.rows.length === 0) {
        // URL not found
        reply.status(404);
        return {
          success: false,
          message: 'Short URL not found',
        };
      }

      const url = result.rows[0];

      // Check if URL is active
      if (!url.is_active) {
        reply.status(410);
        return {
          success: false,
          message: 'This short URL has been deactivated',
        };
      }

      // Check if URL has expired
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        reply.status(410);
        return {
          success: false,
          message: 'This short URL has expired',
        };
      }

      originalUrl = url.original_url;

      // Cache the URL in Redis for future requests
      await redis.setex(cacheKey, CACHE_TTL, originalUrl);
      fastify.log.info(`Cached ${shortCode} in Redis`);
    }

    // Step 2: Publish click event to Kafka (async, non-blocking)
    publishClickEvent(shortCode, request).catch((err) => {
      fastify.log.error('Failed to publish click event:', err);
      // Don't block the redirect if Kafka fails
    });

    // Step 3: Perform redirect (302 temporary redirect)
    reply.redirect(originalUrl);
  } catch (error) {
    fastify.log.error({ error }, 'Redirect error');
    reply.status(500);
    return {
      success: false,
      message: 'Internal server error',
    };
  }
});

/**
 * Publish click event to Kafka for analytics
 */
async function publishClickEvent(shortCode: string, request: any): Promise<void> {
  try {
    const producer = await getProducer();

    const clickEvent = {
      shortCode,
      timestamp: new Date().toISOString(),
      ip: request.ip,
      userAgent: request.headers['user-agent'] || '',
      referer: request.headers['referer'] || request.headers['referrer'] || '',
    };

    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [
        {
          key: shortCode,
          value: JSON.stringify(clickEvent),
        },
      ],
    });

    fastify.log.info(`Published click event for ${shortCode}`);
  } catch (error) {
    fastify.log.error({ error }, 'Kafka publish error');
    throw error;
  }
}

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await disconnectProducer();
  await pool.end();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const start = async () => {
  try {
    // Initialize Kafka producer
    await getProducer();

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Redirect Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
