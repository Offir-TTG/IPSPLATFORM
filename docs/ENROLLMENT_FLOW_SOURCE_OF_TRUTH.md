# Enrollment Flow - Source of Truth

## Your Question
"Who dictates the steps and conditions for user enrollment? Like if it includes payment, DocuSign, etc. I'm asking because you added 'require payment' - so what is the source of truth for the enrollment steps?"

## The Answer: **Product** is the Source of Truth

The **`Product`** entity is the single source of truth for ALL enrollment requirements and steps. The enrollment flow is completely dictated by the product's configuration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCT                              │
│  (Single Source of Truth for Enrollment Requirements)       │
├─────────────────────────────────────────────────────────────┤
│  • Payment Model (free/one_time/deposit_then_plan/sub)      │
│  • Price & Currency                                          │
│  • Payment Plan Configuration (installments, deposit, etc.)  │
│  • DocuSign Requirements (requires_signature: boolean)       │
│  • Signature Template ID                                     │
│  • Keap Tag (for CRM integration)                           │
│  • Content Reference (program_id/course_id/bundle)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Creates/Dictates
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      ENROLLMENT                              │
│         (Instance of user enrolled in product)               │
├─────────────────────────────────────────────────────────────┤
│  • Inherits total_amount from Product.price                 │
│  • Inherits currency from Product.currency                  │
│  • Payment tracking (paid_amount, payment_status)           │
│  • Status (draft → pending → active → completed)            │
│  • Enrollment type (admin_assigned / self_enrolled)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Product Schema: The Source of Truth

### From `src/types/product.ts`:

```typescript
export interface Product {
  // DocuSign integration
  requires_signature: boolean;        // ← Dictates if DocuSign is required
  signature_template_id?: string;     // ← Which DocuSign template to use

  // Payment configuration
  payment_model: PaymentModel;        // ← Dictates payment flow
  price?: number;                     // ← Price (NULL if free)
  currency?: string;                  // ← Currency
  payment_plan: PaymentPlanConfig;    // ← Payment plan details

  // Payment plan selection (optional)
  default_payment_plan_id?: string;
  alternative_payment_plan_ids?: string[];
  allow_plan_selection?: boolean;

  // Keap integration
  keap_tag?: string | null;           // ← Keap tag to apply

  // Content reference
  program_id?: string;
  course_id?: string;
  contains_courses?: string[];
  session_count?: number;
}
```

### Payment Models (Determines Flow):

```typescript
export type PaymentModel =
  | 'free'              // No payment required - user enrolled immediately
  | 'one_time'          // Single payment required
  | 'deposit_then_plan' // Deposit + installments
  | 'subscription';     // Recurring subscription
```

---

## Enrollment Flow Based on Product Configuration

### Scenario 1: Free Product
**Product Configuration**:
```typescript
{
  payment_model: 'free',
  requires_signature: false,
  keap_tag: null
}
```

**Enrollment Steps**:
1. Admin creates enrollment → Status: `draft`
2. Admin sends invitation email → Status: `pending`
3. User clicks "Accept Enrollment" → Status: `active`
4. ✅ User has immediate access

**No payment, no DocuSign, just accept and go.**

---

### Scenario 2: Paid Product with DocuSign
**Product Configuration**:
```typescript
{
  payment_model: 'one_time',
  price: 1500,
  currency: 'ILS',
  requires_signature: true,
  signature_template_id: 'docusign-template-xyz',
  keap_tag: 'enrolled-in-program-x'
}
```

**Enrollment Steps**:
1. Admin creates enrollment → Status: `draft`
2. Admin sends invitation email → Status: `pending`
3. User clicks "Accept Enrollment"
4. System checks `requires_signature` → TRUE
5. ✅ Redirect to DocuSign → User signs document
6. After signature complete → Check `payment_model`
7. ✅ Redirect to payment → User pays ₪1,500
8. After payment complete → Status: `active`
9. ✅ Apply Keap tag: "enrolled-in-program-x"
10. ✅ User has access

**Order: Accept → DocuSign → Payment → Activation**

---

### Scenario 3: Deposit + Installment Plan
**Product Configuration**:
```typescript
{
  payment_model: 'deposit_then_plan',
  price: 5000,
  currency: 'ILS',
  payment_plan: {
    deposit_type: 'percentage',
    deposit_percentage: 20,        // 20% deposit = ₪1,000
    installments: 4,               // 4 monthly payments of ₪1,000
    frequency: 'monthly',
    plan_start_date: '2025-12-15'
  },
  requires_signature: true,
  signature_template_id: 'contract-template'
}
```

