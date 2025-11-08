import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

export default redis;
