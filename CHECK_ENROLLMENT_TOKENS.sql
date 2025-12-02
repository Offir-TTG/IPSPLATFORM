-- Check enrollment tokens and their validity
SELECT
  e.id,
  e.enrollment_token,
  e.token_expires_at,
  e.token_expires_at > NOW() as is_valid,
  e.status,
  e.invitation_sent_at,
  u.email as user_email,
  p.title as product_name,
  e.created_at
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN products p ON e.product_id = p.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Check for enrollments without tokens
SELECT
  COUNT(*) as enrollments_without_tokens
FROM enrollments
WHERE enrollment_token IS NULL OR enrollment_token = '';

-- Check for expired tokens
SELECT
  COUNT(*) as expired_tokens
FROM enrollments
WHERE enrollment_token IS NOT NULL
  AND token_expires_at < NOW();
