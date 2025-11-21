-- ============================================================================
-- FIX: "You do not have access to this organization"
-- This script assigns users to the first available tenant
-- ============================================================================

-- Step 1: Check current situation
SELECT
  u.email,
  u.tenant_id as current_tenant,
  u.role,
  t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC
LIMIT 10;

-- Step 2: Find first tenant
SELECT id, name, slug FROM tenants ORDER BY created_at LIMIT 1;

-- Step 3: Assign users without tenant_id to the first tenant
-- ⚠️ UNCOMMENT AND RUN THIS AFTER REVIEWING STEP 1 & 2

/*
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found! Please create a tenant first.';
  END IF;

  -- Update all users without a tenant_id
  UPDATE users
  SET tenant_id = v_tenant_id,
      updated_at = NOW()
  WHERE tenant_id IS NULL;

  RAISE NOTICE 'Updated users to tenant ID: %', v_tenant_id;
END $$;
*/

-- Step 4: Verify the fix
SELECT
  u.email,
  u.tenant_id,
  u.role,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- Replace with your email
LIMIT 1;
