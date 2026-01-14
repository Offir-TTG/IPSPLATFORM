# Email Triggers - Quick Start Guide

## 🚨 Critical Issue

The email triggers page is crashing because the database table is missing required columns.

## ✅ Fix in 3 Steps

### Step 1: Fix Database Schema (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open file: `supabase/SQL Scripts/fix_email_triggers_schema.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**
5. You should see:
   ```
   ✓ Added send_time column
   ✓ Added send_days_before column
   ✓ Added recipient_role column
   ... (9 columns total)
   ========================================
   Added 9 missing columns
   ========================================
   ✅ All required columns exist in email_triggers table
   ```

### Step 2: Add Email Template Name Translations (30 seconds)

1. Still in **SQL Editor**
2. Open file: `supabase/SQL Scripts/add_all_template_name_translations.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**
5. You should see:
   ```
   ✅ Successfully added/updated all email template name translations
   Total: 11 templates × 2 languages = 22 translations
   ```

### Step 3: Add Trigger UI Translations (1 minute)

1. Still in **SQL Editor**
2. Open file: `supabase/SQL Scripts/add_email_triggers_translations.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**
5. You should see:
   ```
   ✅ Successfully added Email Triggers translations
   Total: 348 translations (174 keys × 2 languages)
   ```

### Step 4: Test (30 seconds)

1. **Hard refresh** your browser (Ctrl + Shift + R)
2. Navigate to **Admin → Emails → Triggers**
3. Page should load without errors
4. UI should be in Hebrew
5. Click **"יצירת טריגר"** (Create Trigger) button
6. Dialog should open with all fields in Hebrew

## 🎉 Done!

After these 3 SQL scripts run successfully, your email triggers system is ready to use.

## What You Can Do Now

- ✅ Create automated email triggers
- ✅ Configure when emails send (immediate, delayed, scheduled)
- ✅ Set conditions for sending
- ✅ Choose email templates
- ✅ Test triggers before activating
- ✅ Enable/disable triggers
- ✅ Edit and delete triggers

## Next Steps (Later)

After the UI is working, Phase 2 will implement:
- Backend trigger execution engine
- Integration with enrollment/payment events
- Zoom recording webhook integration
- Scheduled lesson reminder jobs

See full details in: `EMAIL_TRIGGERS_SETUP.md`

## Need Help?

**If page still crashes:**
1. Check browser console (F12) for errors
2. Run: `node scripts/check-email-triggers-table.js`
3. Verify all 3 SQL scripts completed successfully

**If UI not translated:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Verify translations SQL ran without errors
