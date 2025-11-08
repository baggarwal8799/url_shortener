import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Register a new user
 * POST /auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    // Basic password validation (at least 8 characters)
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Call service to register user
    const result = await authService.register(email, password, fullName);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login to continue.',
      data: result,
    });

  } catch (error) {
    console.error('Register error:', error);

    // Handle specific errors
    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Call service to login user
    const result = await authService.login(email, password);

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });

  } catch (error) {
    console.error('Login error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      if (error.message === 'Account is deactivated') {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
        return;
      }
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * Logout user (blacklist token)
 * POST /auth/logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // Blacklist the token
    await authService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.',
    });
  }
};
