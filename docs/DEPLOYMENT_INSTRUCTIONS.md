# Dashboard Fix - Deployment Instructions

## Problem Summary
The dashboard is showing "Error loading dashboard - Failed to load your dashboard data" because the database function `get_user_dashboard_v3` has schema mismatches with the actual database structure.

## Root Causes Identified
1. **Primary Issue**: Function queries `user_progress.enrollment_id` which may not exist in deployed schema
2. **Secondary Issue**: Function incorrectly assumes `lessons.end_time` column exists - must calculate from `start_time + duration`
3. **Schema Mismatch**: Lessons don't have `course_id` - they're related to courses through modules

## Files Created
- ✅ `VERIFY_SCHEMA.sql` - Check what's actually in your database
- ✅ `FIXED_DASHBOARD_FUNCTION.sql` - Corrected version of the function
- ✅ `CREATE_DASHBOARD_FUNCTION.sql` - Updated with the fix

## Deployment Steps

### Step 1: Verify Your Database Schema
1. Open your Supabase Dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `VERIFY_SCHEMA.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Review the results to see what columns actually exist

**Key things to check:**
- Does `user_progress` table have `enrollment_id` column? (Should be YES)
- Does `lessons` table have `end_time` column? (Should be NO)
- Does `lessons` table have `course_id` column? (Should be NO)

### Step 2: Deploy the Fixed Function
1. In Supabase SQL Editor, create a new query
2. Copy and paste the entire contents of `FIXED_DASHBOARD_FUNCTION.sql`
3. Click **Run** (or press Ctrl+Enter)
4. You should see: "Function get_user_dashboard_v3 created successfully!"

### Step 3: Verify the Fix
1. Go to your application at http://localhost:3003/dashboard (or your dev server port)
2. Refresh the page
3. The dashboard should now load with data (or show empty state if you have no enrollments)

### Step 4: If Still Failing
If the dashboard still shows an error after deploying the function:

**Option A: Check for enrollment_id issue**
If `VERIFY_SCHEMA.sql` showed that `enrollment_id` does NOT exist in `user_progress`, you need to either:
1. Run the full LMS schema from `src/lib/supabase/lms-schema.sql`, OR
2. Modify the function to use `course_id` instead of `enrollment_id`

**Option B: Check browser console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Share the error with the development team

## What Was Fixed

### In `FIXED_DASHBOARD_FUNCTION.sql`:
1. ✅ Uses `enrollment_id` for user_progress joins
2. ✅ Joins lessons through modules: `lessons.module_id → modules.course_id`
3. ✅ Calculates `end_time` as: `start_time + (duration || ' minutes')::interval`
4. ✅ Uses `time_spent_seconds` (not minutes)
5. ✅ Includes `expires_at` field for enrollments
6. ✅ Uses DISTINCT to prevent double-counting lessons

### In `src/types/lms.ts`:
1. ✅ Removed misleading `course_id` field from Lesson interface
2. ✅ Added comment explaining the correct relationship through modules

## Troubleshooting

### Error: "column up.enrollment_id does not exist"
**Solution**: Your database is using the old schema. You need to:
1. Run the LMS schema: `src/lib/supabase/lms-schema.sql`
2. OR contact your database admin to add the `enrollment_id` column

### Error: "column l.end_time does not exist"
**Solution**: This is already fixed in `FIXED_DASHBOARD_FUNCTION.sql`. Make sure you deployed the correct version.

### Dashboard shows empty state but you have courses
**Possible causes**:
1. No active enrollments (status != 'active')
2. User's `tenant_id` doesn't match course `tenant_id`
3. Check enrollments table: `SELECT * FROM enrollments WHERE user_id = 'YOUR_USER_ID';`

## Success Criteria
After deployment, you should see:
- ✅ Dashboard loads without errors
- ✅ Stats cards show correct numbers (or zeros if no data)
- ✅ Enrollments display if you have active courses
- ✅ Upcoming sessions show if you have scheduled lessons
- ✅ No console errors in browser DevTools

## Need Help?
If you continue to experience issues:
1. Run `VERIFY_SCHEMA.sql` and share the results
2. Check browser console for errors
3. Check Supabase logs in Dashboard > Logs
4. Verify user is logged in and has correct tenant_id
