# Setup Verification Checklist

## Current Status

### ✅ Code Changes (Complete)
- [x] Updated `auditService.ts` to use SERVICE_ROLE_KEY
- [x] Added `createAdminClient()` to server.ts
- [x] Updated theme API to use admin client
- [x] Updated audit events API to use admin client
- [x] Modernized audit filters UI
- [x] Fixed TypeScript error in theme page
- [x] Build passes successfully

### ❌ Database Configuration (Pending)
- [ ] **SQL script NOT yet run in Supabase**
- [ ] UUID extension NOT enabled
- [ ] Service role permissions NOT granted

## The Problem

You're seeing this error:
```
Error logging audit event: {
  code: '42883',
  message: 'function uuid_generate_v4() does not exist'
}
```

This error occurs because:
1. The `uuid-ossp` extension is not enabled in your Supabase database
2. Without this extension, the `log_audit_event` function cannot generate UUIDs

## The Solution

You **MUST** run SQL in Supabase. Here's exactly what to do:

### Step 1: Open Supabase SQL Editor
1. Go to: https://dgdondsvtqbqnsecbayx.supabase.co
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Copy This Exact SQL
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;
```

### Step 3: Run the SQL
1. Paste the SQL into the query editor
2. Click the green **"Run"** button (or press Ctrl+Enter)
3. You should see "Success. No rows returned"

### Step 4: Verify
After running the SQL:
1. Try updating a theme in your app
2. The error should be gone
3. Check the `audit_events` table in Supabase - you should see new entries

## Why This Is Required

- **Code changes alone are not enough** - the database must be configured
- The application is already using SERVICE_ROLE_KEY for audit logging
- But Supabase needs the UUID extension enabled to generate correlation IDs
- And service role needs explicit permissions granted

## Troubleshooting

### If you can't access Supabase Dashboard
- Ask your database administrator to run the SQL
- Or provide them with the SQL script above

### If SQL fails to run
- Check if you have admin/owner permissions on the Supabase project
- Try running just the extension part first:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

### If error persists after running SQL
- Restart your Next.js dev server (Ctrl+C and `npm run dev`)
- Clear your browser cache
- Check Supabase logs for any other errors

## Files Created

All the fix files are ready in your project:
- `src/lib/supabase/FIX-AUDIT-PERMISSIONS-COMPLETE.sql` - Complete SQL script
- `src/lib/supabase/fix-service-role-permissions.sql` - Permissions only
- `FIX-AUDIT-LOGGING.md` - Detailed explanation

## Next Steps

1. ✅ **Run the SQL in Supabase** (this is blocking everything)
2. ✅ Restart dev server if needed
3. ✅ Test theme update
4. ✅ Verify audit events are being logged

The code is 100% ready. Only the database configuration is missing.
