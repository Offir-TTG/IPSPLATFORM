-- ============================================================================
-- Add Daily.co Support to Zoom Sessions
-- ============================================================================
-- Description: Add Daily.co room fields to zoom_sessions table to support both platforms
-- Author: System
-- Date: 2025-12-19

-- Add Daily.co room fields to zoom_sessions table
ALTER TABLE zoom_sessions
ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS daily_room_id TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'zoom' CHECK (platform IN ('zoom', 'daily'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_daily_room_name ON zoom_sessions(daily_room_name);
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_platform ON zoom_sessions(platform);

-- Add comment
COMMENT ON COLUMN zoom_sessions.daily_room_name IS 'Daily.co room name (unique identifier)';
COMMENT ON COLUMN zoom_sessions.daily_room_url IS 'Daily.co room URL for joining';
COMMENT ON COLUMN zoom_sessions.daily_room_id IS 'Daily.co room ID from API';
COMMENT ON COLUMN zoom_sessions.platform IS 'Video platform: zoom or daily';
