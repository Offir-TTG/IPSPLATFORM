-- ============================================================================
-- FIX NOTIFICATION_READS READ_AT COLUMN TO BE NULLABLE
-- ============================================================================
-- Date: 2025-02-01
-- Purpose: Allow read_at to be NULL so we can track deleted but unread notifications
-- ============================================================================

-- Make read_at column nullable
ALTER TABLE public.notification_reads
ALTER COLUMN read_at DROP NOT NULL;

-- Update the default to NULL instead of NOW()
ALTER TABLE public.notification_reads
ALTER COLUMN read_at SET DEFAULT NULL;

-- Comment explaining the columns
COMMENT ON COLUMN public.notification_reads.read_at IS 'Timestamp when user read the notification. NULL means not read yet (but may be deleted).';
COMMENT ON COLUMN public.notification_reads.is_deleted IS 'Boolean flag indicating if user has deleted this notification from their view. Can be true even if read_at is NULL.';
