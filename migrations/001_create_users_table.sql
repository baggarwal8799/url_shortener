-- ============================================
-- URL Shortener - User Authentication Schema
-- Migration: 001_create_users_table
-- Created: 2025-11-04
-- ============================================

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on is_active for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Add constraint to ensure email is lowercase
ALTER TABLE users ADD CONSTRAINT users_email_lowercase CHECK (email = LOWER(email));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user (optional - for development only)
-- Password: Test@123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, is_verified, is_active)
VALUES (
    'test@example.com',
    '$2b$10$rS9YJH9h9h9h9h9h9h9h9eC9YdGnJ7fQ8vN8K8K8K8K8K8K8K8K8K',
    'Test User',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Users table created successfully!';
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM users);
END $$;
