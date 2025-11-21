-- Payment System Core Tables Migration
-- Creates the foundational tables for the universal payment system

-- ============================================================================
-- 1. PRODUCTS TABLE
-- Universal product registration for any billable item
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Product Identification
  product_type TEXT NOT NULL CHECK (product_type IN ('program', 'course', 'lecture', 'workshop', 'custom')),
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Payment Configuration
  auto_assign_payment_plan BOOLEAN DEFAULT true,
  default_payment_plan_id UUID, -- FK added later
  forced_payment_plan_id UUID, -- FK added later

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(tenant_id, product_type, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_type_lookup ON products(product_type);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_tenant_isolation'
  ) THEN
    CREATE POLICY products_tenant_isolation ON products
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = products.tenant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_admin_all'
  ) THEN
    CREATE POLICY products_admin_all ON products
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = products.tenant_id
          AND users.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 2. PAYMENT SCHEDULES TABLE
-- Individual payment dates with admin control
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id),

  -- Schedule Details
  payment_number INTEGER NOT NULL CHECK (payment_number > 0),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'installment', 'subscription', 'full')),

  -- Amounts
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Dates
  original_due_date TIMESTAMPTZ NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed',
    'paused', 'adjusted', 'cancelled', 'refunded'
  )),

  -- Payment Processing
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_id UUID REFERENCES payments(id),

  -- Admin Controls
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES users(id),
  paused_reason TEXT,
  resumed_at TIMESTAMPTZ,
  resumed_by UUID REFERENCES users(id),

  -- Adjustment History
  adjustment_history JSONB DEFAULT '[]',
  adjusted_by UUID REFERENCES users(id),
  adjustment_reason TEXT,

  -- Retry Information
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  next_retry_date TIMESTAMPTZ,
  last_error TEXT,

  -- Notifications
  reminder_sent_at TIMESTAMPTZ,
  overdue_notice_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(enrollment_id, payment_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedules_enrollment ON payment_schedules(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_tenant ON payment_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_plan ON payment_schedules(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_stripe_invoice ON payment_schedules(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- RLS Policies
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_schedules' AND policyname = 'payment_schedules_tenant_isolation'
  ) THEN
    CREATE POLICY payment_schedules_tenant_isolation ON payment_schedules
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = payment_schedules.tenant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_schedules' AND policyname = 'payment_schedules_user_read'
  ) THEN
    CREATE POLICY payment_schedules_user_read ON payment_schedules
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.id = payment_schedules.enrollment_id
          AND enrollments.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_schedules' AND policyname = 'payment_schedules_admin_all'
  ) THEN
    CREATE POLICY payment_schedules_admin_all ON payment_schedules
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = payment_schedules.tenant_id
          AND users.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_schedules_updated_at'
  ) THEN
    CREATE TRIGGER update_payment_schedules_updated_at
      BEFORE UPDATE ON payment_schedules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 3. SUBSCRIPTIONS TABLE
-- Active subscription tracking for recurring payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Subscription Details
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'cancelled', 'expired', 'past_due'
  )),

  -- Billing
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),

  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Stripe Integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Admin Controls
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES users(id),
  pause_reason TEXT,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enrollment ON subscriptions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_tenant_isolation'
  ) THEN
    CREATE POLICY subscriptions_tenant_isolation ON subscriptions
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = subscriptions.tenant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_user_read'
  ) THEN
    CREATE POLICY subscriptions_user_read ON subscriptions
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_admin_all'
  ) THEN
    CREATE POLICY subscriptions_admin_all ON subscriptions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.tenant_id = subscriptions.tenant_id
          AND users.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 4. ENHANCE EXISTING PAYMENTS TABLE
-- Add columns to support new payment system
-- ============================================================================

-- Add new columns to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS payment_plan_id UUID REFERENCES payment_plans(id),
ADD COLUMN IF NOT EXISTS payment_schedule_id UUID REFERENCES payment_schedules(id),
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('deposit', 'installment', 'subscription', 'full', 'one_time')),
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_product ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_schedule ON payments(payment_schedule_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice ON payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ============================================================================
-- 5. ENHANCE EXISTING ENROLLMENTS TABLE
-- Add payment tracking columns
-- ============================================================================

-- Add payment tracking columns to enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS payment_plan_id UUID REFERENCES payment_plans(id),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0 CHECK (paid_amount >= 0),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
  'pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'
)),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2) CHECK (deposit_amount >= 0),
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10, 2) CHECK (remaining_amount >= 0),
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_enrollments_product ON enrollments(product_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_plan ON enrollments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_payment ON enrollments(next_payment_date) WHERE next_payment_date IS NOT NULL;

-- ============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINTS TO PRODUCTS TABLE
-- (Done after payment_plans table exists)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_products_default_plan'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_default_plan
      FOREIGN KEY (default_payment_plan_id)
      REFERENCES payment_plans(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_products_forced_plan'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_forced_plan
      FOREIGN KEY (forced_payment_plan_id)
      REFERENCES payment_plans(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE products IS 'Universal product registration for any billable item in the system';
COMMENT ON TABLE payment_schedules IS 'Individual payment dates with full admin control and adjustment history';
COMMENT ON TABLE subscriptions IS 'Active subscription tracking for recurring billing';

COMMENT ON COLUMN products.metadata IS 'JSON metadata for product-specific data and auto-detection rules';
COMMENT ON COLUMN payment_schedules.adjustment_history IS 'JSON array tracking all admin adjustments to payment dates';
COMMENT ON COLUMN payment_schedules.original_due_date IS 'Original calculated due date, never changes';
COMMENT ON COLUMN payment_schedules.scheduled_date IS 'Current scheduled date, can be adjusted by admin';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    RAISE EXCEPTION 'Failed to create products table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_schedules') THEN
    RAISE EXCEPTION 'Failed to create payment_schedules table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE EXCEPTION 'Failed to create subscriptions table';
  END IF;
  RAISE NOTICE 'Payment system core tables created successfully';
END $$;
