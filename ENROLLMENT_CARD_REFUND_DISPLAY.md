# Enrollment Card Refund Display - Complete

## Summary

Added refund amount display to enrollment cards and ensured that total paid reflects refunds (net amount after refunds).

---

## Changes Made

### 1. ✅ Calculate Total Refunded Per Enrollment

**Location**: [Lines 950-954](src/app/(user)/profile/page.tsx#L950-L954)

Added calculation to sum all refunded amounts for each enrollment:

```typescript
// Calculate total refunded amount for this enrollment
const totalRefunded = enrollmentPayments.reduce((sum, schedule) => {
  return sum + (schedule.refunded_amount || 0);
}, 0);
```

---

### 2. ✅ Updated Payment Progress Display

**Location**: [Lines 1087-1122](src/app/(user)/profile/page.tsx#L1087-L1122)

**Changes**:
1. **Net Amount Calculation**: Payment progress now shows `paid_amount - totalRefunded` instead of just `paid_amount`
2. **Progress Bar**: Updated to reflect net amount percentage
3. **Remaining Calculation**: Updated to use net amount

**Before**:
```typescript
{formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
```

**After**:
```typescript
{formatCurrency(enrollment.paid_amount - totalRefunded, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
```

---

### 3. ✅ Added Refund Display Section

**Location**: [Lines 1113-1121](src/app/(user)/profile/page.tsx#L1113-L1121)

Shows total refunded amount if any refunds exist:

```typescript
{/* Show refund information if any */}
{totalRefunded > 0 && (
  <div className={`flex items-center justify-between text-xs pt-2 border-t border-border/50 ${isRtl ? 'flex-row-reverse' : ''}`}>
    <span className="text-purple-600 dark:text-purple-400 font-medium">
      {t('user.profile.billing.totalRefunded', 'Total Refunded')}
    </span>
    <span className="font-bold text-purple-600 dark:text-purple-400">
      {formatCurrency(totalRefunded, enrollment.currency)}
    </span>
  </div>
)}
```

**Visual Style**:
- Purple color (matches refund theme throughout UI)
- Border separator above refund section
- Right-aligned in LTR, properly reversed in RTL

---

### 4. ✅ Updated Progress Bar Calculation

**Location**: [Lines 1096-1110](src/app/(user)/profile/page.tsx#L1096-L1110)

Progress bar now correctly reflects net payment progress:

**Before**:
```typescript
width: `${Math.min(100, (enrollment.paid_amount / enrollment.total_amount) * 100)}%`
```

**After**:
```typescript
width: `${Math.min(100, ((enrollment.paid_amount - totalRefunded) / enrollment.total_amount) * 100)}%`
```

---

### 5. ✅ Updated Remaining Amount Calculation

**Location**: [Lines 1123-1127](src/app/(user)/profile/page.tsx#L1123-L1127)

Remaining amount now accounts for refunds:

**Before**:
```typescript
{formatCurrency(enrollment.total_amount - enrollment.paid_amount, enrollment.currency)}
```

**After**:
```typescript
{formatCurrency(enrollment.total_amount - (enrollment.paid_amount - totalRefunded), enrollment.currency)}
```

---

## Translation Added

**Key**: `user.profile.billing.totalRefunded`

| Language | Translation |
|----------|-------------|
| English | Total Refunded |
| Hebrew | סה"כ הוחזר |

---

## Files Modified

### 1. `src/app/(user)/profile/page.tsx`
- **Lines 950-954**: Calculate totalRefunded per enrollment
- **Lines 1087-1127**: Updated payment progress section with refund display

### 2. `src/context/AppContext.tsx`
- **Line 13**: Bumped translation cache version from 19 → 20

### 3. `scripts/add-total-refunded-translation.ts` (New)
- Created script to add "Total Refunded" translation
- Successfully added in English and Hebrew

---

## Visual Example

### Enrollment Card Without Refunds:
```
Payment Progress
$2,704.17 / $3,245.00

[████████████████░░░░] 83%

Remaining: $540.83
```

### Enrollment Card WITH Refunds (e.g., $200 refunded):
```
Payment Progress
$2,504.17 / $3,245.00

[███████████████░░░░░] 77%

──────────────────────
Total Refunded: $200.00

Remaining: $740.83
```

---

## Logic Explanation

### Payment Calculations:

1. **Original Paid Amount**: Sum of all actual payments made
2. **Total Refunded**: Sum of all refunded amounts from payment schedules
3. **Net Amount (After Refunds)**: `Paid Amount - Total Refunded`
4. **Progress Percentage**: `(Net Amount / Total Amount) * 100`
5. **Remaining**: `Total Amount - Net Amount`

### Example:
- **Total Amount**: $3,245.00
- **Paid Amount**: $2,704.17 (4 payments of $540.83)
- **Refunded**: $200.00 (partial refund on payment #5)
- **Net Amount**: $2,504.17 ($2,704.17 - $200.00)
- **Progress**: 77% ($2,504.17 / $3,245.00)
- **Remaining**: $740.83 ($3,245.00 - $2,504.17)

---

## RTL Support

All refund display sections properly support RTL:
- `flex-row-reverse` applied in RTL mode
- Text aligned to the right
- Border and spacing preserved

---

## Testing Instructions

### 1. Test Enrollment Without Refunds
1. Navigate to Profile → Billing → Enrollments
2. Find enrollment with no refunds
3. **Verify**: No "Total Refunded" section appears
4. **Verify**: Payment progress shows correct paid/total ratio

### 2. Test Enrollment With Refunds
1. Find enrollment with partial refund (e.g., Payment #5 has $200 refund)
2. **Verify**: "Total Refunded" section appears with purple text
3. **Verify**: Amount shown matches sum of all refunds
4. **Verify**: Payment progress shows net amount (after refunds)
5. **Verify**: Progress bar percentage is correct
6. **Verify**: Remaining amount is correct

### 3. Test Progress Bar Accuracy
For enrollment with refund:
- Calculate: (Paid - Refunded) / Total * 100
- **Verify**: Progress bar percentage matches calculation
- **Verify**: Progress bar width visually matches percentage

### 4. Test RTL Layout
1. Switch language to Hebrew
2. **Verify**: "Total Refunded" label on right, amount on left
3. **Verify**: Border separator displays correctly
4. **Verify**: Purple color preserved

### 5. Test Multiple Refunds
If enrollment has multiple refunded payments:
1. **Verify**: Total Refunded shows SUM of all refunds
2. **Verify**: Each individual refund visible in payment history table
3. **Verify**: Card total matches history table sum

---

## Color Scheme

Refund information uses **purple** color throughout:
- `text-purple-600 dark:text-purple-400` (light/dark mode support)
- Matches refund amount color in payment history table
- Provides consistent visual indicator for refund-related information

---

## Summary

✅ **Total Refunded displayed** - Shows on card if any refunds exist
✅ **Net amount reflected** - Payment progress uses paid minus refunded
✅ **Progress bar accurate** - Percentage calculated from net amount
✅ **Remaining correct** - Accounts for refunds in calculation
✅ **RTL support** - Properly reversed layout for Hebrew
✅ **Purple theme** - Consistent refund color scheme

**Status**: Ready for testing
**Translation Cache**: Bumped to v20 (forces refresh)
**Browser**: Requires hard refresh on first load

---

**Date**: 2026-01-26
