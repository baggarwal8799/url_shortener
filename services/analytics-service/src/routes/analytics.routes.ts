import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as analyticsController from '../controllers/analytics.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /analytics/:shortCode - Get analytics for a short code
router.get('/:shortCode', analyticsController.getAnalytics);

export default router;
