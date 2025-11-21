-- ============================================================================
-- QUICK FIX: Assign all users to default tenant
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Update all users to have the first tenant's ID
UPDATE users
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

-- Verify users now have tenant assigned
SELECT
  email,
  role,
  tenant_id,
  (SELECT name FROM tenants WHERE id = users.tenant_id) as tenant_name
FROM users
ORDER BY created_at DESC;
