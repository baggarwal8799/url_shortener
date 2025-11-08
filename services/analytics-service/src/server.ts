import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database';
import { getConsumer, disconnectConsumer } from './config/kafka';
import { startClicksConsumer, shutdownConsumer } from './consumers/clicks.consumer';
import analyticsRoutes from './routes/analytics.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3005');

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    res.json({
      success: true,
      message: 'Analytics Service is running!',
      database: 'connected',
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
app.use('/analytics', analyticsRoutes);

// Start server and Kafka consumer
const start = async () => {
  try {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Analytics Service running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });

    // Start Kafka consumer
    const consumer = await getConsumer();
    await startClicksConsumer(consumer);

    console.log('✅ Analytics Service fully started');
  } catch (err) {
    console.error('Failed to start Analytics Service:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down Analytics Service...');

  await shutdownConsumer();
  await disconnectConsumer();
  await pool.end();

  console.log('👋 Analytics Service stopped');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
