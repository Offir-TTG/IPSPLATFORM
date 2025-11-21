-- Create a dummy column to force PostgREST to reload
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS _cache_bust_temp TEXT DEFAULT NULL;

-- Immediately drop it
ALTER TABLE lessons DROP COLUMN IF EXISTS _cache_bust_temp;

-- Add comments to trigger reload
COMMENT ON TABLE lessons IS 'Updated: Force PostgREST reload - 2025-11-20';
COMMENT ON COLUMN lessons.duration IS 'Duration in minutes (INTEGER) - NOT duration_minutes';

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;
