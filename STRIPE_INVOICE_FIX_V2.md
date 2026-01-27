# Stripe Invoice "Pay Now" Button Fix V2 - Race Condition Fix

## Issue
After implementing the dual matching strategy, the "Pay Now" button was still showing instead of "Payment is being processed".

## Root Cause: Race Condition
The `fetchEnrollments()` and `fetchInvoices()` functions were being called in parallel:

```typescript
useEffect(() => {
  if (activeTab === 'billing') {
    if (enrollments.length === 0) {
      fetchEnrollments();  // ← Async, takes time
    }
    if (invoices.length === 0) {
      fetchInvoices();  // ← Called immediately, but needs paymentSchedules!
    }
  }
}, [activeTab, enrollments.length, invoices.length]);
```

**Problem**: `fetchInvoices` tries to use `paymentSchedules` state, but `fetchEnrollments` (which sets `paymentSchedules`) is still running.

**Result**: The enrichment logic runs with an empty `paymentSchedules` array, so no invoices are matched as locally paid.

## Fix Implemented

### 1. Sequential Execution
Made the calls sequential so enrollments (and payment schedules) load BEFORE invoices:

```typescript
useEffect(() => {
  if (activeTab === 'billing') {
    const loadBillingData = async () => {
      // Fetch enrollments first (this populates paymentSchedules)
      if (enrollments.length === 0) {
        await fetchEnrollments();  // ← WAIT for this to complete
      }
      // Then fetch invoices (this needs paymentSchedules for enrichment)
      if (invoices.length === 0) {
        fetchInvoices();  // ← Now paymentSchedules is populated!
      }
    };
    loadBillingData();
  }
}, [activeTab, enrollments.length, invoices.length]);
```

### 2. Added Comprehensive Debugging
Added console logs to help diagnose issues:

```typescript
console.log('[Profile] fetchInvoices - Starting invoice enrichment');
console.log('[Profile] Payment schedules available:', paymentSchedules.length);
console.log('[Profile] Paid schedules count:', paidSchedules.size);
console.log('[Profile] Paid schedules by Stripe invoice ID:', Array.from(paidSchedulesByStripeInvoice.keys()));

// For each invoice:
console.log('[Profile] Invoice:', inv.id, {
  status: inv.status,
  matchedByInvoiceId,  // true if matched by stripe_invoice_id
  matchedByMetadata,   // true if matched by metadata
  locallyPaid,         // final result
  metadata: inv.metadata
});
```

## How It Works Now

### Timeline:
1. **User switches to Billing tab**
2. **fetchEnrollments() runs**:
   - Fetches enrollments from API
   - Extracts payment schedules
   - Sets `paymentSchedules` state (includes stripe_invoice_id field)
   - **Completes** (async await)
3. **fetchInvoices() runs**:
   - Fetches invoices from Stripe API
   - Creates map: `{ "in_1StvIFEMmMuRaOH0yrPvryt0": "216475a7-..." }`
   - For each invoice, checks if invoice.id matches a paid schedule's stripe_invoice_id
   - Sets `locallyPaid: true` if matched
4. **UI renders**:
   - If `invoice.locallyPaid === true`, shows "התשלום מעובד"
   - If `invoice.locallyPaid === false`, shows "שלם עכשיו"

## Changes Made

### File: `src/app/(user)/profile/page.tsx`

#### Change 1: Sequential Loading (Lines 415-428)
**Before**:
```typescript
useEffect(() => {
  if (activeTab === 'billing') {
    if (enrollments.length === 0) {
      fetchEnrollments();
    }
    if (invoices.length === 0) {
      fetchInvoices();
    }
  }
}, [activeTab, enrollments.length, invoices.length]);
```

**After**:
```typescript
useEffect(() => {
  if (activeTab === 'billing') {
    const loadBillingData = async () => {
      if (enrollments.length === 0) {
        await fetchEnrollments();
      }
      if (invoices.length === 0) {
        fetchInvoices();
      }
    };
    loadBillingData();
  }
}, [activeTab, enrollments.length, invoices.length]);
```

