# Enrollment Reset Feature - Complete Implementation

## Overview
The enrollment reset feature allows admins to reset an enrollment back to draft status, clearing all progress so the user can go through the enrollment wizard again.

## How It Works

### 1. Reset Button Location
- **Mobile View**: Shows for enrollments with `status === 'pending' || status === 'active'`
- **Desktop View**: Shows for enrollments with `status === 'pending' || status === 'active'`
- Icon: RotateCcw (rotating arrow)

### 2. Reset Dialog Options
When clicking Reset, admin sees a dialog with:
- ☑️ **Reset DocuSign signature status** - Clears signature_status and docusign_envelope_id
- ☑️ **Reset payment status** - Sets paid_amount to 0 and payment_status to 'pending'
- ☑️ **Reset profile onboarding flags** - Always enabled (cannot be unchecked)

### 3. What Gets Reset

#### Always Reset (status back to draft):
- `status` → `'draft'` ✅
- `payment_status` → `'pending'` ✅
- `paid_amount` → `0` ✅
- `next_payment_date` → `null` ✅
- `completed_at` → `null` ✅
- `cancelled_at` → `null` ✅
- `signature_status` → `null` ✅
- `docusign_envelope_id` → `null` ✅

#### Optional (based on checkboxes):
- If "Reset DocuSign signature" is **unchecked**: Preserves signature_status and docusign_envelope_id
- If "Reset payment" is **unchecked**: Preserves paid_amount and payment_status

#### Never Reset (preserved):
- `enrollment_token` - User can use the same link
- `token_expires_at` - Token expiry preserved
- `invitation_sent_at` - History preserved
- `enrolled_at` - **Original enrollment date (has NOT NULL constraint)**
- `created_at` - Original creation date
- `created_by` - Original creator
- `product_id` - Product assignment (can be edited later)
- `total_amount` - Total amount (can be edited later)
- `tenant_id` - Tenant ownership
- `user_id` - User assignment

## Workflow After Reset

### Status Flow:
1. **Active/Pending** → Click Reset → **Draft**
2. **Draft** → Admin can Edit (change product, expiry date)
3. **Draft** → Admin sends enrollment link
4. **Draft** → User clicks link and starts wizard → **Pending/Active**

### Button Visibility After Reset:
- ✅ **Edit button appears** (status = draft)
- ❌ **Reset button hidden** (only shows for pending/active)
- ✅ **Send Link button visible** (always visible)

## API Endpoint

### POST `/api/admin/enrollments/:id/reset`

**Query Parameters:**
- `reset_signature=true` - Clear signature data
- `reset_payment=true` - Reset payment to 0
- `reset_profile=true` - Reset user onboarding flags

**Response:**
```json
{
  "success": true,
  "enrollment_id": "uuid",
  "wizard_url": "/enroll/wizard/{id}",
  "reset_details": {
    "signature": true,
    "payment": true,
    "profile": true
  }
}
```

## Database Migration Required

Before using this feature, you must run:
```sql
-- Add enrollment wizard fields to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS signature_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS docusign_envelope_id VARCHAR(255);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_docusign_envelope_id
ON enrollments(docusign_envelope_id)
WHERE docusign_envelope_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_signature_status
ON enrollments(signature_status)
WHERE signature_status IS NOT NULL;
```

See: [RUN_THIS_WIZARD_MIGRATION.md](../RUN_THIS_WIZARD_MIGRATION.md)

## Translations

Run this migration for UI translations:
```
supabase/migrations/20251202_enrollment_reset_translations.sql
```

Includes English and Hebrew translations for:
- Reset button
- Reset dialog title/description
- Checkbox labels
- Warning messages
- Success/error toasts

## Files Modified

### Backend:
- `/src/app/api/admin/enrollments/[id]/reset/route.ts` - Reset endpoint

### Frontend:
- `/src/app/admin/enrollments/page.tsx` - Reset button and dialog in enrollments list

### Database:
- `/supabase/migrations/20251202_add_enrollment_wizard_fields.sql` - Schema changes
- `/supabase/migrations/20251202_enrollment_reset_translations.sql` - Translation strings

### Documentation:
- `/RUN_THIS_WIZARD_MIGRATION.md` - Migration instructions

## Testing Steps

1. ✅ Create an enrollment in 'active' or 'pending' status
2. ✅ Verify Reset button appears (RotateCcw icon)
3. ✅ Click Reset button
4. ✅ Verify dialog opens with 3 checkboxes
5. ✅ Select reset options and click "Reset Enrollment"
6. ✅ Verify success toast appears with wizard URL
7. ✅ Verify enrollment status changed to 'draft'
8. ✅ Verify Edit button now appears
9. ✅ Verify Reset button is now hidden
10. ✅ Click Edit and verify you can change product/expiry
11. ✅ Verify all progress fields were cleared (enrolled_at, completed_at, etc.)

## Security

- ✅ Admin-only endpoint (checks role = admin or super_admin)
- ✅ Tenant isolation (can only reset enrollments in own tenant)
- ✅ Audit logging (creates audit_event for each reset)
- ✅ Warning for destructive actions (payment reset)

## Edge Cases Handled

- ✅ Enrollment not found → 404 error
- ✅ Non-admin user → 403 forbidden
- ✅ Different tenant → 404 not found
- ✅ Database error → 500 with error message
- ✅ Missing columns → Clear error message (run migration)

## Future Enhancements

- [ ] Add "Reset All" bulk action
- [ ] Add confirmation for partial resets
- [ ] Show reset history in audit log UI
- [ ] Add email notification to user when admin resets
- [ ] Add "Undo Reset" feature (restore from audit log)
