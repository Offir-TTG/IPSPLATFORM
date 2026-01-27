# Stripe Invoice "Locally Paid" Fix - Complete

## Issue Fixed
Stripe invoices that were manually charged by admin still showed "שלם עכשיו" (Pay Now) button instead of "התשלום מעובד" (Payment is being processed).

## Root Cause
The original implementation only matched invoices using `invoice.metadata.payment_schedule_id`, but many Stripe invoices don't have this metadata set. However, payment schedules DO have `stripe_invoice_id` populated, which provides a direct match.

## Solution Implemented

### Enhanced Matching Strategy (Dual Method)

Updated `fetchInvoices` function to use **TWO matching methods**:

#### Method 1: Direct Stripe Invoice ID Match (Primary - More Reliable)
```typescript
const paidSchedulesByStripeInvoice = new Map<string, string>();

paymentSchedules.forEach((schedule: any) => {
  if (schedule.status === 'paid' && schedule.stripe_invoice_id) {
    paidSchedulesByStripeInvoice.set(schedule.stripe_invoice_id, schedule.id);
  }
});
```

Matches: `invoice.id` → `payment_schedule.stripe_invoice_id`

**Example**:
- Invoice ID: `in_1StvIFEMmMuRaOH0yrPvryt0`
- Payment Schedule: Has `stripe_invoice_id = "in_1StvIFEMmMuRaOH0yrPvryt0"`
- **Match found!** ✅

#### Method 2: Metadata Match (Fallback)
```typescript
const paidSchedules = new Set<string>();

paymentSchedules.forEach((schedule: any) => {
  if (schedule.status === 'paid') {
    paidSchedules.add(schedule.id);
  }
});
```

Matches: `invoice.metadata.payment_schedule_id` → `payment_schedule.id`

**Example**:
- Invoice metadata: `{ payment_schedule_id: "216475a7-..." }`
- Payment Schedule ID: `216475a7-...`
- **Match found!** ✅

### Final Enrichment Logic
```typescript
const enrichedInvoices = data.invoices.map((inv: Invoice) => ({
  ...inv,
  locallyPaid: paidSchedulesByStripeInvoice.has(inv.id) ||  // Method 1 (Primary)
    (inv.metadata.payment_schedule_id && paidSchedules.has(inv.metadata.payment_schedule_id))  // Method 2 (Fallback)
}));
```

## Changes Made

### File: `src/app/(user)/profile/page.tsx`

**Lines 554-573** - Updated `fetchInvoices` function:

**Before**:
```typescript
const paidSchedules = new Set<string>();

paymentSchedules.forEach((schedule: any) => {
  if (schedule.status === 'paid') {
    paidSchedules.add(schedule.id);
  }
});

const enrichedInvoices = data.invoices.map((inv: Invoice) => ({
  ...inv,
  locallyPaid: inv.metadata.payment_schedule_id
    ? paidSchedules.has(inv.metadata.payment_schedule_id)
    : false
}));
```

**After**:
```typescript
const paidSchedules = new Set<string>();
const paidSchedulesByStripeInvoice = new Map<string, string>();

paymentSchedules.forEach((schedule: any) => {
  if (schedule.status === 'paid') {
    paidSchedules.add(schedule.id);

    // Map Stripe invoice ID to schedule ID for direct matching
    if (schedule.stripe_invoice_id) {
      paidSchedulesByStripeInvoice.set(schedule.stripe_invoice_id, schedule.id);
    }
  }
});

const enrichedInvoices = data.invoices.map((inv: Invoice) => ({
  ...inv,
  // Mark as locally paid if EITHER:
  // 1. Invoice ID matches a paid schedule's stripe_invoice_id (more reliable)
  // 2. Invoice metadata payment_schedule_id matches a paid schedule ID (fallback)
  locallyPaid: paidSchedulesByStripeInvoice.has(inv.id) ||
    (inv.metadata.payment_schedule_id && paidSchedules.has(inv.metadata.payment_schedule_id))
}));
```

## How It Works

