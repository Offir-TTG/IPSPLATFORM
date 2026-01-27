# Revenue Stats Fix Summary

## Problem
- Total Revenue was showing incorrect values (was using payment_schedules instead of enrollments)
- Refunds were showing $0 (calculation logic was correct but needed verification)

## Solution Applied

Updated `src/app/api/admin/payments/reports/stats/route.ts`:

1. **Total Revenue**: Now calculated from `enrollments.total_amount` (expected revenue)
2. **Total Paid**: Calculated from actual `payments` table
3. **Refunds**: Calculated from `payments.refunded_amount`
4. **Net Revenue**: Calculated as Total Paid - Refunds

## Expected Results

Based on current database data:

- **Total Revenue**: $7,490.00 (from 2 active enrollments)
- **Refunds**: -$200.00 (1 partially refunded payment)
- **Net Revenue**: $1,340.83 (paid $1,540.83 minus refunds $200)
- **Pending Payments**: $4,326.68 (5 pending payment schedules)

## To Verify the Fix

### Option 1: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Option 2: Hard Refresh Browser
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Option 3: Check API Response Directly
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/admin/payments` page
4. Find the request to `/api/admin/payments/reports/stats`
5. Check the response JSON - it should show:
   - totalRevenue: 7490
   - totalRefunds: 200  
   - netRevenue: 1340.83

## Database Data Verified

### Enrollments (2 total)
1. Enrollment 1: Total=$0, Paid=$0, Status=paid
2. Enrollment 2: Total=$7490, Paid=$2622.49, Status=partial
- **Total Revenue (active)**: $7,490

### Payments (2 total)
1. Payment 1: $1000, Status=paid, Refunded=$0
2. Payment 2: $540.83, Status=partially_refunded, Refunded=$200
- **Total Paid**: $1,540.83
- **Total Refunded**: $200
- **Net**: $1,340.83

### Payment Schedules (10 total)
- Paid: 5 schedules totaling $3,163.32
- Pending: 5 schedules totaling $4,326.68

## Hebrew Translations

All required translation keys exist in database:
- ✓ admin.payments.totalRevenue → "סה\"כ הכנסות" (he) / "Total Revenue" (en)
- ✓ admin.payments.grossRevenue → "הכנסה ברוטו" (he) / "Gross revenue" (en)
- ✓ admin.payments.netRevenue → "הכנסה נטו" (he) / "Net Revenue" (en)
- ✓ admin.payments.refunds → "החזרים" (he) / "Refunds" (en)
- ✓ admin.payments.totalRefunded → "סה\"כ הוחזר" (he) / "Total refunded" (en)

## Files Modified

1. `src/app/api/admin/payments/reports/stats/route.ts` - Revenue calculation logic
2. `src/app/admin/payments/page.tsx` - Dashboard layout (already updated)
3. `scripts/add-revenue-stats-translations.ts` - Translation script (already run)
