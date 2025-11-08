import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005';

// Get analytics for a short code - Requires authentication
router.get('/:shortCode', async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const response = await axios.get(
      `${ANALYTICS_SERVICE_URL}/analytics/${shortCode}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ success: false, message: 'Gateway error' });
    }
  }
});

export default router;
