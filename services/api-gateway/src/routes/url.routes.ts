import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();
const URL_SHORTENER_SERVICE_URL = process.env.URL_SHORTENER_SERVICE_URL || 'http://localhost:3002';

// Create shortened URL - Requires authentication
router.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const response = await axios.post(
      `${URL_SHORTENER_SERVICE_URL}/urls`,
      req.body,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
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

// Get user's URLs - Requires authentication
router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    // Forward query parameters (page, limit)
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = `${URL_SHORTENER_SERVICE_URL}/urls${queryString ? '?' + queryString : ''}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ success: false, message: 'Gateway error' });
    }
  }
});

// Delete URL - Requires authentication
router.delete('/:shortCode', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const { shortCode } = req.params;

    const response = await axios.delete(
      `${URL_SHORTENER_SERVICE_URL}/urls/${shortCode}`,
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
