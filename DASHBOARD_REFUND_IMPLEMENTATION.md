# Dashboard Payment Summary - Refund Implementation

## Summary

Added refund display to the user dashboard Payment Summary component to show total refunded amounts across all enrollments.

## Changes Made

### 1. Updated API Endpoint - `/api/enrollments` (route.ts:196-217)

**File**: `src/app/api/enrollments/route.ts`

**Before**:
- Only fetched `amount` field from payment_schedules
- Only returned `paid_amount` in enrollment data
- No refund information included

**After**:
- Fetches `id, amount, status, refunded_amount` from payment_schedules
- Returns full `payment_schedules` array with each enrollment
- Allows frontend to calculate refunds

**Key Changes**:
```typescript
// Get all payment schedules for this enrollment (including refund data)
const { data: paymentSchedules } = await supabase
  .from('payment_schedules')
  .select('id, amount, status, refunded_amount')
  .eq('enrollment_id', enrollment.id);

// Return enrollment with payment_schedules array
return {
  ...enrollment,
  paid_amount: calculatedPaidAmount,
  payment_schedules: paymentSchedules || [],
};
```

### 2. Updated PaymentSummary Component

**File**: `src/components/user/dashboard/PaymentSummary.tsx`

#### Changes:

1. **Interface Update** (Line 27)
   - Added `refunded_amount?: number` to Enrollment interface

2. **Fetch Logic** (Lines 46-60)
   - Calculate `refundedAmount` from `payment_schedules` array
   - Sum up all `refunded_amount` values from schedules
   - Include in enrollment data

3. **Totals Calculation** (Lines 72-76)
   - Added `totalRefunded` calculation
   - Added `netPaid` calculation (totalPaid - totalRefunded)

4. **Grid Layout** (Line 112)
   - Changed from 3-column to responsive 4-column grid:
     - Mobile: 1 column
     - Medium (md): 2 columns
     - Large (lg): 4 columns

5. **New Refund Card** (Lines 176-192)
   - Purple gradient styling (consistent with refund theme)
   - Shows total refunded amount
   - Displays net paid as supplementary info
   - Only visible when `totalRefunded > 0`
   - Uses `TrendingDown` icon

6. **Updated Progress Bar** (Lines 195-220)
   - Calculates percentage using `netPaid` instead of `totalPaid`
   - Formula: `(netPaid / totalAmount) * 100%`
   - Added refund note below progress bar when refunds exist
   - Shows: "Includes X in refunds"

### 3. Hebrew Translations

**Script**: `scripts/add-dashboard-refund-translations.ts`

Added 4 new translation keys:

| Key | English | Hebrew |
|-----|---------|--------|
| `user.dashboard.payment.totalRefunded` | Total Refunded | סה"כ הוחזר |
| `user.dashboard.payment.netPaid` | Net paid | נטו ששולם |
| `user.dashboard.payment.refundedNote` | Includes | כולל |
| `user.dashboard.payment.refundedText` | in refunds | בהחזרים |

**Translation Cache**: Bumped version to 28 in `src/context/AppContext.tsx`

## UI Behavior

### With Refunds (totalRefunded > 0):

**Grid displays 4 cards**:
1. **Total Paid** (Green) - Gross amount paid
2. **Outstanding** (Amber/Green) - Amount still owed
3. **Total Value** (Blue) - Total enrollment value
4. **Total Refunded** (Purple) - Total refunds with net paid amount

**Progress Bar**:
- Shows net payment percentage (after refunds)
- Displays refund note: "Includes $X in refunds"

### Without Refunds (totalRefunded = 0):

**Grid displays 3 cards**:
1. **Total Paid** (Green)
2. **Outstanding** (Amber/Green)
3. **Total Value** (Blue)

**Progress Bar**:
- Shows payment percentage
- No refund note

## Testing

### Test Scenario 1: User with Refunds
1. Login as user with refunded payments
2. Go to Dashboard
3. **Verify**: Payment Summary shows 4 cards including purple "Total Refunded" card
4. **Verify**: Progress bar shows accurate net percentage
5. **Verify**: Refund note appears below progress bar
6. **Verify**: Hebrew translations display correctly in RTL

### Test Scenario 2: User without Refunds
1. Login as user with no refunds
2. Go to Dashboard
3. **Verify**: Payment Summary shows 3 cards (no refund card)
4. **Verify**: Progress bar shows normal percentage
5. **Verify**: No refund note below progress bar

### Test Scenario 3: Partial Refund
1. Admin creates partial refund for a payment
2. User refreshes dashboard
3. **Verify**: Refund card appears with correct amount
4. **Verify**: Net paid shows correct calculation (paid - refunded)
5. **Verify**: Progress bar adjusts to show net percentage

## Data Flow

```
User Dashboard
    ↓
PaymentSummary Component
    ↓
GET /api/enrollments
    ↓
Supabase: enrollments table
Supabase: payment_schedules table (with refunded_amount)
    ↓
Response includes payment_schedules array
    ↓
Component calculates:
- totalRefunded (sum of all refunded_amount)
- netPaid (totalPaid - totalRefunded)
    ↓
UI displays:
- Refund card (if refunds exist)
- Updated progress bar (based on net paid)
```

## Consistency with Rest of App

The refund display uses the same purple color theme used throughout the application for refunds:

- **Enrollment Cards**: Purple "Total Refunded" text
- **Profile Page**: Purple refund amounts
- **Payment History**: Purple refund column
- **PDF Exports**: Refund sections
- **Stripe Invoices**: Purple refund amounts
- **Dashboard Summary**: Purple refund card ← NEW

This maintains visual consistency and makes refunds easily recognizable across the entire platform.

## Files Modified

1. `src/app/api/enrollments/route.ts` - Added payment_schedules with refund data to response
2. `src/components/user/dashboard/PaymentSummary.tsx` - Added refund calculations and display
3. `src/context/AppContext.tsx` - Bumped translation cache version to 28
4. `scripts/add-dashboard-refund-translations.ts` - Created and executed (NEW FILE)

## Migration Notes

- **No database changes required** - Uses existing `refunded_amount` field in `payment_schedules`
- **Backward compatible** - Refund card only shows when refunds exist
- **Translation updates** - May require browser refresh to see Hebrew translations
- **Cache invalidation** - Translation cache version bumped to force fresh translations

---

**Date**: 2026-01-27
**Status**: ✅ Complete
