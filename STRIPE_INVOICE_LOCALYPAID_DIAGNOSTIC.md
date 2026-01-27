# Stripe Invoice "LocallyPaid" Diagnostic

## Issue
Stripe invoice for Payment #5 shows "שלם עכשיו" (Pay Now) button instead of "התשלום מעובד" (Payment is being processed).

## Expected Behavior
Since Payment #5 has:
- Payment Schedule Status: `paid`
- Payment Schedule ID: `216475a7-037d-428b-8e2d-e8d5f8ee4ac6`
- Stripe Invoice ID: `in_1StvIFEMmMuRaOH0yrPvryt0`

The invoice **SHOULD** show "Payment is being processed" instead of "Pay Now".

## How It Works

### 1. fetchInvoices Logic (Lines 548-583)
```typescript
const fetchInvoices = async () => {
  // 1. Fetch invoices from API
  const response = await fetch('/api/user/invoices');
  const data = await response.json();

  // 2. Create set of PAID payment schedule IDs
  const paidSchedules = new Set<string>();
  paymentSchedules.forEach((schedule: any) => {
    if (schedule.status === 'paid') {
      paidSchedules.add(schedule.id);
    }
  });

  // 3. Enrich invoices with locallyPaid flag
  const enrichedInvoices = data.invoices.map((inv: Invoice) => ({
    ...inv,
    locallyPaid: inv.metadata.payment_schedule_id
      ? paidSchedules.has(inv.metadata.payment_schedule_id)
      : false
  }));

  setInvoices(enrichedInvoices);
};
```

### 2. Display Logic (Lines 1550-1568)
```typescript
{(invoice.status === 'open' || invoice.status === 'overdue') &&
  invoice.hosted_invoice_url && (
    invoice.locallyPaid ? (
      // Show "Payment is being processed"
      <div className="...">
        <Clock className="h-4 w-4 text-yellow-600" />
        <span>{t('invoices.processing', 'Payment is being processed')}</span>
      </div>
    ) : (
      // Show "Pay Now" button
      <Button onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}>
        {t('invoices.actions.pay_now', 'Pay Now')}
      </Button>
    )
  )}
```

## Diagnostic Checklist

### ✅ Database State
- **Payment Schedule Status**: `paid` ✅
- **Payment Schedule ID**: `216475a7-037d-428b-8e2d-e8d5f8ee4ac6` ✅
- **Stripe Invoice ID**: `in_1StvIFEMmMuRaOH0yrPvryt0` ✅

### ❓ Stripe Invoice Metadata
**CRITICAL CHECK**: Does the Stripe invoice contain:
```json
{
  "metadata": {
    "payment_schedule_id": "216475a7-037d-428b-8e2d-e8d5f8ee4ac6"
  }
}
```

**If NO**: This is the root cause. The invoice cannot be matched to the payment schedule.

### ✅ Translation Added
- **Key**: `invoices.processing`
- **EN**: "Payment is being processed"
- **HE**: "התשלום מעובד"
- **Cache Version**: Bumped to 21 ✅

### ❓ Browser Cache
- **Action Required**: Hard refresh with **Ctrl + Shift + R**
- Translation cache needs to reload with new v21

## Root Cause Analysis

There are 3 possible causes:

### 1. Missing Metadata (MOST LIKELY)
**Problem**: Stripe invoice doesn't have `payment_schedule_id` in metadata

**When This Happens**:
- Invoice was created before we added payment_schedule_id tracking
- Invoice was created manually without proper metadata
- Invoice creation code didn't set the metadata

**How to Verify**:
Check the Stripe dashboard or use Stripe API:
```bash
stripe invoices retrieve in_1StvIFEMmMuRaOH0yrPvryt0
```

Look for:
```json
{
  "metadata": {
    "payment_schedule_id": "..."
  }
}
```

**Fix**:
- Update Stripe invoice metadata to include payment_schedule_id
- Ensure future invoices include this metadata on creation

### 2. Browser Cache (POSSIBLE)
**Problem**: Translation cache v20 still loaded, new translation not visible

