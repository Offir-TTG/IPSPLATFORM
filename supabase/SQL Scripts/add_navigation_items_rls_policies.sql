-- Add RLS policies for navigation_items table
-- This allows authenticated users to read navigation items for their tenant
-- and admins to update navigation items for their tenant

-- Enable RLS on navigation_items (if not already enabled)
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their tenant's navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Admins can update their tenant's navigation items" ON navigation_items;

-- Policy: Allow authenticated users to read navigation items for their tenant
CREATE POLICY "Users can read their tenant's navigation items"
  ON navigation_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Allow admins to update navigation items for their tenant
CREATE POLICY "Admins can update their tenant's navigation items"
  ON navigation_items
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
