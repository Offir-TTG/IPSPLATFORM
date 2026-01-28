-- Clean migration for payment_disputes table
-- Handles existing partial tables/constraints

-- Drop existing table if it exists
DROP TABLE IF EXISTS payment_disputes CASCADE;

-- Create payment_disputes table to track Stripe disputes (chargebacks)
CREATE TABLE payment_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Dispute details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL, -- fraud, general, unrecognized, duplicate, product_unacceptable, etc.
  status TEXT NOT NULL CHECK (status IN ('needs_response', 'under_review', 'won', 'lost', 'closed')),

  -- Evidence tracking
  evidence_due_date TIMESTAMPTZ,
  evidence_submitted BOOLEAN DEFAULT FALSE,
  evidence_submitted_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_disputes_tenant_id ON payment_disputes(tenant_id);
CREATE INDEX idx_payment_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX idx_payment_disputes_user_id ON payment_disputes(user_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX idx_payment_disputes_stripe_dispute_id ON payment_disputes(stripe_dispute_id);
CREATE INDEX idx_payment_disputes_created_at ON payment_disputes(created_at DESC);

-- Enable RLS
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all disputes for their tenant
CREATE POLICY "Admins can view disputes for their tenant"
  ON payment_disputes
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update disputes for their tenant
CREATE POLICY "Admins can update disputes for their tenant"
  ON payment_disputes
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- System can insert disputes (via webhook)
CREATE POLICY "System can insert disputes"
  ON payment_disputes
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_payment_disputes_updated_at
  BEFORE UPDATE ON payment_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE payment_disputes IS 'Tracks Stripe payment disputes (chargebacks) for admin management';
COMMENT ON COLUMN payment_disputes.stripe_dispute_id IS 'Unique Stripe dispute ID (e.g., dp_xxx)';
COMMENT ON COLUMN payment_disputes.stripe_charge_id IS 'Stripe charge ID that was disputed';
COMMENT ON COLUMN payment_disputes.reason IS 'Dispute reason from Stripe (fraud, general, unrecognized, etc.)';
COMMENT ON COLUMN payment_disputes.status IS 'Current dispute status (needs_response, under_review, won, lost, closed)';
COMMENT ON COLUMN payment_disputes.evidence_due_date IS 'Deadline for submitting evidence to Stripe';
COMMENT ON COLUMN payment_disputes.evidence_submitted IS 'Whether evidence has been submitted to Stripe';
