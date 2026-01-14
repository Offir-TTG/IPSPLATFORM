# Email Triggers System - Setup Instructions

## Current Status

The email trigger system UI and API are fully implemented, but there are database schema and translation issues that need to be resolved before the system is functional.

## Issues Identified

### 1. Database Schema Issue (CRITICAL)
**Error:** Multiple "column does not exist" errors including:
- `column email_triggers.send_time does not exist`
- `column email_triggers.recipient_role does not exist`

**Cause:** The `email_triggers` table exists but is missing multiple required columns

**Columns Missing:**
- `send_time` (TIME)
- `send_days_before` (INTEGER)
- `recipient_role` (TEXT)
- `recipient_field` (TEXT)
- `conditions` (JSONB)
- `delay_minutes` (INTEGER)
- `priority` (TEXT)
- `created_by` (UUID)
- `updated_at` (TIMESTAMPTZ)

**Solution:** Run the schema fix SQL script

### 2. Template Key Mismatch
**Issue:** Templates in database use dot notation (e.g., `enrollment.invitation`) but some code expects underscores

**Status:** Templates exist correctly with dot notation. This is the correct format.

### 3. Missing Translations
**Issue:** The trigger dialog and page need Hebrew translations

**Status:** SQL script ready to add all 306 translations (153 keys × 2 languages)

## Setup Steps (Run in Order)

### Step 1: Fix Email Triggers Table Schema

**File:** `supabase/SQL Scripts/fix_email_triggers_schema.sql`

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `fix_email_triggers_schema.sql`
3. Run the script
4. Verify you see: ✅ All required columns exist in email_triggers table

This will add all 9 missing columns to the email_triggers table:
- `send_time` - Specific time of day to send email
- `send_days_before` - Days before event (for reminders)
- `recipient_role` - Target user role (student, instructor, admin)
- `recipient_field` - Field path to extract recipient email
- `conditions` - JSONB conditions for filtering when to send
- `delay_minutes` - Minutes to wait before sending
- `priority` - Email priority level (urgent, high, normal, low)
- `created_by` - User who created the trigger
- `updated_at` - Last update timestamp

### Step 2: Add Email Trigger Translations

**File:** `supabase/SQL Scripts/add_email_triggers_translations.sql`

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `add_email_triggers_translations.sql`
3. Run the script
4. Verify translations were added (should see success message)

This adds 306 translations for the trigger UI:
- Trigger page (title, description, buttons, stats)
- Trigger dialog (all form fields, tabs, validation messages)
- Event types (enrollment, payment, recording, lesson)
- Priority levels, timing options, conditions

### Step 3: Verify Templates Exist

**Current Templates in Database:**
```
✅ enrollment.confirmation    - Enrollment Confirmation
✅ enrollment.invitation      - Enrollment Invitation
✅ enrollment.reminder        - Enrollment Reminder
✅ lesson.reminder            - Lesson Reminder
✅ recording.available        - Recording Available
✅ parent.progress_report     - Progress Report (Parent)
✅ payment.failed             - Payment Failed
✅ payment.receipt            - Payment Receipt
✅ notification.generic       - Generic Notification
✅ system.password_reset      - Password Reset
✅ system.user_invitation     - User Invitation
```

All required templates for the trigger system exist. No action needed.

### Step 4: Test the Trigger System

After running the above SQL scripts:

1. **Clear Browser Cache** - Hard refresh (Ctrl+Shift+R) to clear cached translations
2. **Navigate to Triggers Page** - Go to Admin → Emails → Triggers
3. **Verify UI is in Hebrew** - All labels, buttons should be translated
4. **Create a Test Trigger:**
   - Click "Create Trigger"
   - Fill in trigger name (e.g., "Test Payment Receipt")
   - Select event: "Payment Completed"
   - Select template: "Payment Receipt"
   - Set timing: "Immediately"
   - Save

5. **Verify Trigger Created:**
   - Should appear in the list
   - Should show as "Active"
   - Template name should display correctly

6. **Test Toggle:**
   - Click the power icon to disable/enable
   - Should see success toast message

7. **Test Edit:**
   - Click the edit icon
   - Dialog should open with pre-filled data
   - Make a change and save

## Files Changed/Created

### New Files Created:
1. `supabase/SQL Scripts/fix_email_triggers_schema.sql` - Schema fix
2. `scripts/check-email-triggers-table.js` - Diagnostic script
3. `EMAIL_TRIGGERS_SETUP.md` - This file

### Files Already Created (Previous Session):
1. `src/app/admin/emails/triggers/page.tsx` - Triggers list page ✅
2. `src/components/email/CreateTriggerDialog.tsx` - Create/edit dialog ✅
3. `src/app/api/admin/emails/triggers/route.ts` - CRUD API ✅
4. `src/app/api/admin/emails/triggers/[id]/route.ts` - Single trigger API ✅
5. `src/app/api/admin/emails/triggers/[id]/test/route.ts` - Test API ✅
6. `src/app/api/admin/emails/templates/route.ts` - Template listing API ✅
7. `supabase/SQL Scripts/add_email_triggers_translations.sql` - Translations ✅
8. `supabase/SQL Scripts/add_missing_email_templates.sql` - Templates ✅

## Next Phase: Trigger Execution Engine

After the setup steps above are complete and the UI is working, the next phase is to implement the trigger execution engine:

### Phase 2: Backend Implementation

1. **Database Functions** - Create stored procedures for trigger matching and evaluation
2. **Trigger Engine** - Core logic to process events and queue emails
3. **Event Integration** - Hook into enrollment, payment, Zoom webhooks
4. **Scheduled Jobs** - Cron job for lesson reminders

See the plan file for full details: `~/.claude/plans/functional-crunching-squid.md`

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] `fix_email_triggers_schema.sql` executed successfully
- [ ] `add_email_triggers_translations.sql` executed successfully
- [ ] Trigger page loads without errors
- [ ] UI is fully translated to Hebrew
- [ ] Can create a new trigger
- [ ] Can edit existing trigger
- [ ] Can toggle trigger active/inactive
- [ ] Can delete trigger
- [ ] Template dropdown shows all templates
- [ ] Event dropdown shows all event types

## Common Issues

### Issue: Dialog still shows mixed languages
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Templates not loading in dropdown
**Solution:**
1. Check browser console for API errors
2. Verify templates API route exists: `/api/admin/emails/templates`
3. Check that templates have correct tenant_id

### Issue: Cannot create trigger
**Solution:**
1. Check browser console for validation errors
2. Verify all required fields are filled
3. Check that template_id is valid UUID

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Run `scripts/check-email-triggers-table.js` to verify table schema
4. Run `scripts/check-existing-templates.js` to verify templates exist
