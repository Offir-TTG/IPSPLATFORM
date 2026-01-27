# Fix Payments RLS Policy - REQUIRED FOR REFUND DISPLAY

## Problem

The `payments` table has RLS policies that block regular users from reading payment records, even their own. This prevents the refund enrichment from working.

**Evidence:**
```
[EnrollmentService] Fetched payments: {
  count: 0,   ← Should be 2
  error: null,
  enrollment_id: 'd352121d-df2e-454c-bb3e-83a82ab82e25',
  tenant_id: '70d86807-7e7c-49cd-8601-98235444e2ac'
}
```

## Solution

Add an RLS policy to allow users to view payments for their own enrollments.

## Steps to Fix

### 1. Go to Supabase Dashboard

Navigate to: **SQL Editor** tab

### 2. Run This SQL

```sql
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Create new policy allowing users to see payments for their enrollments
CREATE POLICY "Users can view their own payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.user_id = auth.uid()
  )
);
```

### 3. Click "Run" to execute the SQL

### 4. Verify the Policy

```sql
-- Check that the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'payments'
  AND policyname = 'Users can view their own payments';
```

You should see one row returned showing the policy exists.

### 5. Test the Fix

1. Refresh the billing page in your browser
2. Check the server console (terminal with npm run dev)
3. Look for this log:
   ```
   [EnrollmentService] Fetched payments: { count: 2, ... }
   [EnrollmentService] Payment for schedule: { schedule_id: '216475a7', refunded_amount: 200, status: 'partially_refunded' }
   ```

4. Check the browser - Payment #5 should now show:
   ```
   $540.83
   Refunded: $200.00  ← Purple text
   ```

## Why This Fix Is Safe

- ✅ Only allows users to view payments for **their own enrollments**
- ✅ Uses `auth.uid()` to ensure security
- ✅ Only grants SELECT permission (read-only)
- ✅ Does not affect admin or other user access
- ✅ Follows principle of least privilege

## What This Enables

After this fix, users will be able to see:
- Refund amounts in their payment history
- Refund dates and reasons
- Updated payment statuses (partially_refunded, refunded)

All in the following locations:
- Profile billing page
- Payment details page
- Stripe invoice section

---

**Status**: ⏳ Waiting for SQL execution in Supabase Dashboard