**Enrollment Steps**:
1. Admin creates enrollment → Status: `draft`
2. Enrollment created with:
   - `total_amount`: ₪5,000
   - `paid_amount`: ₪0
   - `payment_status`: `pending`
3. Admin sends invitation email → Status: `pending`
4. User clicks "Accept Enrollment"
5. System checks `requires_signature` → TRUE
6. ✅ DocuSign: User signs contract
7. After signature → Check `payment_model` → `deposit_then_plan`
8. ✅ Payment: User pays deposit (₪1,000)
9. System updates:
   - `paid_amount`: ₪1,000
   - `payment_status`: `partial`
   - `status`: `active`
   - `next_payment_date`: 2025-12-15
10. ✅ User has access immediately after deposit
11. 🔁 Stripe creates payment schedule for remaining ₪4,000 (4 × ₪1,000 monthly)
12. Each month: Stripe auto-charges → Updates `paid_amount`
13. After final payment → `payment_status`: `paid`

---

### Scenario 4: No Payment Required (Admin Override)
**Product Configuration**:
```typescript
{
  payment_model: 'one_time',     // Product normally requires payment
  price: 2000,
  currency: 'ILS',
  requires_signature: false
}
```

**Admin Action**: Admin checks "Require Payment" checkbox = FALSE in dialog

**Enrollment Steps**:
1. Admin creates enrollment with override flag
2. Enrollment created with:
   - `total_amount`: ₪0 (overridden)
   - `payment_status`: `paid` (marked as paid)
   - `status`: `draft`
3. Admin sends invitation → Status: `pending`
4. User accepts → Status: `active`
5. ✅ User has access without payment

**This is the scholarship/free enrollment scenario.**

---

## Where "Require Payment" Checkbox Comes From

In the current implementation, I added a **"Require Payment"** checkbox in the `CreateEnrollmentDialog`. This checkbox was intended as an **admin override** to allow admins to waive payment for specific users (like scholarships or staff).

### Current Implementation (What I Added):
```tsx
<input
  type="checkbox"
  id="requirePayment"
  checked={requirePayment}
  onChange={(e) => setRequirePayment(e.target.checked)}
/>
<Label>Require payment (enrollment pending until paid)</Label>
```

### Problem with Current Implementation:
❌ **This checkbox is NOT actually used in the API!**

