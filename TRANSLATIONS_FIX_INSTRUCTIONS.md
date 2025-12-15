# Translations Page Fix - Final Instructions

## Problem
The translations page was not saving changes due to a database constraint mismatch. The database has partial unique indexes that Supabase's `.upsert()` method cannot work with directly.

## Solution
Use a PostgreSQL function to handle upserts properly.

## Steps to Fix

### Step 1: Run the SQL Function
Open your Supabase Dashboard → SQL Editor, and run the SQL from this file:
**`run-this-sql.sql`**

This creates a database function `upsert_translation()` that properly handles the unique constraint conflicts.

### Step 2: Test
After running the SQL, the translations page should work immediately. The API code has already been updated to use the new function.

## What Was Changed

### Backend Changes
1. **API Route** ([src/app/api/admin/translations/route.ts](src/app/api/admin/translations/route.ts)):
   - Updated POST endpoint to use `upsert_translation()` RPC function
   - Updated PUT endpoint to use the same function for bulk operations
   - Added `context` field handling to match database schema

### Frontend Changes
2. **Translations Page** ([src/app/admin/config/translations/page.tsx](src/app/admin/config/translations/page.tsx)):
   - Added `context` field to Translation and TranslationGroup interfaces
   - Updated edit/save handlers to preserve context
   - Auto-detect context based on translation key (admin.* → 'admin', others → 'user')

### Database Function
3. **New SQL Function**: `upsert_translation()`
   - Handles INSERT ... ON CONFLICT properly with partial unique indexes
   - Returns the upserted record
   - Includes fallback for different constraint configurations

## Technical Details

### The Root Cause
The `translations` table has these partial unique indexes:
- `translations_unique_with_tenant`: For tenant-specific translations (WHERE tenant_id IS NOT NULL)
- `translations_unique_global`: For global translations (WHERE tenant_id IS NULL)

Supabase's `.upsert()` method requires a regular UNIQUE CONSTRAINT, not partial indexes with WHERE clauses.

### The Fix
Instead of changing the database schema (which would require data migration), we created a PostgreSQL function that uses raw SQL `INSERT ... ON CONFLICT ... DO UPDATE` which works with partial indexes.

## Verification

Test the fix by:
1. Navigate to Admin → Config → Translations
2. Click edit on any translation
3. Modify a value
4. Click save
5. The changes should be saved successfully without errors

## Files Modified
- `src/app/api/admin/translations/route.ts` - API endpoints
- `src/app/admin/config/translations/page.tsx` - Frontend UI
- `run-this-sql.sql` - Database function (needs to be executed)

## Cleanup
After confirming everything works, you can delete these temporary files:
- `test-upsert.ts`
- `check-translation-sample.ts`
- `fix-constraint-now.ts`
- `apply-constraint-fix.ts`
- `verify-translations-schema.sql`
- `create-proper-constraint.sql`
- `TRANSLATIONS_FIX_INSTRUCTIONS.md` (this file)
