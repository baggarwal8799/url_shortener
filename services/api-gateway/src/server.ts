import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import authRoutes from './routes/auth.routes';
import urlRoutes from './routes/url.routes';
import analyticsRoutes from './routes/analytics.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter); // Apply rate limiting to all routes

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

app.use(morgan('dev')); // Request logging
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running!',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirect route - catch-all for short codes (must be last)
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const REDIRECT_SERVICE_URL = process.env.REDIRECT_SERVICE_URL || 'http://localhost:3003';

    // Forward to redirect service
    const response = await axios.get(`${REDIRECT_SERVICE_URL}/${shortCode}`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    // If redirect service returns a redirect, follow it
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.location;
      if (location) {
        res.redirect(location);
        return;
      }
    }

    // Otherwise return the response from redirect service
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      // Forward error response from redirect service
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ success: false, message: 'Gateway error' });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
