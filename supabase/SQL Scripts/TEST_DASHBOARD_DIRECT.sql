-- Test the dashboard function directly to see the actual error
-- Replace 'YOUR_USER_ID' with your actual user ID

-- First, find your user ID
SELECT id, email, role FROM users WHERE email = 'YOUR_EMAIL_HERE';

-- Then test the function with your user ID
SELECT get_user_dashboard_v3('YOUR_USER_ID_HERE');

-- Alternative: Test with current authenticated user
SELECT get_user_dashboard_v3(auth.uid());