Looking at the API code ([route.ts:313-349](src/app/api/admin/enrollments/route.ts#L313-L349)):

```typescript
// Determine total amount based on payment model
let totalAmount = 0;
let currency = product.currency || 'USD';

if (product.payment_model !== 'free') {
  totalAmount = product.price || 0;  // ← Always uses product price
}

// Create enrollment
const { data, error } = await supabase
  .from('enrollments')
  .insert({
    total_amount: totalAmount,      // ← No override from checkbox
    paid_amount: 0,
    payment_status: totalAmount === 0 ? 'paid' : 'pending',
    status,
    // ...
  })
```

**The checkbox exists in the UI but doesn't affect the enrollment creation!**

---

## The Correct Source of Truth Flow

### What SHOULD Happen:

1. **Product defines requirements**:
   - Payment model (free/paid/subscription)
   - Price
   - DocuSign requirement
   - Payment plan configuration

2. **Admin can override for specific enrollments**:
   - "Waive payment" → Creates enrollment with `total_amount: 0` even if product has price
   - "Skip DocuSign" → Skips signature step for this specific user
   - This is useful for:
     - Scholarships
     - Staff enrollments
     - Special cases
     - Testing

3. **Enrollment inherits from Product by default**:
   - If Product.price = ₪1,500 → Enrollment.total_amount = ₪1,500
   - If Product.requires_signature = true → User must sign
   - If Product.keap_tag = 'student' → Tag applied after activation

4. **Admin overrides stored in Enrollment**:
   - `payment_waived: boolean` (new field needed)
   - `signature_waived: boolean` (new field needed)
   - This preserves that admin explicitly overrode the requirement

---

## Recommended Fix

### Option 1: Remove the Checkbox (Simplest)
Remove the "Require Payment" checkbox completely. The product's payment model is the only source of truth.

**Pros**:
- Clean, no confusion
- Product configuration is single source of truth
- Admins configure product once, applies to all enrollments

**Cons**:
- No way to override for scholarships/special cases

---

### Option 2: Implement Override Properly (Recommended)
Keep the checkbox but implement it correctly:

1. **Rename checkbox** to "Waive payment for this user"
2. **Update API** to respect the override:

```typescript
// In CreateEnrollmentDialog.tsx
const [waivePayment, setWaivePayment] = useState(false);

// Payload
const payload = {
  product_id: selectedProduct,
  user_id: selectedUser,
  waive_payment: waivePayment,  // ← Send override flag
  status: 'draft'
};
```

```typescript
// In route.ts
const { waive_payment } = body;

// Determine total amount
let totalAmount = 0;
let paymentStatus = 'pending';

if (waive_payment) {
  // Admin override: waive payment
  totalAmount = 0;
  paymentStatus = 'paid';
} else if (product.payment_model !== 'free') {
  totalAmount = product.price || 0;
  paymentStatus = 'pending';
}

// Create enrollment
await supabase.from('enrollments').insert({
  total_amount: totalAmount,
  paid_amount: waive_payment ? totalAmount : 0,
  payment_status: paymentStatus,
  // ...
});
```

3. **Add migration** to store override flag:

```sql
ALTER TABLE enrollments ADD COLUMN payment_waived BOOLEAN DEFAULT false;
ALTER TABLE enrollments ADD COLUMN signature_waived BOOLEAN DEFAULT false;
```

---

## Complete Enrollment Lifecycle

```
┌──────────────┐
│   Product    │  ← Source of Truth (payment model, price, DocuSign, etc.)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Admin Creates│
│  Enrollment  │  ← Can override requirements (waive payment, skip DocuSign)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│    Status:   │
│    draft     │  ← Enrollment created, email NOT sent yet
└──────┬───────┘
       │
       ↓ Admin clicks "Send Link"
       │
┌──────────────┐
│    Status:   │
│   pending    │  ← Email sent, waiting for user action
└──────┬───────┘
       │
       ↓ User clicks "Accept Enrollment"
       │
┌──────────────┐
│  DocuSign?   │  ← If product.requires_signature && !signature_waived
└──────┬───────┘
       │
       ↓ If yes: User signs
       │
┌──────────────┐
│  Payment?    │  ← If product.payment_model != 'free' && !payment_waived
└──────┬───────┘
       │
       ↓ If yes: User pays (deposit or full)
       │
┌──────────────┐
│    Status:   │
│   active     │  ← User enrolled and has access
└──────┬───────┘
       │
       ↓ User completes program/course
       │
┌──────────────┐
│    Status:   │
│  completed   │  ← User finished
└──────────────┘
```

---

## Summary

### Source of Truth Hierarchy:

1. **Product Configuration** (Primary source of truth)
   - Defines: payment model, price, DocuSign requirement, Keap tag
   - Stored in: `products` table

2. **Admin Overrides** (Optional, per-enrollment)
   - Allows: waiving payment, skipping DocuSign for specific users
   - Stored in: `enrollments` table (`payment_waived`, `signature_waived`)

3. **Enrollment Instance** (Inherits from Product + Overrides)
   - Stores: actual amounts, payment tracking, status
   - Stored in: `enrollments` table

### Key Fields:

**Product (Source of Truth)**:
- `payment_model` → Determines if payment required
- `price` → How much user pays
- `payment_plan` → Payment plan configuration
- `requires_signature` → If DocuSign required
- `signature_template_id` → Which template
- `keap_tag` → CRM integration

**Enrollment (Inherits + Tracks)**:
- `total_amount` → Inherited from Product.price (or 0 if waived)
- `paid_amount` → How much user has paid so far
- `payment_status` → pending/partial/paid/overdue
- `status` → draft/pending/active/completed
- `payment_waived` → (NEEDS TO BE ADDED) Admin override flag
- `signature_waived` → (NEEDS TO BE ADDED) Admin override flag

---

## Recommendation

**Fix the "Require Payment" checkbox to work properly:**

1. Rename to "Waive payment (scholarship/free enrollment)"
2. Invert the logic (checked = waive payment)
3. Update API to respect the override
4. Add `payment_waived` and `signature_waived` columns to enrollments table
5. Store override flags for audit trail

This way:
- Product remains the source of truth
- Admins can override for special cases
- System maintains clear audit trail of why payment was waived

Would you like me to implement this fix?
