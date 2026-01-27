# Payment History Sorting & RTL Fixes - Complete

## Issues Fixed

### 1. ✅ Added Sorting to Payment History Table
**Problem**: Payment history table had no sorting functionality

**Fix Applied**:
- Added sorting state per enrollment
- Default sort: Payment Number ascending (Payment #1 first)
- Made 7 columns sortable: #, Type, Due Date, Original, Refunded, Paid, Status
- Shows sort indicators (▲ ▼ or ⇅) on each sortable column header
- Clicking header toggles between ascending and descending

**Sortable Columns**:
- **# (Payment Number)** - Numeric sort
- **Type** - Alphabetical sort (Deposit, Installment)
- **Due Date** - Date sort
- **Original Amount** - Numeric sort
- **Refunded Amount** - Numeric sort (calculated from refunded_amount field)
- **Paid Amount** - Numeric sort (calculated: Original - Refunded)
- **Status** - Alphabetical sort

---

### 2. ✅ Fixed RTL Alignment for All Headers
**Problem**: In Hebrew (RTL), table headers weren't properly right-aligned with icons

**Fix Applied**:
- Added `flex-row-reverse` class to all sortable headers when in RTL mode
- Icons now appear on the correct side (right side in RTL)
- Text and icons properly aligned

**Before (RTL)**: Icon Text → (wrong)
**After (RTL)**: Text Icon ← (correct)

---

### 3. ✅ Verified No Admin Translation Keys in User Page
**Status**: Confirmed - The user profile page does NOT use any `admin.*` translation keys

All translations use `user.profile.billing.*` context correctly:
- `user.profile.billing.type`
- `user.profile.billing.dueDate`
- `user.profile.billing.originalAmount`
- `user.profile.billing.refundedAmount`
- `user.profile.billing.paidAmount`
- `user.profile.billing.paymentStatus`

---

## Technical Implementation

### State Added

```typescript
// Sorting state for payment schedules (per enrollment)
type SortField = 'payment_number' | 'payment_type' | 'scheduled_date' | 'amount' | 'refunded_amount' | 'paid_amount' | 'status';
type SortDirection = 'asc' | 'desc';
const [paymentSort, setPaymentSort] = useState<Record<string, { field: SortField; direction: SortDirection }>>({});
```

### Sort Logic

**Location**: [Lines 954-1000](src/app/(user)/profile/page.tsx#L954-L1000)

```typescript
// Default: by payment_number ascending
const sortConfig = paymentSort[enrollment.id] || { field: 'payment_number', direction: 'asc' };

const sortedPayments = [...enrollmentPayments].sort((a, b) => {
  const { field, direction } = sortConfig;

  // Handle calculated fields
  if (field === 'refunded_amount') {
    aValue = a.refunded_amount || 0;
    bValue = b.refunded_amount || 0;
  } else if (field === 'paid_amount') {
    aValue = (a.amount || 0) - (a.refunded_amount || 0);
    bValue = (b.amount || 0) - (b.refunded_amount || 0);
  }

  // Handle date, numeric, string sorting...
  // Apply sort direction
});
```

### Sort Handler

```typescript
const handleSort = (enrollmentId: string, field: SortField) => {
  setPaymentSort(prev => {
    const current = prev[enrollmentId] || { field: 'payment_number', direction: 'asc' };
    const newDirection = current.field === field && current.direction === 'asc' ? 'desc' : 'asc';
    return {
      ...prev,
      [enrollmentId]: { field, direction: newDirection }
    };
  });
  // Reset to first page when sorting changes
  handlePageChange(enrollmentId, 1);
};
```

### Sortable Header Example

```typescript
<div
  className={`col-span-2 hidden lg:flex items-center gap-1 justify-end ${isRtl ? 'text-right flex-row-reverse' : 'text-right'} cursor-pointer hover:text-foreground transition-colors`}
  onClick={() => handleSort(enrollment.id, 'refunded_amount')}
>
  <span>{t('user.profile.billing.refundedAmount', 'Refunded')}</span>
  {sortConfig.field === 'refunded_amount' ? (
    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  ) : (
    <ArrowUpDown className="h-3 w-3 opacity-40" />
  )}
</div>
```

---

## Files Modified

### 1. `src/app/(user)/profile/page.tsx`

**Import additions** (Lines 16-49):
- Added `ArrowUpDown`, `ArrowUp`, `ArrowDown` icons from lucide-react

**State additions** (Lines 135-138):
- Added `SortField` and `SortDirection` types
- Added `paymentSort` state for per-enrollment sorting

**Sorting logic** (Lines 954-1000):
- Calculate sortConfig (default: payment_number asc)
- Sort payments with special handling for calculated fields
- Reset pagination when sort changes

**Sortable headers** (Lines 1164-1237):
- Made all 7 columns clickable with sort indicators
- Added RTL support with `flex-row-reverse`
- Show current sort direction with up/down arrows

---

## Sort Behavior

### Default Behavior
- **On page load**: Sorted by Payment Number ascending (1, 2, 3, 4...)
- **First click**: Sort by that column ascending
- **Second click**: Sort by that column descending
- **Third click**: Back to ascending (toggle)

### Per-Enrollment Sorting
- Each enrollment maintains its own sort state
- Sorting one enrollment doesn't affect others
- Sort state persists while navigating between enrollments

### Pagination + Sorting
- Sorting happens BEFORE pagination
- When sort changes, page resets to page 1
- Pagination controls show correct total pages for sorted data

---

## Visual Indicators

### Sort Icons
- **⇅ (ArrowUpDown)**: Column is sortable, not currently sorted (40% opacity)
- **▲ (ArrowUp)**: Currently sorting ascending
- **▼ (ArrowDown)**: Currently sorting descending

### Hover States
- Headers change color on hover (`hover:text-foreground`)
- Cursor changes to pointer
- Clear visual feedback for clickable headers

### RTL Support
- Icons appear on the RIGHT side of text in RTL
- Text remains right-aligned
- `flex-row-reverse` ensures correct visual order

---

## Testing Instructions

### 1. Test Default Sort
1. Navigate to Profile → Billing → Enrollments tab
2. Expand an enrollment's payment history
3. **Verify**: Payments are sorted by # ascending (1, 2, 3, 4...)

### 2. Test Column Sorting
1. Click on "Due Date" header
2. **Verify**: Payments sort by date ascending (earliest first)
3. Click "Due Date" again
4. **Verify**: Payments sort by date descending (latest first)

### 3. Test Calculated Field Sorting
1. Click on "Refunded" header
2. **Verify**: Payments with refunds sort to top/bottom
3. Click on "Paid" header
4. **Verify**: Payments sort by net amount (Original - Refunded)

### 4. Test RTL Sort Icons
1. Switch language to Hebrew
2. **Verify**: Sort icons appear on RIGHT side of column names
3. **Verify**: Text remains right-aligned
4. **Verify**: Icons still function correctly on click

### 5. Test Per-Enrollment Sorting
1. Expand two different enrollments
2. Sort first enrollment by "Amount"
3. Sort second enrollment by "Status"
4. **Verify**: Each maintains its own sort state

### 6. Test Pagination + Sort
1. Find enrollment with 10+ payments
2. Sort by "Status"
3. **Verify**: Page resets to 1
4. **Verify**: Pagination shows correct total pages
5. Navigate to page 2
6. **Verify**: Sorted order continues correctly

---

## Translation Keys Used

All verified to exist in database:

| Key | English | Hebrew |
|-----|---------|--------|
| `user.profile.billing.type` | Type | סוג |
| `user.profile.billing.dueDate` | Due Date | תאריך יעד |
| `user.profile.billing.originalAmount` | Original | מקורי |
| `user.profile.billing.refundedAmount` | Refunded | הוחזר |
| `user.profile.billing.paidAmount` | Paid | שולם |
| `user.profile.billing.paymentStatus` | Status | סטטוס |

---

## Summary

✅ **Sorting added** - All 7 columns sortable (6 direct fields + 2 calculated)
✅ **Default sort** - Payment Number ascending on load
✅ **RTL headers fixed** - Icons properly positioned with flex-row-reverse
✅ **No admin keys** - All translations use user.* context correctly
✅ **Per-enrollment state** - Each enrollment tracks its own sort
✅ **Pagination integration** - Resets to page 1 on sort change

**Status**: Ready for testing
**Browser**: Hard refresh required on first load

---

**Date**: 2026-01-26
