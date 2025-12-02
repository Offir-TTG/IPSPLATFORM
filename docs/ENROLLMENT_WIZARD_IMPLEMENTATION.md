# Enrollment Wizard Implementation

## Overview

This document describes the new enrollment wizard system that guides users through a multi-step process to complete their enrollment. The wizard ensures all required steps are completed in the correct order before activating an enrollment.

## Problem Statement

Previously, when a user accepted an enrollment invitation:
1. The enrollment was immediately set to 'active' status
2. User was redirected directly to the dashboard or payment page
3. **DocuSign signature step was skipped** (if required)
4. No guided flow to ensure profile completion
5. No validation that all steps were completed

## Solution

Implemented a **multi-step enrollment wizard** that enforces the following flow:

### Enrollment Flow

```
User clicks enrollment invitation link
  ↓
Accept enrollment invitation
  ↓
Set enrollment status to 'pending'
  ↓
Redirect to Enrollment Wizard
  ↓
┌─────────────────────────────────────┐
│  Step 1: DocuSign Signature         │
│  (only if product requires it)      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Step 2: Complete Profile           │
│  (required fields validation)       │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Step 3: Payment                    │
│  (only if payment required)         │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Complete Wizard                    │
│  Set enrollment status to 'active'  │
└─────────────────────────────────────┘
  ↓
Redirect to Dashboard
```

## Files Created/Modified

### New Files

#### 1. `/src/app/(public)/enroll/wizard/[id]/page.tsx`
**Purpose**: Main enrollment wizard page with multi-step UI

**Features**:
- Dynamic step progression based on enrollment requirements
- Progress bar showing completion percentage
- Step indicators (badges) for visual feedback
- Handles DocuSign return callback
- RTL/LTR support with translations
- Responsive design

**Steps**:
1. **Signature Step** (conditional)
   - Only shown if `product.requires_signature === true`
   - Creates embedded DocuSign signing session
   - Redirects to DocuSign signing URL
   - Returns to wizard after signing

2. **Profile Step** (required)
   - Validates required fields: `first_name`, `last_name`, `phone`, `address`, `city`, `country`
   - Redirects to profile page with return URL
   - Automatically advances when profile is complete

3. **Payment Step** (conditional)
   - Only shown if `payment_model !== 'free'` and `total_amount > 0`
   - Shows total amount to pay
   - Redirects to payment page
   - Advances when payment is complete

4. **Complete Step**
   - Final confirmation screen
   - Calls completion endpoint to activate enrollment
   - Redirects to dashboard

#### 2. `/src/app/api/enrollments/[id]/wizard-status/route.ts`
**Purpose**: API endpoint to get wizard progress status

**Returns**:
```typescript
{
  id: string;
  product_name: string;
  product_type: string;
  total_amount: number;
  currency: string;
  requires_signature: boolean;
  signature_template_id?: string;
  signature_status?: string;
  docusign_envelope_id?: string;
  user_profile_complete: boolean;
  payment_required: boolean;
  payment_complete: boolean;
  enrollment_status: string;
  payment_status: string;
}
```

**Logic**:
- Fetches enrollment with product details
- Checks user profile completeness (validates required fields)
- Determines if payment is required based on `payment_model`
- Calculates payment completion status

#### 3. `/src/app/api/enrollments/[id]/complete/route.ts`
**Purpose**: Complete the enrollment wizard and activate enrollment

**Validation**:
- ✅ Signature completed (if required)
- ✅ Profile complete (all required fields filled)
- ✅ Payment complete (if required)

**Actions on success**:
1. Set `enrollment.status = 'active'`
2. Update `enrollment.enrolled_at` to current timestamp
3. Clear user onboarding flags:
   - `onboarding_enrollment_id = null`
   - `onboarding_completed = true`
4. Apply Keap tag (if configured on product)

**Security**:
- User can only complete their own enrollments
- Validates tenant_id match
- Returns 400 error if any required step is incomplete

### Modified Files

#### 1. `/src/app/api/enrollments/token/[token]/accept/route.ts`

**Changes**:
```diff
- // Update enrollment status to active
+ // Update enrollment status to pending (will become active after wizard completion)
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
-     status: 'active',
-     enrolled_at: new Date().toISOString()
+     status: 'pending'
    })
    .eq('id', enrollment.id);

- // Determine if payment is required
- const requiresPayment = enrollment.total_amount > 0;
-
+ // Redirect to enrollment wizard to complete all steps
  return NextResponse.json({
    success: true,
-   requires_payment: requiresPayment,
-   payment_url: requiresPayment ? `/payments/${enrollment.id}` : null,
+   wizard_url: `/enroll/wizard/${enrollment.id}`,
    enrollment_id: enrollment.id
  });
```

