# Admin Payment History Refund Display - FIXED

## Issue
The payment history list in the Admin Enrollments page (Registrations tab) was not showing refund amounts when viewing an enrollment's payment plan details.

## Root Cause
The `PaymentPlanDetailsDialog` component had three issues:
1. Was fetching from non-existent API endpoint `/api/admin/payment-schedules`
2. Missing refund fields in the `PaymentSchedule` interface
3. Not displaying refund amounts in the schedule list even if data was present

## Changes Made

### 1. PaymentSchedule Interface Update
**File**: `src/components/admin/PaymentPlanDetailsDialog.tsx` (lines 11-20)

Added refund fields to the interface:
```typescript
interface PaymentSchedule {
  id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partially_refunded';
  paid_date?: string;
  sequence_number: number;
  refunded_amount?: number;      // NEW
  refunded_at?: string;           // NEW
  refund_reason?: string;         // NEW
  payment_status?: string;        // NEW
}
```

### 2. API Endpoint Fix
**File**: `src/components/admin/PaymentPlanDetailsDialog.tsx` (lines 79-109)

Changed from non-existent `/api/admin/payment-schedules` to existing `/api/enrollments/{id}/payment`:

**Before**:
```typescript
const response = await fetch(`/api/admin/payment-schedules?enrollment_id=${enrollment.id}`);
if (response.ok) {
  const data = await response.json();
  setPaymentSchedules(data.data || []);
}
```

**After**:
```typescript
const response = await fetch(`/api/enrollments/${enrollment.id}/payment`);
if (response.ok) {
  const data = await response.json();
  // Map schedules with refund data
  const mappedSchedules = (data.schedules || []).map((schedule: any, index: number) => ({
    id: schedule.id,
    amount: parseFloat(schedule.amount),
    due_date: schedule.scheduled_date,
    status: schedule.payment_status === 'partially_refunded' ? 'partially_refunded' : schedule.status,
    paid_date: schedule.paid_date,
    sequence_number: schedule.payment_number || index + 1,
    refunded_amount: schedule.refunded_amount,
    refunded_at: schedule.refunded_at,
    refund_reason: schedule.refund_reason,
    payment_status: schedule.payment_status,
  }));
  setPaymentSchedules(mappedSchedules);
}
```

**Why this works**: The `/api/enrollments/{id}/payment` endpoint already returns enriched schedule data with refund information (added in previous fix for user UI).

### 3. Display Update
**File**: `src/components/admin/PaymentPlanDetailsDialog.tsx` (lines 981-1006)

Updated schedule display to show refund amounts:

**Before**:
```typescript
<div className="flex items-center gap-2">
  <span className="font-semibold text-sm whitespace-nowrap">
    {formatCurrency(payment.amount, enrollment.currency)}
  </span>
  {actualSchedule && (
    <Badge variant={...}>
      {t(`admin.enrollments.paymentPlanDetails.status.${actualSchedule.status}`, ...)}
    </Badge>
  )}
</div>
```

**After**:
```typescript
<div className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-2">
    <span className="font-semibold text-sm whitespace-nowrap">
      {formatCurrency(payment.amount, enrollment.currency)}
    </span>
    {actualSchedule && (
      <Badge variant={
        actualSchedule.status === 'partially_refunded' ? 'secondary' :
        actualSchedule.status === 'refunded' ? 'outline' : ...
      }>
        {actualSchedule.status === 'partially_refunded'
          ? t('admin.enrollments.paymentPlanDetails.status.partially_refunded', 'Partially Refunded')
          : actualSchedule.status === 'refunded'
          ? t('admin.enrollments.paymentPlanDetails.status.refunded', 'Refunded')
          : t(`admin.enrollments.paymentPlanDetails.status.${actualSchedule.status}`, actualSchedule.status)}
      </Badge>
    )}
  </div>
  {actualSchedule?.refunded_amount && actualSchedule.refunded_amount > 0 && (
    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">
      {t('admin.enrollments.paymentPlanDetails.refunded', 'Refunded')}: {formatCurrency(actualSchedule.refunded_amount, enrollment.currency)}
    </span>
  )}
</div>
```

### 4. Translations Added

Added Hebrew translations for admin context:

| Translation Key | English | Hebrew |
|----------------|---------|--------|
| `admin.enrollments.paymentPlanDetails.status.partially_refunded` | Partially Refunded | הוחזר חלקית |
| `admin.enrollments.paymentPlanDetails.status.refunded` | Refunded | הוחזר |
| `admin.enrollments.paymentPlanDetails.refunded` | Refunded | הוחזר |

### 5. Translation Cache Version Bump
**File**: `src/context/AppContext.tsx` (line 13)

Changed `TRANSLATION_CACHE_VERSION` from 15 → 16 to force client cache refresh.

## How It Works Now

### Data Flow:
1. **Admin clicks on payment plan** in enrollment card → Opens PaymentPlanDetailsDialog
2. **Dialog fetches data** from `/api/enrollments/{id}/payment`
3. **API returns enriched schedules** with refund data from payments table (via enrollmentService.ts)
4. **Dialog displays schedules** with:
   - Original payment amount
   - Refund status badge (if partially_refunded or refunded)
   - Refund amount in purple text below payment amount

### Example Display:

For a partial refund of $200 out of $540.83:

```
Payment #5 - Installment
Due: June 24, 2026

$540.83
Refunded: $200.00        ← In purple text

[Partially Refunded]     ← Status badge
```

## Testing Steps

1. **Navigate to Admin Enrollments** (`/admin/enrollments`)
2. **Find enrollment with refunds** (e.g., enrollment d352121d-df2e-454c-bb3e-83a82ab82e25)
3. **Click on payment plan badge** in enrollment card
4. **Verify in payment schedule list**:
   - ✅ Refund status badge shows "Partially Refunded" or "Refunded"
   - ✅ Refund amount displays in purple text below payment amount
   - ✅ Hebrew translation displays when language is Hebrew
5. **Hard refresh** (Ctrl+Shift+R) if not showing

## Files Modified

1. `src/components/admin/PaymentPlanDetailsDialog.tsx` - Main dialog component
2. `src/context/AppContext.tsx` - Translation cache version bump
3. `scripts/add-admin-payment-refund-translations.ts` - Translation script (created)

## Status: ✅ COMPLETE

Admin payment history now displays refund information correctly in both English and Hebrew.

**Related**: This completes the refund display feature across all UI locations:
- ✅ User profile billing page
- ✅ User payment details page
- ✅ Admin enrollments payment history (this fix)
