# Enrollment System Fixes

## Issues Fixed

The enrollment page had the following issues:
1. **Payment Plan showing as "N/A"** - No payment plan data was being retrieved
2. **Amount showing as Zero** - Total and paid amounts were hardcoded to 0
3. **Payment Status always "pending"** - Status was hardcoded
4. **Missing enrollment status** - Status values like active, pending, completed, cancelled were not showing

## Root Cause

The enrollment system was using the old `user_programs` table which was designed for the LMS system, not for the new product/payment system. It didn't have fields for:
- Product linking
- Payment plans
- Payment amounts
- Payment status
- Enrollment status

## Solution

### 1. Created New `enrollments` Table

**Location**: `supabase/migrations/20251127_create_enrollments_table.sql`
**Or run**: `supabase/SQL Scripts/RUN_THIS_CREATE_ENROLLMENTS.sql`

**New fields**:
- `product_id` - Links to the product table
- `payment_plan_id` - Links to payment plans (optional)
- `total_amount` - Total price of the product
- `paid_amount` - Amount paid so far
- `currency` - Currency (USD, ILS, EUR, etc.)
- `status` - Enrollment status: `active`, `pending_payment`, `cancelled`, `completed`
- `payment_status` - Payment status: `pending`, `partial`, `paid`, `overdue`
- `next_payment_date` - Date of next payment
- `enrollment_type` - `admin_assigned` or `self_enrolled`
- `created_by` - Admin who created the enrollment

### 2. Updated Enrollments API

**Location**: `src/app/api/admin/enrollments/route.ts`

**Changes**:
- **GET endpoint**: Now queries `enrollments` table instead of `user_programs`
- Joins with `products`, `payment_plans`, `programs`, `courses`, and `users` tables
- Returns actual payment data, status, and amounts
- Supports filtering by status and payment status
- Supports search across user name, email, and product name

**POST endpoint**: Creates enrollments in new table
- Automatically calculates `total_amount` from product price
- Sets `payment_status` to `paid` for free products
- Prevents duplicate enrollments
- Links to payment plans if provided

## How to Apply

### Step 1: Run the Migration

Go to your Supabase SQL Editor and run:
```sql
supabase/SQL Scripts/RUN_THIS_CREATE_ENROLLMENTS.sql
```

This will create the `enrollments` table with all necessary fields, indexes, and RLS policies.

### Step 2: Test the Changes

1. **Create a new enrollment**:
   - Go to Admin > Enrollments
   - Click "Create Enrollment"
   - Select a user and a product
   - The enrollment will be created with:
     - Proper payment plan (if the product uses one)
     - Correct total amount from product price
     - Payment status based on whether it's free or paid
     - Enrollment status

2. **View enrollments**:
   - Payment Plan column will show the plan name or "N/A" if not using a plan
   - Amount will show: "$X / $Y" (paid / total)
   - Payment Status will show proper icons and badges:
     - ✓ Paid (green)
     - ⏱ Pending (gray)
     - ⏱ Partial (yellow)
     - ⚠ Overdue (red)
   - Status will show: Active, Pending Payment, Cancelled, or Completed

## Database Schema

### Enrollments Table Structure

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  payment_plan_id UUID,

  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',

  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  next_payment_date TIMESTAMPTZ,

  enrollment_type TEXT DEFAULT 'self_enrolled',
  created_by UUID,

  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, product_id, tenant_id)
);
```

## API Response Format

### GET /api/admin/enrollments

Returns:
```json
{
  "enrollments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "product_id": "uuid",
      "product_name": "Advanced Programming Course",
      "product_type": "course",
      "payment_plan_id": "uuid",
      "payment_plan_name": "6 Monthly Installments",
      "total_amount": 1200,
      "paid_amount": 400,
      "currency": "USD",
      "payment_status": "partial",
      "status": "active",
      "next_payment_date": "2025-12-01T00:00:00Z",
      "created_at": "2025-11-27T10:00:00Z"
    }
  ]
}
```

## Payment Status Logic

The `payment_status` field is automatically calculated:

- **pending**: `paid_amount === 0` and not overdue
- **partial**: `0 < paid_amount < total_amount`
- **paid**: `paid_amount >= total_amount`
- **overdue**: Payment is past due date

## Enrollment Status Logic

The `status` field represents the enrollment lifecycle:

- **pending_payment**: User enrolled but hasn't paid yet
- **active**: User is enrolled and payment is on track
- **cancelled**: Enrollment was cancelled
- **completed**: User completed the program/course

## Next Steps

After running the migration, the enrollment page will:
1. ✅ Show actual payment plan names
2. ✅ Display correct amounts (paid/total)
3. ✅ Show proper payment status with icons
4. ✅ Display enrollment status (Active, Pending, etc.)
5. ✅ Support filtering by status and payment status
6. ✅ Support searching by user/product name

## Notes

- The old `user_programs` table is still in place for backward compatibility
- New enrollments should use the `enrollments` table
- You may want to migrate existing `user_programs` data to `enrollments` in the future
- Payment schedules integration is ready (references `enrollment_id`)
