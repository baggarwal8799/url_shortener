import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');

    res.json({
      success: true,
      message: 'Auth service is running!',
      database: 'Connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Auth routes
app.use('/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Register: POST http://localhost:${PORT}/auth/register`);
  console.log(`📍 Login: POST http://localhost:${PORT}/auth/login`);
  console.log(`📍 Logout: POST http://localhost:${PORT}/auth/logout (Protected)`);
});
