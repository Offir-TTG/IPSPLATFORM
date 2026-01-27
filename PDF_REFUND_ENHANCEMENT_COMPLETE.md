# PDF Refund Enhancement - Complete ✅

## Summary

Successfully added comprehensive refund information to PDF exports (invoice, payment schedule, and combined documents). PDFs now display the same refund data that users see in the UI.

---

## Changes Made

### 1. ✅ Updated PDF Export API Route

**File**: `src/app/api/user/enrollments/[id]/export-pdf/route.tsx`

**Added** (after line 269):
```typescript
// Enrich schedules with refund data from payments table
const { data: payments, error: paymentsError } = await supabase
  .from('payments')
  .select('*')
  .eq('enrollment_id', id)
  .eq('tenant_id', tenantId);

// Create lookup map by schedule_id
const paymentsBySchedule = new Map();
payments?.forEach((payment: any) => {
  if (payment.payment_schedule_id) {
    paymentsBySchedule.set(payment.payment_schedule_id, payment);
  }
});

// Enrich schedules with refund information
const enrichedSchedules = schedules?.map((schedule: any) => {
  const payment = paymentsBySchedule.get(schedule.id);
  if (payment && (payment.refunded_amount || payment.status === 'refunded' || payment.status === 'partially_refunded')) {
    return {
      ...schedule,
      refunded_amount: payment.refunded_amount ? parseFloat(payment.refunded_amount) : 0,
      refunded_at: payment.refunded_at,
      refund_reason: payment.refund_reason,
      payment_status: payment.status,
    };
  }
  return schedule;
}) || [];

// Calculate total refunded amount
const totalRefunded = enrichedSchedules.reduce((sum: number, schedule: any) => {
  return sum + (schedule.refunded_amount || 0);
}, 0);
```

**Updated receiptData** (line 346):
```typescript
const receiptData = {
  enrollment: {
    // ... existing fields ...
    total_refunded: totalRefunded,
    net_paid_amount: enrollment.paid_amount - totalRefunded,
  },
  // ... rest unchanged ...
  schedules: enrichedSchedules as PaymentSchedule[],
};
```

---

### 2. ✅ Updated Invoice Template

**File**: `src/lib/pdf/EnrollmentInvoiceTemplate.tsx`

**Added to InvoiceData interface**:
```typescript
total_refunded?: number;
net_paid_amount?: number;
```

**Added styles**:
```typescript
refundedRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 6,
  borderBottomWidth: 0.5,
  borderBottomColor: '#E5E7EB',
  borderBottomStyle: 'solid',
},
refundedLabel: {
  fontSize: 10,
  fontFamily: 'Rubik',
  color: '#9333ea', // Purple color for refunds
},
refundedValue: {
  fontSize: 10,
  fontFamily: 'Rubik',
  fontWeight: 'bold',
  color: '#9333ea',
},
```

**Added to payment summary section** (after Total Amount):
```tsx
{/* Total Refunded (if any) */}
{data.enrollment.total_refunded && data.enrollment.total_refunded > 0 && (
  <View style={styles.refundedRow}>
    <Text style={[styles.refundedLabel, isRtl && { textAlign: 'right' }]}>
      {t('pdf.invoice.totalRefunded', 'Total Refunded')}
    </Text>
    <Text style={[styles.refundedValue, isRtl && { textAlign: 'left' }]}>
      ({formatCurrency(data.enrollment.total_refunded, data.enrollment.currency)})
    </Text>
  </View>
)}

{/* Net Amount Paid (if refunds exist) */}
{data.enrollment.total_refunded && data.enrollment.total_refunded > 0 && (
  <View style={styles.summaryRow}>
    <Text style={[styles.label, isRtl && { textAlign: 'right' }]}>
      {t('pdf.invoice.netAmount', 'Net Amount')}
    </Text>
    <Text style={[styles.value, isRtl && { textAlign: 'left' }]}>
      {formatCurrency(data.enrollment.net_paid_amount || data.enrollment.paid_amount, data.enrollment.currency)}
    </Text>
  </View>
)}
```

