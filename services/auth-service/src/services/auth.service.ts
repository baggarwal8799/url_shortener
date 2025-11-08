import pool from '../config/database';
import redis from '../config/redis';
import { hashPassword, comparePassword } from './hash.service';
import { generateToken, verifyToken } from './jwt.service';

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    full_name: string;
  };
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    full_name: string;
    is_verified: boolean;
  };
  token: string;
}

/**
 * Register a new user (no token, must login separately)
 */
export const register = async (
  email: string,
  password: string,
  fullName: string
): Promise<RegisterResponse> => {

  // Step 1: Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Step 2: Hash password
  const passwordHash = await hashPassword(password);

  // Step 3: Insert user into database
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, is_verified, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, full_name`,
    [email.toLowerCase(), passwordHash, fullName, false, true]
  );

  const user = result.rows[0];

  // Step 4: Return user only (no token)
  return {
    user,
  };
};

/**
 * Login user and generate token
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {

  // Step 1: Find user by email
  const result = await pool.query(
    `SELECT id, email, password_hash, full_name, is_verified, is_active
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Step 2: Check if user is active
  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  // Step 3: Compare password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Step 4: Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  // Step 5: Return user and token (remove password_hash)
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_verified: user.is_verified,
    },
    token,
  };
};

/**
 * Logout user by blacklisting their token
 */
export const logout = async (token: string): Promise<void> => {
  // Decode token to get expiry time
  const decoded = verifyToken(token);

  // Calculate TTL (time to live) for Redis
  // Token will be blacklisted until it naturally expires
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiry = (decoded as any).exp; // JWT exp claim
  const ttl = tokenExpiry - currentTime;

  if (ttl > 0) {
    // Store token in Redis blacklist
    const key = `blacklist:token:${token}`;
    await redis.set(key, '1', 'EX', ttl);
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const key = `blacklist:token:${token}`;
  const result = await redis.get(key);
  return result !== null;
};
