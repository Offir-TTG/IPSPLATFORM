# Audit System Migration Guide

## What This Migration Does

The migration script `20260126_audit_complete_cleanup_and_recreate.sql` performs a complete cleanup and recreation of your audit system.

### ✅ What Gets CREATED (actively used in your code):

1. **audit_events** - Main audit log table
   - Used in 40+ places across LMS, user management, enrollments
   - FERPA compliance tracking
   - Student record access logging

2. **audit_sessions** - Session tracking table
   - Used in user profile page to show active sessions
   - Security monitoring

3. **Views** (all actively queried):
   - `audit_student_record_access` - FERPA compliance
   - `audit_grade_changes` - Grade modification tracking
   - `audit_high_risk_events` - Security monitoring

4. **Functions** (used by auditService.ts):
   - `log_audit_event()` - Primary logging function
   - `verify_audit_chain()` - Integrity verification
   - `generate_compliance_report()` - Compliance reporting

### ❌ What Gets REMOVED (not used in your code):

- `audit_reports` - No code references found
- `audit_compliance_snapshots` - No code references found
- `audit_compliance_summary` (view) - No code references found
- `audit_alerts` - Minimally used (can add back if needed)
- `parental_consent_audit` - Only needed if you have users under 13

## How to Run the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire contents of `supabase/migrations/20260126_audit_complete_cleanup_and_recreate.sql`
4. Paste and run it
5. You should see "Audit system successfully recreated" at the end if successful

**Note:** The script has been fixed to remove RAISE NOTICE statements that were causing syntax errors.

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd c:\Users\OffirOmer\Documents\IPSPlatform

# Run the migration
supabase db push
```

### Option 3: Direct Database Connection

If you have direct database access:

```bash
psql "your-connection-string" -f supabase/migrations/20260126_audit_complete_cleanup_and_recreate.sql
```

## What Happens During Migration

1. ✅ **Drops all existing audit objects** (tables, views, functions, triggers)
2. ✅ **Creates clean enums** (event_type, event_category, event_status, risk_level)
3. ✅ **Creates audit_events table** with proper schema
4. ✅ **Creates audit_sessions table** for session tracking
5. ✅ **Creates indexes** for query performance
6. ✅ **Sets up RLS policies** for security
7. ✅ **Creates triggers** for automatic timestamp updates
8. ✅ **Creates views** for common queries
9. ✅ **Creates functions** used by your audit service
10. ✅ **Grants permissions** to authenticated users and service role

## After Migration

### Verify Everything Works

1. **Check tables exist:**
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'audit_%';
   ```
   Should return: `audit_events`, `audit_sessions`

2. **Check views exist:**
   ```sql
   SELECT viewname FROM pg_views WHERE viewname LIKE 'audit_%';
   ```
   Should return: `audit_student_record_access`, `audit_grade_changes`, `audit_high_risk_events`

3. **Test the log_audit_event function:**
   ```sql
   SELECT log_audit_event(
     auth.uid(),
     'READ'::event_type,
     'DATA'::event_category,
     'test',
     'test-123',
     'Test Event',
     'Testing audit system'
   );
   ```

4. **Query the audit_events table:**
   ```sql
   SELECT * FROM audit_events ORDER BY event_timestamp DESC LIMIT 5;
   ```

### Test Your Application

1. **User Profile Page** - Should show active sessions
   - Navigate to `/profile` or wherever users see their sessions
   - Verify "Active Sessions" section displays correctly

2. **Admin Audit Trail** - Should display audit events
   - Navigate to `/admin/audit`
   - Verify audit events are displayed in the table

3. **User Actions** - Should log automatically
   - Create/edit a lesson in LMS
   - Update user profile
   - Check that these actions appear in audit_events table

## If You Need Removed Tables Later

If you later realize you need `audit_alerts` or `parental_consent_audit`, I can provide separate migration scripts to add them back. Just let me know!

### To add back audit_alerts:
Useful if you want security alerting features.

### To add back parental_consent_audit:
Only needed if you have users under 13 years old (COPPA compliance).

## Rollback Plan

If something goes wrong, you can restore from backup:

1. **Before running migration**, create a backup:
   ```bash
   # In Supabase Dashboard: Settings > Database > Backups
   # Or via CLI:
   pg_dump "your-connection-string" > backup_before_audit_migration.sql
   ```

2. **To rollback**, restore the backup and run the old schema file:
   ```bash
   psql "your-connection-string" < backup_before_audit_migration.sql
   ```

## Support

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify your tenant_users table has proper foreign keys
3. Make sure your users table exists and has the expected columns
4. Check that you have the `gen_random_uuid()` function available

## Summary

This migration gives you a clean, optimized audit system with only the tables and views you actually use, removing the clutter of unused compliance features you don't need.

**Before running**: ~8 audit tables (many unused)
**After running**: 2 tables + 3 views (all actively used)

Result: Cleaner database, better performance, easier maintenance!
