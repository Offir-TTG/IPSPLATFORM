-- Check the actual enrollment data in the database
SELECT
  id,
  signature_status,
  wizard_profile_data,
  updated_at,
  docusign_envelope_id
FROM enrollments
WHERE id = '99c6e1be-6f76-4f77-8302-d770a435a2a8';

-- Also test the RPC function directly
SELECT * FROM get_enrollment_fresh('99c6e1be-6f76-4f77-8302-d770a435a2a8');
