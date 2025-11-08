-- Create Clicks table for analytics
CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    short_code VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_url_id_clicked_at ON clicks(url_id, clicked_at DESC);

-- Add comment to table
COMMENT ON TABLE clicks IS 'Stores individual click events for analytics';
COMMENT ON COLUMN clicks.url_id IS 'Foreign key to urls table';
COMMENT ON COLUMN clicks.short_code IS 'Denormalized short code for faster queries';
COMMENT ON COLUMN clicks.ip_address IS 'Client IP address (IPv4 or IPv6)';
COMMENT ON COLUMN clicks.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN clicks.referer IS 'HTTP referer URL';
COMMENT ON COLUMN clicks.clicked_at IS 'When the click occurred';