**Impact**: Now sets status to `'pending'` instead of `'active'` and redirects to wizard instead of payments/dashboard.

#### 2. `/src/app/(public)/enroll/[token]/page.tsx`

**Changes**:
```diff
  const data = await response.json();

- // Redirect based on payment requirements
- if (data.requires_payment && data.payment_url) {
-   router.push(data.payment_url);
- } else {
-   router.push('/dashboard');
- }
+ // Redirect to enrollment wizard
+ if (data.wizard_url) {
+   router.push(data.wizard_url);
+ } else {
+   router.push('/dashboard');
+ }
```

**Impact**: Now redirects to wizard instead of directly to payment or dashboard.

#### 3. `/src/app/api/enrollments/[id]/send-contract/route.ts`

**Major Refactor**: Updated from old schema (students/programs) to new schema (users/products)

**Changes**:
- Removed `withAuth` middleware, implemented inline authentication
- Changed from `students` table to `users` table
- Changed from `programs` table to `products` table
- Changed from `program.docusign_template_id` to `product.signature_template_id`
- Changed from `signature_envelope_id` to `docusign_envelope_id`
- Added **embedded signing** support (creates signing URL instead of email)
- Added return URL to redirect back to wizard after signing
- Updated tenant_id filtering for multi-tenant support
- Removed old schema fields: `contract_signed`, `signature_sent_at`, `signature_completed_at`

**New Flow**:
```typescript
// Create envelope with embedded signing
const envelopeResponse = await docusignClient.createEmbeddedSigningEnvelope(
  product.signature_template_id,
  recipientInfo,
  emailSubject,
  customFields,
  returnUrl // <- Returns to /enroll/wizard/[id]?docusign=complete
);

return NextResponse.json({
  success: true,
  envelope_id: envelopeResponse.envelopeId,
  signing_url: envelopeResponse.signingUrl // <- User opens this URL
});
```

#### 4. `/src/app/api/webhooks/docusign/route.ts`

**Changes**:
```diff
- signature_envelope_id: envelopeId,
+ docusign_envelope_id: envelopeId,

- signature_sent_at: envelopeSummary?.statusChangedDateTime,
- signature_completed_at: envelopeSummary?.statusChangedDateTime,
- contract_signed: true,
- signature_declined_reason: declinedReason,
(removed old fields)
```

**Impact**: Updated to use current schema field names.

## Database Schema Requirements

### Required Columns on `enrollments` table

```sql
-- Enrollment status
status VARCHAR -- 'draft' | 'pending' | 'active' | 'completed' | 'cancelled'

-- DocuSign integration
signature_status VARCHAR -- 'sent' | 'delivered' | 'completed' | 'declined' | 'voided'
docusign_envelope_id VARCHAR

-- Timestamps
enrolled_at TIMESTAMP
updated_at TIMESTAMP
```

### Required Columns on `products` table

```sql
-- DocuSign configuration
requires_signature BOOLEAN
signature_template_id VARCHAR

-- Payment configuration
payment_model VARCHAR -- 'free' | 'one_time' | 'deposit_then_plan' | 'subscription'

-- Keap integration
keap_tag VARCHAR
```

### Required Columns on `users` table

```sql
-- Profile fields (validated by wizard)
first_name VARCHAR
last_name VARCHAR
phone VARCHAR
address VARCHAR
city VARCHAR
country VARCHAR

-- Onboarding tracking
onboarding_enrollment_id UUID
onboarding_completed BOOLEAN
```

## Enrollment Status Flow

```
draft        → Created by admin, invitation email not sent yet
  ↓
pending      → User accepted invitation, wizard in progress
  ↓
active       → Wizard completed, enrollment is active
  ↓
completed    → User finished the product (course/program)
  ↓
cancelled    → Enrollment was cancelled
```

## Security & Authorization

All endpoints enforce:
1. **Authentication**: User must be logged in
2. **Ownership**: User can only access their own enrollments
3. **Tenant Isolation**: Enrollment must belong to user's tenant

## Translation Keys

The wizard requires these translation keys:

```typescript
// Wizard headers
'enrollment.wizard.loading'
'enrollment.wizard.header.title'
'enrollment.wizard.progress'
'enrollment.wizard.error.title'
'enrollment.wizard.error.dashboard'

// Signature step
'enrollment.wizard.signature.title'
'enrollment.wizard.signature.description'
'enrollment.wizard.signature.info'
'enrollment.wizard.signature.button'
'enrollment.wizard.signature.sending'

// Profile step
'enrollment.wizard.profile.title'
'enrollment.wizard.profile.description'
'enrollment.wizard.profile.info'
'enrollment.wizard.profile.button'

// Payment step
'enrollment.wizard.payment.title'
'enrollment.wizard.payment.description'
'enrollment.wizard.payment.info'
'enrollment.wizard.payment.total'
'enrollment.wizard.payment.button'

// Complete step
'enrollment.wizard.complete.title'
'enrollment.wizard.complete.description'
'enrollment.wizard.complete.success'
'enrollment.wizard.complete.button'
'enrollment.wizard.complete.finishing'

// Step indicators
'enrollment.wizard.steps.signature'
'enrollment.wizard.steps.profile'
'enrollment.wizard.steps.payment'
```

## DocuSign Integration

### Embedded Signing Flow

1. User clicks "Sign Agreement" in wizard
2. POST to `/api/enrollments/[id]/send-contract`
3. Creates DocuSign envelope with embedded signing
4. Returns `signing_url`
5. Wizard redirects user to `signing_url`
6. User signs document in DocuSign interface
7. DocuSign redirects back to: `/enroll/wizard/[id]?docusign=complete`
8. Wizard detects `?docusign=complete` parameter
9. Waits 1 second for webhook to process
10. Refreshes enrollment data
11. Signature status is now `'completed'`
12. Wizard advances to next step

### Webhook Processing

When user completes signing:
1. DocuSign sends webhook to `/api/webhooks/docusign`
2. Webhook parses `envelope-completed` event
3. Extracts `enrollment_id` from custom fields
4. Updates `enrollments` table:
   - `signature_status = 'completed'`
   - `updated_at = NOW()`
5. Creates audit event
6. Wizard detects change and advances

## Testing Checklist

### Test Scenarios

- [ ] **Product with signature required + payment**
  - Step 1: Signature → DocuSign
  - Step 2: Profile → Profile page
  - Step 3: Payment → Payment page
  - Step 4: Complete → Dashboard

- [ ] **Product with signature only (free)**
  - Step 1: Signature → DocuSign
  - Step 2: Profile → Profile page
  - Step 3: Complete → Dashboard (skip payment)

- [ ] **Product with payment only (no signature)**
  - Step 1: Profile → Profile page (skip signature)
  - Step 2: Payment → Payment page
  - Step 3: Complete → Dashboard

- [ ] **Free product (no signature, no payment)**
  - Step 1: Profile → Profile page
  - Step 2: Complete → Dashboard

### Edge Cases

- [ ] User refreshes wizard page - should maintain current step
- [ ] User navigates back - should show current step
- [ ] User tries to skip steps - validation prevents completion
- [ ] DocuSign webhook delayed - 1 second wait handles this
- [ ] User profile already complete - step auto-skipped
- [ ] Signature already complete - step auto-skipped
- [ ] Payment already complete - step auto-skipped

## Future Enhancements

1. **Step History**: Track when each step was completed
2. **Email Reminders**: Send reminder if wizard not completed within X days
3. **Admin Override**: Allow admins to skip certain steps
4. **Wizard Analytics**: Track drop-off rates at each step
5. **Custom Steps**: Allow products to define additional steps
6. **Progress Save**: Save partial wizard progress

## Rollback Plan

If issues occur, rollback by:

1. Revert `/src/app/api/enrollments/token/[token]/accept/route.ts`:
   - Change `status: 'pending'` back to `status: 'active'`
   - Change `wizard_url` back to `payment_url` logic

2. Revert `/src/app/(public)/enroll/[token]/page.tsx`:
   - Change `wizard_url` redirect back to `payment_url`/dashboard logic

3. Users will bypass wizard and go directly to payment/dashboard as before

## Related Documentation

- DocuSign Integration: `docs/DOCUSIGN_INTEGRATION.md`
- Payment System: `docs/PAYMENT_SYSTEM_IMPLEMENTATION_COMPLETE.md`
- Product Schema: `src/types/product.ts`
- Enrollment Service: `src/lib/payments/enrollmentService.ts`
