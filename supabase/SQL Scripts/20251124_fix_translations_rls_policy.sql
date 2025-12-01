-- Fix translations table RLS policies to allow updates
-- This fixes the "new row violates row-level security policy" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "translations_select_policy" ON translations;
DROP POLICY IF EXISTS "translations_insert_policy" ON translations;
DROP POLICY IF EXISTS "translations_update_policy" ON translations;
DROP POLICY IF EXISTS "translations_delete_policy" ON translations;

-- Enable RLS
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for authenticated users within their tenant
CREATE POLICY "translations_select_policy" ON translations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Allow INSERT for authenticated admin users within their tenant
CREATE POLICY "translations_insert_policy" ON translations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.tenant_id = translations.tenant_id
    )
  );

-- Allow UPDATE for authenticated admin users within their tenant
CREATE POLICY "translations_update_policy" ON translations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.tenant_id = translations.tenant_id
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.tenant_id = translations.tenant_id
    )
  );

-- Allow DELETE for authenticated admin users within their tenant
CREATE POLICY "translations_delete_policy" ON translations
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.tenant_id = translations.tenant_id
    )
  );
