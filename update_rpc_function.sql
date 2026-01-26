-- Update the RPC function to use VOLATILE instead of STABLE
-- This forces PostgreSQL to always fetch fresh data without caching

DROP FUNCTION IF EXISTS get_enrollment_fresh(UUID);

CREATE OR REPLACE FUNCTION get_enrollment_fresh(p_enrollment_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  token TEXT,
  user_id UUID,
  product_id UUID,
  payment_plan_id UUID,
  status TEXT,
  signature_status VARCHAR(50),
  payment_status TEXT,
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2),
  currency TEXT,
  wizard_profile_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  docusign_envelope_id VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.tenant_id,
    e.enrollment_token,
    e.user_id,
    e.product_id,
    e.payment_plan_id,
    e.status,
    e.signature_status,
    e.payment_status,
    e.total_amount,
    e.paid_amount,
    e.currency,
    e.wizard_profile_data,
    e.created_at,
    e.updated_at,
    e.token_expires_at,
    e.docusign_envelope_id
  FROM enrollments e
  WHERE e.id = p_enrollment_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

GRANT EXECUTE ON FUNCTION get_enrollment_fresh(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_enrollment_fresh(UUID) TO anon;

COMMENT ON FUNCTION get_enrollment_fresh IS 'Fetches fresh enrollment data bypassing PostgREST cache - VOLATILE to prevent result caching';
