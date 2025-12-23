-- ============================================================================
-- Add Daily.co Integration
-- ============================================================================
-- Description: Add Daily.co video platform to integrations table
-- Author: System
-- Date: 2025-12-19

-- Insert Daily.co integration
INSERT INTO public.integrations (integration_key, integration_name, is_enabled, credentials, settings, webhook_url)
VALUES
  ('daily', 'Daily.co Video', false, '{
    "api_key": ""
  }'::jsonb, '{
    "subdomain": "",
    "default_room_privacy": "private",
    "enable_recording": true,
    "default_expiry_hours": 24
  }'::jsonb, '/api/webhooks/daily')
ON CONFLICT (integration_key) DO UPDATE SET
  integration_name = EXCLUDED.integration_name,
  settings = EXCLUDED.settings,
  webhook_url = EXCLUDED.webhook_url;

-- Update the database schema migration for zoom_sessions
ALTER TABLE zoom_sessions
ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS daily_room_id TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'zoom' CHECK (platform IN ('zoom', 'daily'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_daily_room_name ON zoom_sessions(daily_room_name);
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_platform ON zoom_sessions(platform);

-- Add comments
COMMENT ON COLUMN zoom_sessions.daily_room_name IS 'Daily.co room name (unique identifier)';
COMMENT ON COLUMN zoom_sessions.daily_room_url IS 'Daily.co room URL for joining';
COMMENT ON COLUMN zoom_sessions.daily_room_id IS 'Daily.co room ID from API';
COMMENT ON COLUMN zoom_sessions.platform IS 'Video platform: zoom or daily';
