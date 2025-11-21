# Apply Migrations - Quick Guide

## Problem
The Add Course dialog is showing English text and RTL is not working because the Hebrew translations haven't been loaded into your Supabase database yet.

## Solution: Apply SQL Migrations

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run Migration 1 - Programs Translations
1. Click **New Query**
2. Open the file: `supabase/migrations/20251117_lms_programs_translations.sql`
3. Copy ALL the contents (Ctrl+A, Ctrl+C)
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for success message

### Step 3: Run Migration 2 - Program Detail Translations
1. Click **New Query** again
2. Open the file: `supabase/migrations/20251117_lms_program_detail_translations.sql`
3. Copy ALL the contents (Ctrl+A, Ctrl+C)
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for success message

### Step 4: Verify Translations Were Added
Run this query in SQL Editor to verify:
```sql
SELECT COUNT(*)
FROM translations
WHERE language_code = 'he'
  AND translation_key LIKE 'lms.program%';
```

You should see a count of Hebrew translations (should be 100+).

### Step 5: Test the Application
1. Go back to your application at http://localhost:3005
2. **Hard refresh the browser**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. Switch to Hebrew language (עברית)
4. Navigate to Admin → LMS → Programs
5. Click on any program
6. Click "Add Course" button
7. The dialog should now show:
   - Hebrew title: "הוסף קורסים לתוכנית"
   - RTL layout (checkbox on right, text on left)
   - All text in Hebrew

## If RTL Still Doesn't Work

After applying migrations and hard refreshing:

1. Open browser DevTools (F12)
2. Inspect the Add Course dialog
3. Check if the `DialogContent` element has `dir="rtl"` attribute
4. If not, check the Console tab for any errors

## Files to Copy

**Migration 1**: `C:\Users\OffirOmer\Documents\IPSPlatform\supabase\migrations\20251117_lms_programs_translations.sql`

**Migration 2**: `C:\Users\OffirOmer\Documents\IPSPlatform\supabase\migrations\20251117_lms_program_detail_translations.sql`