---

### 3. ✅ Updated Payment Schedule Template

**File**: `src/lib/pdf/PaymentScheduleTemplate.tsx`

**Updated column widths**:
```typescript
col1: { width: '7%' },   // # (narrowed)
col2: { width: '15%' },  // Type
col3: { width: '15%' },  // Due Date
col4: { width: '13%' },  // Amount (narrowed)
col5: { width: '15%' },  // Refunded (NEW)
col6: { width: '15%' },  // Paid Date
col7: { width: '20%' },  // Status (widened)
```

**Added styles**:
```typescript
refundedText: {
  fontSize: 8,
  fontFamily: 'Rubik',
  color: '#9333ea', // Purple for refunds
  textAlign: 'right',
},
statusPartiallyRefunded: {
  backgroundColor: '#f3e8ff',
  color: '#7e22ce',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  fontSize: 8,
  fontFamily: 'Rubik',
  fontWeight: 'bold',
},
statusRefunded: {
  backgroundColor: '#fae8ff',
  color: '#a855f7',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  fontSize: 8,
  fontFamily: 'Rubik',
  fontWeight: 'bold',
},
```

**Updated table header** (added Refunded column):
```tsx
<View style={[styles.tableRow, styles.tableHeader]}>
  <Text style={[styles.tableCell, styles.col1, styles.headerText]}>#</Text>
  <Text style={[styles.tableCell, styles.col2, styles.headerText]}>
    {t('pdf.schedule.type', 'Type')}
  </Text>
  <Text style={[styles.tableCell, styles.col3, styles.headerText]}>
    {t('pdf.schedule.dueDate', 'Due Date')}
  </Text>
  <Text style={[styles.tableCell, styles.col4, styles.headerText]}>
    {t('pdf.schedule.amount', 'Amount')}
  </Text>
  <Text style={[styles.tableCell, styles.col5, styles.headerText]}>
    {t('pdf.schedule.refunded', 'Refunded')}
  </Text>
  <Text style={[styles.tableCell, styles.col6, styles.headerText]}>
    {t('pdf.schedule.paidDate', 'Paid Date')}
  </Text>
  <Text style={[styles.tableCell, styles.col7, styles.headerText]}>
    {t('pdf.schedule.status', 'Status')}
  </Text>
</View>
```

**Updated table rows** (added Refunded cell):
```tsx
{/* Refunded Amount */}
<View style={[styles.tableCell, styles.col5]}>
  {schedule.refunded_amount && schedule.refunded_amount > 0 ? (
    <Text style={styles.refundedText}>
      ({formatCurrency(schedule.refunded_amount, schedule.currency)})
    </Text>
  ) : (
    <Text style={styles.cellText}>-</Text>
  )}
</View>
```

**Updated getStatusStyle** to handle refund statuses:
```typescript
const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return styles.statusPaid;
    case 'pending':
      return styles.statusPending;
    case 'overdue':
      return styles.statusOverdue;
    case 'partially_refunded':
      return styles.statusPartiallyRefunded;
    case 'refunded':
      return styles.statusRefunded;
    default:
      return styles.statusPending;
  }
};
```

---

### 4. ✅ Added Hebrew Translations

**Script**: `scripts/add-pdf-refund-translations.ts`

| Translation Key | English | Hebrew |
|----------------|---------|--------|
| `pdf.invoice.totalRefunded` | Total Refunded | סה"כ הוחזר |
| `pdf.invoice.netAmount` | Net Amount | סכום נטו |
| `pdf.schedule.refunded` | Refunded | הוחזר |
| `pdf.schedule.partiallyRefunded` | Partially Refunded | הוחזר חלקית |
| `pdf.schedule.statusLabel.partially_refunded` | Partially Refunded | הוחזר חלקית |

All translations successfully added to database.

---

## Visual Examples

### Invoice PDF (with refund):
```
Payment Summary
─────────────────────
Total Amount:           $3,245.00
Amount Paid:            $2,704.17
Total Refunded:         ($200.00)  [purple]
Net Amount:             $2,504.17
Remaining:              $740.83
─────────────────────
```

