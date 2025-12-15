-- ============================================================================
-- Update existing enrollments with wizard_profile_data
-- ============================================================================
-- This is a ONE-TIME update for enrollments created before the wizard_profile_data feature
-- Run this ONLY if you have existing enrollments with user_id=NULL but no wizard_profile_data

-- IMPORTANT: Replace the placeholder values with actual enrollment data
-- This is just an example - you'll need to customize it for your data

UPDATE enrollments
SET wizard_profile_data = jsonb_build_object(
  'email', 'user@example.com',  -- Replace with actual email
  'first_name', 'John',          -- Replace with actual first name
  'last_name', 'Doe',            -- Replace with actual last name
  'phone', '+1234567890'         -- Replace with actual phone (optional)
)
WHERE id = 'acaafcbb-61a8-46fa-be6c-25a7c88affcb'  -- Replace with actual enrollment ID
  AND user_id IS NULL
  AND wizard_profile_data IS NULL;

-- Verify the update
SELECT id, user_id, wizard_profile_data
FROM enrollments
WHERE id = 'acaafcbb-61a8-46fa-be6c-25a7c88affcb';
