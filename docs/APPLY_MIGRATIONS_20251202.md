# Database Migrations - December 2, 2025

## Overview
This document provides instructions for applying three critical database migrations needed for the token-based enrollment wizard.

## Migrations to Apply

### 1. Add wizard_profile_data Column
**File**: `supabase/migrations/20251202_add_wizard_profile_data.sql`
**Purpose**: Stores temporary user profile data during unauthenticated enrollment wizard
**Impact**: Required for token-based enrollment flow

### 2. Add payment_metadata Column
**File**: `supabase/migrations/20251202_add_payment_metadata_column.sql`
**Purpose**: Stores payment audit trail and metadata
**Impact**: Fixes "Could not find the 'payment_metadata' column" error

### 3. Add 'cancelled' to payment_status
**File**: `supabase/migrations/20251202_add_cancelled_to_payment_status.sql`
**Purpose**: Allows setting payment_status='cancelled' for cancelled enrollments
**Impact**: Fixes "violates check constraint enrollments_payment_status_check" error

### 4. Add cancelled payment status translation
**File**: `supabase/migrations/20251202_add_cancelled_payment_status_translation.sql`
**Purpose**: Adds translation for cancelled payment status in enrollment list
**Impact**: Fixes missing translation for "cancelled" payment status badge

## How to Apply (Supabase Dashboard)

### Step 1: Access SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migration 1 - wizard_profile_data
Copy and paste this SQL:

```sql
-- Add wizard_profile_data column for temporary profile storage
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS wizard_profile_data JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_enrollments_wizard_profile_data
ON enrollments USING GIN (wizard_profile_data);

-- Add comment
COMMENT ON COLUMN enrollments.wizard_profile_data IS 'Temporary storage for user profile data during unauthenticated enrollment wizard. Data is moved to users table when account is created.';
```

Click **Run** and verify success.

### Step 3: Run Migration 2 - payment_metadata
Copy and paste this SQL:

```sql
-- Add payment_metadata column for audit trail
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_metadata
ON enrollments USING GIN (payment_metadata);

-- Add comment
COMMENT ON COLUMN enrollments.payment_metadata IS 'Metadata about payment processing, cancellations, refunds, and audit trail';
```

Click **Run** and verify success.

### Step 4: Run Migration 3 - Add 'cancelled' status
Copy and paste this SQL:

```sql
-- Drop the existing CHECK constraint
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_payment_status_check;

-- Add the new CHECK constraint with 'cancelled' option
ALTER TABLE enrollments
ADD CONSTRAINT enrollments_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled'));

-- Update the column comment
COMMENT ON COLUMN enrollments.payment_status IS 'Payment status: pending, partial, paid, overdue, or cancelled';
```

Click **Run** and verify success.

## Verification

After applying all migrations, run this verification query:

```sql
-- Verify all columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'enrollments'
  AND column_name IN ('wizard_profile_data', 'payment_metadata')
ORDER BY column_name;

-- Verify CHECK constraint
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'enrollments_payment_status_check';

-- Should return:
-- wizard_profile_data | jsonb | YES | '{}'::jsonb
-- payment_metadata    | jsonb | YES | '{}'::jsonb
-- enrollments_payment_status_check | CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled'))
```

Expected results:
- Both columns should show as `jsonb` type with default `'{}'::jsonb`
- CHECK constraint should include 'cancelled' in the list

## Testing After Migration

### Test 1: Create enrollment with metadata
```sql
INSERT INTO enrollments (
  tenant_id,
  user_id,
  product_id,
  total_amount,
  wizard_profile_data,
  payment_metadata
) VALUES (
  'your-tenant-id',
  'your-user-id',
  'your-product-id',
  100.00,
  '{"first_name": "Test", "last_name": "User"}'::jsonb,
  '{"test": true}'::jsonb
) RETURNING id;
```

### Test 2: Cancel enrollment with payment_status
```sql
UPDATE enrollments
SET
  status = 'cancelled',
  payment_status = 'cancelled',  -- This should now work!
  payment_metadata = '{"cancelled_at": "2025-12-02T00:00:00Z"}'::jsonb
WHERE id = 'your-enrollment-id';
```

Both should succeed without errors.

## Rollback Plan

If you need to rollback any migration:

### Rollback Migration 1 (wizard_profile_data)
```sql
DROP INDEX IF EXISTS idx_enrollments_wizard_profile_data;
ALTER TABLE enrollments DROP COLUMN IF EXISTS wizard_profile_data;
```

### Rollback Migration 2 (payment_metadata)
```sql
DROP INDEX IF EXISTS idx_enrollments_payment_metadata;
ALTER TABLE enrollments DROP COLUMN IF EXISTS payment_metadata;
```

### Rollback Migration 3 (cancelled status)
```sql
-- Restore original constraint (without 'cancelled')
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));
```

**WARNING**: Before rolling back migration 3, ensure no enrollments have `payment_status = 'cancelled'` or the constraint addition will fail.

## Troubleshooting

### Error: "column already exists"
This is safe to ignore - the migration uses `IF NOT EXISTS` to prevent this.

### Error: "constraint already exists"
This means the migration was already applied. Verify with the verification queries above.

### Error: "violates check constraint"
If you still see this error after applying migration 3:
1. Verify the constraint was actually updated (run verification query)
2. Check if you're running against the correct database
3. Try refreshing your database connection pool

## Impact Assessment

- **Downtime Required**: No - these are additive changes
- **Data Loss Risk**: None - only adding columns and expanding constraints
- **Performance Impact**: Minimal - GIN indexes are built asynchronously
- **Rollback Safety**: High - can be safely rolled back if needed

## Questions?

If you encounter any issues:
1. Check the verification queries to ensure migrations applied correctly
2. Review error messages carefully - they often indicate which step failed
3. Ensure you have appropriate database permissions (CREATE, ALTER privileges)
