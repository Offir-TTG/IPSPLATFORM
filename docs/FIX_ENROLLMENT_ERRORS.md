# Fix Enrollment System Errors

## Current Errors

You're seeing these errors in the browser console:

1. **500 Error on GET `/api/admin/enrollments`**
2. **500 Error on POST `/api/admin/enrollments`**: "Could not find the 'enrollment_type' column of 'user_programs' in the schema cache"

## Root Cause

The `user_programs` table is missing two required columns:
- `enrollment_type` - To distinguish between admin-assigned and self-enrolled enrollments
- `created_by` - To track which admin created the enrollment

## Solution: Add Missing Database Columns

### Step 1: Run the SQL Migration

1. **Open your Supabase Dashboard**:
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor**

2. **Run this SQL script**:

   Copy and paste the contents of this file:
   ```
   supabase/SQL Scripts/20251126_add_enrollment_tracking_fields.sql
   ```

   Or run this SQL directly:

   ```sql
   -- Add enrollment_type column
   ALTER TABLE user_programs
   ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'self_enrolled'
   CHECK (enrollment_type IN ('admin_assigned', 'self_enrolled'));

   -- Add created_by column
   ALTER TABLE user_programs
   ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

   -- Add indexes for performance
   CREATE INDEX IF NOT EXISTS idx_user_programs_created_by
   ON user_programs(created_by);

   CREATE INDEX IF NOT EXISTS idx_user_programs_enrollment_type
   ON user_programs(enrollment_type);

   -- Verify columns were added
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'user_programs'
     AND column_name IN ('enrollment_type', 'created_by')
   ORDER BY column_name;
   ```

3. **Click "Run"**

4. **Verify the output** shows both columns:
   ```
   column_name      | data_type | is_nullable | column_default
   -----------------+-----------+-------------+-------------------
   created_by       | uuid      | YES         | NULL
   enrollment_type  | text      | YES         | 'self_enrolled'
   ```

### Step 2: Restart Your Dev Server

After adding the columns, restart Next.js to clear the Supabase schema cache:

```bash
# Stop the server
Ctrl + C

# Start it again
npm run dev
```

### Step 3: Test the Enrollment System

1. Navigate to `/admin/enrollments`
2. The page should load without 500 errors
3. Click "Create Enrollment" (צור רישום)
4. Fill out the form:
   - Select a user
   - Select content type (Program or Course)
   - Select specific content
5. Click "Create Enrollment"
6. Should see success message
7. New enrollment should appear in the table

## What These Columns Do

### `enrollment_type` Column
- **Purpose**: Distinguishes how the user was enrolled
- **Values**:
  - `'admin_assigned'` - Manually enrolled by an admin
  - `'self_enrolled'` - User enrolled themselves (future feature)
- **Default**: `'self_enrolled'`

### `created_by` Column
- **Purpose**: Tracks which admin created the enrollment
- **Type**: UUID (foreign key to users table)
- **Value**: NULL for self-enrolled, admin user ID for admin-assigned
- **Default**: NULL

## Why This Happened

The API routes were written expecting these columns to exist, but they were never added to the database. This is a common issue when:
1. Database schema is created manually
2. Migrations aren't applied
3. Development happens without a complete schema definition

## Complete Schema Expectations

The `user_programs` table should now have these columns:

```
Column             | Type      | Purpose
-------------------+-----------+------------------------------------
id                 | uuid      | Primary key
user_id            | uuid      | Student enrolled (FK to users)
program_id         | uuid      | Program enrolled in (FK to programs)
enrollment_status  | text      | Status (active, completed, etc.)
enrolled_at        | timestamp | When enrollment started
completed_at       | timestamp | When completed (NULL if ongoing)
expires_at         | timestamp | When enrollment expires (optional)
created_at         | timestamp | Record creation time
enrollment_type    | text      | admin_assigned or self_enrolled ✨ NEW
created_by         | uuid      | Admin who created (FK to users) ✨ NEW
```

## Troubleshooting

### If you still see 500 errors after running the SQL:

1. **Clear Supabase cache**:
   - Restart your dev server (Ctrl+C, then `npm run dev`)
   - This forces Next.js to fetch the new schema from Supabase

2. **Check the SQL ran successfully**:
   - Go back to Supabase SQL Editor
   - Run the verification query:
     ```sql
     SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'user_programs'
     ORDER BY column_name;
     ```
   - Verify you see `created_by` and `enrollment_type`

3. **Check server terminal** for new errors:
   - The error message should change if columns are added
   - Look for any new error messages

### If columns already exist:

If the SQL says columns already exist, but you're still getting errors:
1. The schema cache might be stale
2. Restart the dev server to force a refresh

### If you see foreign key constraint errors:

The `created_by` column references the `users` table. If your `users` table has a different structure or name:
1. Check your users table name: `SELECT * FROM information_schema.tables WHERE table_name LIKE '%user%';`
2. Adjust the foreign key reference accordingly

## Files Created

1. **Migration file**: [supabase/migrations/20251126_add_enrollment_tracking_fields.sql](../supabase/migrations/20251126_add_enrollment_tracking_fields.sql)
2. **SQL script**: [supabase/SQL Scripts/20251126_add_enrollment_tracking_fields.sql](../supabase/SQL%20Scripts/20251126_add_enrollment_tracking_fields.sql)
3. **This guide**: [docs/FIX_ENROLLMENT_ERRORS.md](./FIX_ENROLLMENT_ERRORS.md)

## Next Steps After Fix

Once the columns are added and the system is working:

1. ✅ Test creating enrollments
2. ✅ Verify enrollments appear in the table
3. ✅ Check both English and Hebrew modes
4. ✅ Test filtering enrollments
5. 📋 Update user dashboard to show enrollment types (next task)
6. 📋 Add enrollment history and audit trail (future task)

## Summary

🔧 **Problem**: Missing database columns
💊 **Solution**: Run SQL script to add `enrollment_type` and `created_by` columns
🔄 **Action Required**: Run SQL in Supabase Dashboard → Restart dev server
⏰ **Time**: ~2 minutes
✨ **Result**: Enrollment system will work properly
