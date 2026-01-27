# Fix: Payments Status Constraint Error

## Problem

When trying to update a payment to `partially_refunded` status, you get this error:

```
ERROR: 23514: new row for relation "payments" violates check constraint "payments_status_check"
```

OR when trying to add the constraint, you get:

```
ERROR: 23514: check constraint "payments_status_check" of relation "payments" is violated by some row
```

## Root Causes

1. The `payments` table constraint was missing `partially_refunded` status
2. Old webhook code was setting payments to `'succeeded'` instead of `'paid'`
3. Existing payments had `'succeeded'` status which violated the constraint

## Solution Applied

### Code Changes
✅ **Updated webhook handler** ([webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts))
- Changed `status: 'succeeded'` → `status: 'paid'` (2 locations)
- Now consistent with the rest of the application

### Database Migration

Run the migration to:
1. **Normalize existing data**: Convert `'succeeded'` → `'paid'`
2. **Add proper constraint**: Include all 5 valid status values

#### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of these files **in order**:
   - `supabase/migrations/20260126_fix_payments_status_constraint.sql`
   - `supabase/migrations/20260126_fix_payment_schedules_status_constraint.sql`
4. Click **Run** for each one

#### Option 2: Run SQL Directly

Connect to your database and run:

```sql
-- Fix payments table
UPDATE payments SET status = 'paid' WHERE status = 'succeeded';

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- Fix payment_schedules table
ALTER TABLE payment_schedules DROP CONSTRAINT IF EXISTS payment_schedules_status_check;
ALTER TABLE payment_schedules ADD CONSTRAINT payment_schedules_status_constraint
  CHECK (status IN ('pending', 'paid', 'failed', 'overdue', 'refunded', 'cancelled'));
```

## Verification

After running the migration, verify it worked:

```sql
-- Check constraint exists
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
  AND conname = 'payments_status_check';

-- Check no 'succeeded' statuses remain
SELECT COUNT(*) FROM payments WHERE status = 'succeeded';
-- Should return 0

-- Test partially_refunded status
UPDATE payments
SET status = 'partially_refunded'
WHERE id = '2f4e2318-0de5-44cd-ada0-6a1d53501bbd';
-- Should work without errors!
```

## Final Status Values

### Payments Table
- ✅ `pending` - Payment not yet processed
- ✅ `paid` - Payment completed successfully
- ✅ `failed` - Payment failed
- ✅ `refunded` - Fully refunded
- ✅ `partially_refunded` - Partially refunded **(NEW)**

### Payment Schedules Table
- ✅ `pending` - Not yet due
- ✅ `paid` - Paid on time
- ✅ `failed` - Payment failed
- ✅ `overdue` - Past due date
- ✅ `refunded` - Refunded
- ✅ `cancelled` - Cancelled

## What Changed

| Before | After |
|--------|-------|
| Webhook used `'succeeded'` | Webhook uses `'paid'` |
| No constraint existed | Constraint with 5 values |
| 1 payment had `'succeeded'` status | All normalized to `'paid'` |
| `partially_refunded` not allowed | `partially_refunded` fully supported |
