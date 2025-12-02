# Database Migration Fixes - December 2, 2025

## Issues Fixed

### 1. Missing `payment_metadata` Column Error

**Error Message:**
```
Failed to cancel enrollment: Could not find the 'payment_metadata' column of 'enrollments' in the schema cache
```

**Root Cause:**
The code in `src/lib/payments/enrollmentService.ts` references a `payment_metadata` column that doesn't exist in the database. This column is used in two places:

1. **Line 103** - When creating new enrollments
2. **Line 324** - When canceling enrollments

**Files Affected:**
- `src/lib/payments/enrollmentService.ts` (lines 103, 324)
- `src/app/api/admin/enrollments/[id]/cancel/route.ts` (calls cancelEnrollment)

**Solution:**
Created migration file: `supabase/migrations/20251202_add_payment_metadata_column.sql`

This migration adds the missing `payment_metadata` JSONB column to the `enrollments` table.

---

### 2. Missing `wizard_profile_data` Column

**Purpose:**
Supports the new token-based unauthenticated enrollment flow (prevents "ghost accounts").

**Root Cause:**
The new token-based enrollment implementation requires a `wizard_profile_data` column to store user profile information during the enrollment wizard BEFORE creating the user account.

**Files Using This Column:**
- `src/app/api/enrollments/token/[token]/wizard-status/route.ts`
- `src/app/api/enrollments/token/[token]/profile/route.ts`
- `src/app/api/enrollments/token/[token]/complete/route.ts`

**Solution:**
Created migration file: `supabase/migrations/20251202_add_wizard_profile_data.sql`

This migration adds the `wizard_profile_data` JSONB column to store temporary profile data during unauthenticated enrollment.

---

## Migrations Created

### Migration 1: `20251202_add_payment_metadata_column.sql`

**What it does:**
- Adds `payment_metadata` JSONB column to `enrollments` table
- Creates GIN index for efficient JSON querying
- Sets default value to empty JSON object `'{}'`

**Usage:**
Stores payment-related metadata including:
- Processing timestamps
- Auto-detected payment plans
- Cancellation information (reason, refund amount, cancelled by)
- Custom payment data

### Migration 2: `20251202_add_wizard_profile_data.sql`

**What it does:**
- Adds `wizard_profile_data` JSONB column to `enrollments` table
- Creates GIN index for efficient JSON querying
- Sets default value to empty JSON object `'{}'`

**Usage:**
Stores user profile data during unauthenticated enrollment wizard:
- first_name
- last_name
- email
- phone
- address
- city
- country
- updated_at

---

## How to Apply Migrations

### Option 1: Using Supabase CLI (if linked)
```bash
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the SQL from each migration file
4. Execute in order:
   - First: `20251202_add_payment_metadata_column.sql`
   - Second: `20251202_add_wizard_profile_data.sql`

### Option 3: Using Database Client
```sql
-- Run both migrations in order
\i supabase/migrations/20251202_add_payment_metadata_column.sql
\i supabase/migrations/20251202_add_wizard_profile_data.sql
```

---

## Verification

After applying the migrations, verify they worked:

```sql
-- Check payment_metadata column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enrollments'
AND column_name = 'payment_metadata';

-- Check wizard_profile_data column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enrollments'
AND column_name = 'wizard_profile_data';

-- Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'enrollments'
AND indexname IN ('idx_enrollments_payment_metadata', 'idx_enrollments_wizard_profile_data');
```

Expected output:
```
payment_metadata    | jsonb | '{}'::jsonb
wizard_profile_data | jsonb | '{}'::jsonb
```

---

## Testing After Migration

### Test 1: Payment Metadata (Cancel Enrollment)
1. Go to Admin → Enrollments
2. Try to cancel an enrollment
3. Should work without errors
4. Check database: `payment_metadata` should contain cancellation info

### Test 2: Wizard Profile Data (Token-Based Enrollment)
1. Create a new enrollment for a non-existent user
2. Send invitation link
3. Click link (without logging in)
4. Accept enrollment
5. Wizard should load without errors
6. Complete profile step
7. Check database: `wizard_profile_data` should contain profile info

---

## Rollback Plan

If you need to rollback these migrations:

```sql
-- Remove payment_metadata column
ALTER TABLE enrollments DROP COLUMN IF EXISTS payment_metadata;
DROP INDEX IF EXISTS idx_enrollments_payment_metadata;

-- Remove wizard_profile_data column
ALTER TABLE enrollments DROP COLUMN IF EXISTS wizard_profile_data;
DROP INDEX IF EXISTS idx_enrollments_wizard_profile_data;
```

**⚠️ Warning:** Rolling back will cause errors in the code that uses these columns. Only rollback if you're reverting the entire feature.

---

## Impact Analysis

### High Priority (Blocking)
- ✅ **payment_metadata** - Required for enrollment cancellation (admin feature)
- ✅ **wizard_profile_data** - Required for new enrollment flow

### Features Enabled
After applying these migrations:
1. ✅ Admins can cancel enrollments without errors
2. ✅ Token-based unauthenticated enrollment flow works
3. ✅ No more "ghost accounts" from abandoned enrollments
4. ✅ Payment system metadata tracking enabled

---

## Related Documentation

- [Enrollment Wizard Implementation](./ENROLLMENT_WIZARD_IMPLEMENTATION.md)
- [Token-Based Enrollment Plan](../.claude/plans/sequential-toasting-dragonfly.md)
- [Payment System](./PAYMENT_SYSTEM_IMPLEMENTATION_COMPLETE.md)

---

**Status**: ✅ Migrations created and ready to apply
**Next Action**: Apply migrations to database using one of the methods above