**Fix**:
- Hard refresh: **Ctrl + Shift + R**
- Clear site data in DevTools

### 3. Logic Error (UNLIKELY)
**Problem**: fetchInvoices or display logic not working

**Status**: Logic verified ✅, should work correctly

## Testing Steps

### Step 1: Check Stripe Invoice Metadata
```bash
# Using Stripe CLI (if available)
stripe invoices retrieve in_1StvIFEMmMuRaOH0yrPvryt0

# OR check Stripe Dashboard:
# 1. Go to https://dashboard.stripe.com/invoices/in_1StvIFEMmMuRaOH0yrPvryt0
# 2. Scroll to "Metadata" section
# 3. Look for "payment_schedule_id" key
```

### Step 2: Hard Refresh Browser
1. Open Profile → Billing → Invoices tab
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. Check if "התשלום מעובד" appears instead of "שלם עכשיו"

### Step 3: Check Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs about invoice enrichment
4. Check if `locallyPaid` flag is being set

### Step 4: Verify API Response
Add console log to check what API returns:
```typescript
// In fetchInvoices, after line 552
console.log('[Profile] Invoices from API:', data.invoices);
console.log('[Profile] Paid schedules:', Array.from(paidSchedules));
console.log('[Profile] Enriched invoices:', enrichedInvoices);
```

## Expected Console Output

If working correctly:
```
[Profile] Paid schedules: ["216475a7-037d-428b-8e2d-e8d5f8ee4ac6", ...]
[Profile] Invoice in_1StvIFEMmMuRaOH0yrPvryt0 metadata: { payment_schedule_id: "216475a7-037d-428b-8e2d-e8d5f8ee4ac6" }
[Profile] Invoice locallyPaid: true
```

If NOT working:
```
[Profile] Paid schedules: ["216475a7-037d-428b-8e2d-e8d5f8ee4ac6", ...]
[Profile] Invoice in_1StvIFEMmMuRaOH0yrPvryt0 metadata: {}  ← MISSING payment_schedule_id
[Profile] Invoice locallyPaid: false
```

## Solution

### If Metadata is Missing:

**Option A: Update Existing Invoice Metadata**
```typescript
// Create script: scripts/fix-invoice-metadata.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

await stripe.invoices.update('in_1StvIFEMmMuRaOH0yrPvryt0', {
  metadata: {
    payment_schedule_id: '216475a7-037d-428b-8e2d-e8d5f8ee4ac6'
  }
});
```

**Option B: Alternative Matching Strategy**
Instead of relying on metadata, match by Stripe invoice ID:
```typescript
// In fetchInvoices:
const paidSchedulesByStripeInvoice = new Map<string, string>();

paymentSchedules.forEach((schedule: any) => {
  if (schedule.status === 'paid' && schedule.stripe_invoice_id) {
    paidSchedulesByStripeInvoice.set(schedule.stripe_invoice_id, schedule.id);
  }
});

const enrichedInvoices = data.invoices.map((inv: Invoice) => ({
  ...inv,
  locallyPaid: paidSchedulesByStripeInvoice.has(inv.id) ||
    (inv.metadata.payment_schedule_id && paidSchedules.has(inv.metadata.payment_schedule_id))
}));
```

This matches by EITHER:
1. Stripe invoice ID → payment schedule stripe_invoice_id ✅
2. Invoice metadata payment_schedule_id → payment schedule ID ✅

## Files Referenced

- `src/app/(user)/profile/page.tsx` - Lines 117, 548-583, 1550-1568
- `src/app/api/user/invoices/route.ts` - Line 184
- `src/context/AppContext.tsx` - Line 13 (cache version)
- `scripts/add-invoice-processing-translation.ts` - Translation script

## Status

- ✅ Translation added
- ✅ Cache version bumped
- ✅ Logic implemented
- ❓ Needs testing to verify metadata presence
- ❓ May need alternative matching strategy

**Next Step**: Check Stripe invoice metadata to confirm root cause.

---

**Date**: 2026-01-27