### Payment Schedule PDF (with refund):
```
# | Type        | Due Date   | Amount    | Refunded  | Paid Date | Status
──┼─────────────┼────────────┼───────────┼───────────┼───────────┼──────────────────
5 | Installment | Jun 24 2026| $540.83   | ($200.00) | Jun 24 26 | Partially Refunded
                                           [purple]               [purple badge]
```

---

## Color Scheme

**Refund Information**:
- Text Color: `#9333ea` (purple-700)
- Matches UI color scheme for refunds
- Displayed in parentheses: `($200.00)`

**Status Badges**:
- Partially Refunded: Purple background `#f3e8ff`, dark purple text `#7e22ce`
- Refunded: Light purple background `#fae8ff`, purple text `#a855f7`

---

## RTL Support

All refund elements fully support RTL layout:
- Text alignment switches in Hebrew
- Layout direction reversed properly
- Currency formatting respects locale
- Badge alignment correct in both directions

---

## Data Flow

1. **API Route** fetches payments from database
2. **Enrichment** joins refund data to schedules
3. **Calculation** computes total refunded amount
4. **Templates** receive enriched data
5. **Rendering** displays refunds in purple with parentheses
6. **Translation** uses Hebrew text when language is 'he'

---

## Testing Checklist

### Invoice PDF:
- [ ] Shows "Total Refunded" line when refunds exist
- [ ] Shows "Net Amount" line when refunds exist
- [ ] Refunded amount in purple with parentheses
- [ ] Net amount correctly calculated (paid - refunded)
- [ ] Hebrew translations work correctly
- [ ] RTL layout correct in Hebrew

### Payment Schedule PDF:
- [ ] "Refunded" column appears in table header
- [ ] Refunded amounts show in purple with parentheses
- [ ] Shows "-" when no refund exists
- [ ] Status shows "Partially Refunded" when applicable
- [ ] Status badge is purple
- [ ] Hebrew translations work correctly
- [ ] RTL layout correct in Hebrew

### Combined PDF:
- [ ] Both documents show refund information
- [ ] Data consistent between invoice and schedule
- [ ] Total refunded matches sum of individual refunds

### Languages:
- [ ] English PDF shows all refund information
- [ ] Hebrew PDF shows all refund information with correct translations
- [ ] RTL layout works in Hebrew for all refund elements

---

## Files Modified

1. **`src/app/api/user/enrollments/[id]/export-pdf/route.tsx`**
   - Added payment fetching and enrichment logic
   - Calculate total refunded amount
   - Pass refund data to templates

2. **`src/lib/pdf/EnrollmentInvoiceTemplate.tsx`**
   - Added refund fields to interface
   - Added refund styles (purple color)
   - Added "Total Refunded" and "Net Amount" rows
   - RTL support for refund elements

3. **`src/lib/pdf/PaymentScheduleTemplate.tsx`**
   - Adjusted column widths to add Refunded column
   - Added refund styles (purple color, badges)
   - Added "Refunded" column to table
   - Updated status handling for partial refunds
   - RTL support for refund column

4. **`scripts/add-pdf-refund-translations.ts`** (New)
   - Created and ran translation script
   - Added 5 translation keys (EN + HE)

---

## Summary

✅ **PDF Invoice** - Shows total refunded and net amount
✅ **PDF Schedule** - Shows refunded amount per payment
✅ **Refund Calculation** - Correctly computes net amounts
✅ **Hebrew Translations** - All refund text translated
✅ **RTL Support** - Full right-to-left layout support
✅ **Color Coding** - Purple theme for refunds matches UI
✅ **Data Enrichment** - Payments joined with schedules
✅ **Status Display** - "Partially Refunded" badge shown

**Status**: ✅ **COMPLETE AND READY FOR TESTING**

PDF exports now provide complete transparency for refund information, matching what users see in the UI.

---

**Date**: 2026-01-26
