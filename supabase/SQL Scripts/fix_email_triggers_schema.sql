-- ============================================================================
-- Fix email_triggers table schema - Add all missing columns
-- ============================================================================
-- This script ensures the email_triggers table has all required columns
-- Run this if you get column does not exist errors
-- ============================================================================

DO $$
DECLARE
  columns_added INTEGER := 0;
BEGIN
  -- Add send_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'send_time'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN send_time TIME;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added send_time column';
  END IF;

  -- Add send_days_before column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'send_days_before'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN send_days_before INTEGER;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added send_days_before column';
  END IF;

  -- Add recipient_role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN recipient_role TEXT;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added recipient_role column';
  END IF;

  -- Add recipient_field column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'recipient_field'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN recipient_field TEXT;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added recipient_field column';
  END IF;

  -- Add conditions column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'conditions'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN conditions JSONB;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added conditions column';
  END IF;

  -- Add delay_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'delay_minutes'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN delay_minutes INTEGER DEFAULT 0;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added delay_minutes column';
  END IF;

  -- Add priority column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'priority'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low'));
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added priority column';
  END IF;

  -- Add created_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added created_by column';
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_triggers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE email_triggers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    columns_added := columns_added + 1;
    RAISE NOTICE '✓ Added updated_at column';
  END IF;

  -- Summary
  IF columns_added > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added % missing columns', columns_added;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All columns already exist - no changes needed';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- Verify all required columns exist
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  required_columns TEXT[] := ARRAY[
    'id', 'tenant_id', 'trigger_name', 'trigger_event', 'template_id',
    'conditions', 'delay_minutes', 'send_time', 'send_days_before',
    'is_active', 'recipient_role', 'recipient_field', 'priority',
    'created_at', 'updated_at', 'created_by'
  ];
  col TEXT;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'email_triggers'
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Missing columns in email_triggers: %', array_to_string(missing_columns, ', ');
    RAISE WARNING 'Please run the full migration: 20251202_email_system_core.sql';
  ELSE
    RAISE NOTICE '✅ All required columns exist in email_triggers table';
  END IF;
END $$;
