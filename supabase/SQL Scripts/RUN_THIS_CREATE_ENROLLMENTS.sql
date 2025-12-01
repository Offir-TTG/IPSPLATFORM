-- =====================================================
-- Create Enrollments Table
-- =====================================================
-- Run this script to create the enrollments table
-- This fixes the enrollment page issues:
-- 1. Payment plan showing as N/A
-- 2. Amount showing as Zero
-- 3. Payment Status always pending
-- 4. Missing enrollment status
-- =====================================================

-- Drop the existing table if it exists (to ensure clean slate)
DROP TABLE IF EXISTS public.enrollments CASCADE;

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- User and Product
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Payment Plan (if using template-based payment plans)
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,

  -- Payment Tracking
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'suspended', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),

  -- Payment tracking
  next_payment_date TIMESTAMPTZ,

  -- Enrollment tracking
  enrollment_type TEXT DEFAULT 'self_enrolled' CHECK (enrollment_type IN ('admin_assigned', 'self_enrolled')),
  created_by UUID REFERENCES users(id),

  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, product_id, tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_product ON enrollments(product_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON enrollments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_plan ON enrollments(payment_plan_id) WHERE payment_plan_id IS NOT NULL;

-- RLS Policies
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS enrollments_tenant_isolation ON enrollments;
DROP POLICY IF EXISTS enrollments_user_read ON enrollments;
DROP POLICY IF EXISTS enrollments_admin_all ON enrollments;

-- Tenant isolation
CREATE POLICY enrollments_tenant_isolation ON enrollments
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = enrollments.tenant_id
    )
  );

-- Users can read their own enrollments
CREATE POLICY enrollments_user_read ON enrollments
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins have full access
CREATE POLICY enrollments_admin_all ON enrollments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = enrollments.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_enrollments_updated_at'
  ) THEN
    CREATE TRIGGER update_enrollments_updated_at
      BEFORE UPDATE ON enrollments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comments
COMMENT ON TABLE enrollments IS 'User enrollments to products with payment tracking';
COMMENT ON COLUMN enrollments.status IS 'Enrollment lifecycle status: draft (created, email not sent), pending (email sent, awaiting user action), active (user enrolled and can access), suspended (temporarily paused), cancelled, or completed';
COMMENT ON COLUMN enrollments.payment_status IS 'Payment status: pending, partial, paid, or overdue';
COMMENT ON COLUMN enrollments.enrollment_type IS 'admin_assigned (manually enrolled by admin) or self_enrolled (enrolled by user)';

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Enrollments table created successfully! You can now create enrollments with proper payment tracking.';
END $$;
