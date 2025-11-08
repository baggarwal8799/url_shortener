import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database';
import redis from './config/redis';
import urlRoutes from './routes/url.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    // Test Redis connection
    await redis.ping();

    res.json({
      success: true,
      message: 'URL Shortener Service is running!',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Routes
app.use('/urls', urlRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
