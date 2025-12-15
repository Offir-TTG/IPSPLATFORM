-- Create function to get enrollment by token with fresh data (bypass PostgREST cache)
-- This function executes a direct SQL query to ensure we always get the latest data

CREATE OR REPLACE FUNCTION get_enrollment_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Execute direct query and return as JSON
  SELECT json_build_object(
    'id', e.id,
    'user_id', e.user_id,
    'product_id', e.product_id,
    'total_amount', e.total_amount,
    'paid_amount', e.paid_amount,
    'currency', e.currency,
    'status', e.status,
    'payment_status', e.payment_status,
    'signature_status', e.signature_status,
    'docusign_envelope_id', e.docusign_envelope_id,
    'tenant_id', e.tenant_id,
    'token_expires_at', e.token_expires_at,
    'wizard_profile_data', e.wizard_profile_data,
    'updated_at', e.updated_at,
    'product', json_build_object(
      'id', p.id,
      'title', p.title,
      'type', p.type,
      'requires_signature', p.requires_signature,
      'signature_template_id', p.signature_template_id,
      'payment_model', p.payment_model
    )
  )
  INTO result
  FROM enrollments e
  JOIN products p ON p.id = e.product_id
  WHERE e.enrollment_token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_enrollment_by_token(TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_enrollment_by_token IS 'Get enrollment by token with fresh data, bypassing PostgREST cache';
