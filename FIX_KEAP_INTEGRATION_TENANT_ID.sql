-- ============================================================================
-- Fix ALL Integrations tenant_id
-- ============================================================================
-- This script updates ALL integration records to set the correct tenant_id
-- Currently integrations have tenant_id = NULL which causes issues in
-- multi-tenant environments

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
  v_updated_count INTEGER;
  v_integration_record RECORD;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fixing ALL Integrations tenant_id';
  RAISE NOTICE '============================================';

  -- Show current state
  RAISE NOTICE 'Current integrations without tenant_id:';
  FOR v_integration_record IN
    SELECT integration_key, id
    FROM integrations
    WHERE tenant_id IS NULL
  LOOP
    RAISE NOTICE '  - % (id: %)', v_integration_record.integration_key, v_integration_record.id;
  END LOOP;

  -- Update tenant_id for ALL integrations that have NULL tenant_id
  UPDATE integrations
  SET
    tenant_id = v_tenant_id,
    updated_at = NOW()
  WHERE tenant_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Successfully updated % integration(s) with tenant_id: %', v_updated_count, v_tenant_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Updated integrations:';
    FOR v_integration_record IN
      SELECT integration_key, id
      FROM integrations
      WHERE tenant_id = v_tenant_id
    LOOP
      RAISE NOTICE '  ✓ % (id: %)', v_integration_record.integration_key, v_integration_record.id;
    END LOOP;
  ELSE
    RAISE NOTICE 'ℹ️  All integrations already have a tenant_id set';
  END IF;

  RAISE NOTICE '============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
    RAISE;
END $$;

-- Verify the update - Show ALL integrations
SELECT
  integration_key,
  tenant_id,
  is_enabled,
  created_at,
  updated_at
FROM integrations
ORDER BY integration_key;
