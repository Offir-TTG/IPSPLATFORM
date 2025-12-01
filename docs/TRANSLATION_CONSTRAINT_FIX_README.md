# Translation Constraint Fix - Payment Translations Not Working

## Problem Summary

Payment translations were showing as literal keys (e.g., "admin.payments.title") instead of Hebrew text, while all other pages worked perfectly.

## Root Cause

The `translations` table has the **WRONG unique constraint**:

```sql
-- CURRENT (WRONG)
UNIQUE (language_code, translation_key)
```

It's missing `tenant_id`, which means the database **does not support multi-tenancy for translations**!

When trying to insert translations with a specific `tenant_id`, the database rejects them because it sees them as duplicates of existing translations with the same `(language_code, translation_key)` combination (probably with NULL tenant_id).

## The Correct Constraint

```sql
-- CORRECT (for multi-tenant support)
UNIQUE (tenant_id, language_code, translation_key)
```

## Solution - Run These SQL Files IN ORDER

### Step 1: Fix the Database Constraint

Run: **[FIX_TRANSLATIONS_CONSTRAINT.sql](FIX_TRANSLATIONS_CONSTRAINT.sql)**

This will:
1. Drop the old incorrect constraint
2. Add the correct multi-tenant constraint
3. Verify the new constraint is in place

### Step 2: Insert Payment Translations

Run: **[supabase/migrations/20251121_payment_hebrew_translations_only.sql](supabase/migrations/20251121_payment_hebrew_translations_only.sql)**

This will:
1. Delete any existing Hebrew payment translations for your tenant
2. Insert all 181 Hebrew payment translations
3. Use the correct ON CONFLICT clause: `(tenant_id, language_code, translation_key)`

### Step 3: Refresh Browser

After running both SQL files, refresh your browser. The payment translations will now work!

## Why This Happened

The original database schema was not designed for multi-tenancy. The unique constraint was probably created before the `tenant_id` column was added to the translations table, or the migration to add multi-tenancy support was incomplete.

## Files Fixed

1. **FIX_TRANSLATIONS_CONSTRAINT.sql** - New file to fix the constraint
2. **supabase/migrations/20251121_payment_hebrew_translations_only.sql** - Updated ON CONFLICT clause from `(language_code, translation_key)` to `(tenant_id, language_code, translation_key)`
3. **supabase/migrations/20251122_add_complete_keap_translations.sql** - Already had correct constraint

## Impact

This fix will allow:
- Multi-tenant support for translations (different tenants can have different translations for the same keys)
- Payment translations to be inserted successfully
- Any future translation migrations to work correctly

## Verification

After running the fixes, verify with:

```sql
-- Check the constraint
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'translations'::regclass
AND contype = 'u';

-- Should return:
-- UNIQUE (tenant_id, language_code, translation_key)

-- Check payment translations exist
SELECT COUNT(*)
FROM translations
WHERE tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac'
AND language_code = 'he'
AND translation_key LIKE 'admin.payments%';

-- Should return 181
```