### Scenario: Admin Manually Charges Payment #5

1. **Admin Action**: Admin clicks "Charge Now" in admin panel for Payment #5
2. **Database Update**: `payment_schedules.status` → `'paid'`
3. **User Views Invoices Tab**:
   - Frontend fetches payment schedules (status = 'paid')
   - Creates map: `{ "in_1StvIFEMmMuRaOH0yrPvryt0": "216475a7-..." }`
   - Fetches Stripe invoices
   - Checks if invoice ID exists in map
   - **Match found!** → Sets `invoice.locallyPaid = true`
4. **UI Display**: Shows "התשלום מעובד" instead of "שלם עכשיו"

## Test Case Verification

### Test Case: Payment #5

**Database State**:
- Payment Schedule ID: `216475a7-037d-428b-8e2d-e8d5f8ee4ac6`
- Payment Schedule Status: `paid` ✅
- Payment Schedule Stripe Invoice ID: `in_1StvIFEMmMuRaOH0yrPvryt0` ✅

**Stripe Invoice**:
- Invoice ID: `in_1StvIFEMmMuRaOH0yrPvryt0`
- Invoice metadata: (may or may not have payment_schedule_id)

**Matching Process**:
1. Check Method 1: `paidSchedulesByStripeInvoice.has("in_1StvIFEMmMuRaOH0yrPvryt0")` → **TRUE** ✅
2. Result: `invoice.locallyPaid = true`
3. Display: "התשלום מעובד" (Payment is being processed)

### Before vs After

**Before Fix**:
- ❌ Only checked `invoice.metadata.payment_schedule_id`
- ❌ If metadata missing, always showed "Pay Now"
- ❌ Didn't use `payment_schedule.stripe_invoice_id` field

**After Fix**:
- ✅ Checks BOTH `invoice.id` and `invoice.metadata.payment_schedule_id`
- ✅ Uses `payment_schedule.stripe_invoice_id` for direct matching
- ✅ More reliable, works even if metadata is missing

## Benefits

### 1. More Reliable
- Doesn't depend on Stripe invoice metadata being set correctly
- Uses existing database field (`stripe_invoice_id`) that's populated by the system

### 2. Backwards Compatible
- Still supports metadata-based matching as fallback
- Works with both old and new invoice creation methods

### 3. No Stripe API Calls
- Matches using data already fetched from database
- Fast and efficient

## Files Modified

1. **`src/app/(user)/profile/page.tsx`** - Lines 554-573
   - Added `paidSchedulesByStripeInvoice` Map
   - Updated enrichment logic to use dual matching

2. **`src/context/AppContext.tsx`** - Line 13
   - Bumped translation cache from v20 → v21

3. **`scripts/add-invoice-processing-translation.ts`** - (New)
   - Added "Payment is being processed" translation
   - EN: "Payment is being processed"
   - HE: "התשלום מעובד"

## Testing Instructions

### 1. Hard Refresh Browser
- Press **Ctrl + Shift + R** to clear cache and reload translations

### 2. Navigate to Invoices Tab
1. Go to Profile → Billing
2. Click "Invoices" tab
3. Find invoice for Payment #5

### 3. Verify Display
**Expected**: Should show yellow box with clock icon and text "התשלום מעובד" (Hebrew) or "Payment is being processed" (English)

**NOT Expected**: Should NOT show "שלם עכשיו" (Pay Now) button

### 4. Verify for Other Payments
- Check other manually charged payments
- All paid schedules should show "Processing" message
- Unpaid invoices should still show "Pay Now" button

## Summary

✅ **Dual matching strategy** - Uses BOTH invoice ID and metadata
✅ **More reliable** - Doesn't depend on metadata being set
✅ **Translation added** - "Payment is being processed" in EN and HE
✅ **Cache updated** - Translation cache bumped to v21
✅ **Backwards compatible** - Works with old and new invoices

**Status**: Ready for testing
**Requires**: Hard refresh (Ctrl + Shift + R) on first load

---

**Date**: 2026-01-27