#### Change 2: Added Debugging (Lines 554-597)
Added console.log statements throughout the enrichment process to help diagnose issues.

## Testing Instructions

### Step 1: Clear Browser Cache
1. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
2. Or open DevTools → Application → Clear Storage → Clear site data

### Step 2: Open DevTools Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Clear any existing logs

### Step 3: Navigate to Billing Tab
1. Go to Profile page
2. Click **Billing** tab
3. Click **Invoices** sub-tab

### Step 4: Check Console Logs
You should see logs like:
```
[Profile] fetchInvoices - Starting invoice enrichment
[Profile] Payment schedules available: 5
[Profile] Paid schedules count: 4
[Profile] Paid schedules by Stripe invoice ID: ["in_1StvIFEMmMuRaOH0yrPvryt0", ...]
[Profile] Invoice: in_1StvIFEMmMuRaOH0yrPvryt0 {
  status: "open",
  matchedByInvoiceId: true,  ← Should be TRUE
  matchedByMetadata: false,
  locallyPaid: true,          ← Should be TRUE
  metadata: {}
}
```

**Expected Values for Payment #5 Invoice:**
- `matchedByInvoiceId`: **true** ✅
- `locallyPaid`: **true** ✅
- UI: Should show "התשלום מעובד" (Payment is being processed)

**If NOT Working:**
- `matchedByInvoiceId`: **false** ❌
- Check: Is `stripe_invoice_id` populated in payment_schedules table?
- Check: Does the Stripe invoice ID match?

### Step 5: Verify UI
1. Find the invoice for Payment #5 ($540.83)
2. **Expected**: Yellow box with clock icon and "התשלום מעובד" text
3. **NOT Expected**: "שלם עכשיו" (Pay Now) button

## Diagnostic Checklist

If still showing "Pay Now" after this fix, check console logs:

### ✅ Payment schedules loaded?
```
[Profile] Payment schedules available: 5  ← Should be > 0
```
If 0, enrollments didn't load or didn't include payment schedules.

### ✅ Paid schedules found?
```
[Profile] Paid schedules count: 4  ← Should be > 0
```
If 0, no payment schedules have status 'paid'.

### ✅ Stripe invoice IDs mapped?
```
[Profile] Paid schedules by Stripe invoice ID: ["in_1StvIFEMmMuRaOH0yrPvryt0", ...]
```
Should include the invoice ID for Payment #5.

### ✅ Invoice matched?
```
matchedByInvoiceId: true  ← Should be true
locallyPaid: true          ← Should be true
```

## Troubleshooting

### Problem: Payment schedules available: 0
**Cause**: Enrollments not loaded or don't have payment schedules

**Fix**: Check that `fetchEnrollments` is setting `paymentSchedules` state

### Problem: matchedByInvoiceId: false
**Cause**: `payment_schedule.stripe_invoice_id` doesn't match invoice ID

**Fix**: Check database - does payment schedule have correct stripe_invoice_id?
```sql
SELECT id, payment_number, status, stripe_invoice_id
FROM payment_schedules
WHERE payment_number = 5 AND amount = 540.83;
```

### Problem: Paid schedules count: 0
**Cause**: No payment schedules with status 'paid'

**Fix**: Check database - is payment #5 marked as paid?
```sql
SELECT * FROM payment_schedules WHERE id = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';
```

## Summary

✅ **Fixed race condition** - Enrollments load before invoices
✅ **Added debugging** - Console logs show enrichment process
✅ **Sequential execution** - await fetchEnrollments before fetchInvoices
✅ **Dual matching preserved** - Still uses both invoice ID and metadata

**Status**: Ready for testing
**Requires**: Hard refresh (Ctrl + Shift + R)
**Check**: Console logs in DevTools

---

**Date**: 2026-01-27
