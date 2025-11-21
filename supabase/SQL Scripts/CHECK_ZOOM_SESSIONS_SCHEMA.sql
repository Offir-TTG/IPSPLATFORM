-- ============================================================================
-- CHECK ZOOM_SESSIONS TABLE STRUCTURE
-- ============================================================================
-- Let's see what columns actually exist in zoom_sessions table
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'zoom_sessions'
ORDER BY ordinal_position;
