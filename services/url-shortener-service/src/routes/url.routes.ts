import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as urlController from '../controllers/url.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /urls - Create a shortened URL
router.post('/', urlController.createUrl);

// GET /urls - Get all URLs for the authenticated user
router.get('/', urlController.getUserUrls);

// DELETE /urls/:shortCode - Delete a URL
router.delete('/:shortCode', urlController.deleteUrl);

export default router;
