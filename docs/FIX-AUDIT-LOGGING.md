# Fix for Audit Logging Permission Errors

## Problem
The theme update was showing "Failed to save theme" and audit logging was failing with:
```
Error logging audit event: {
  code: '42501',
  message: 'permission denied for table users'
}
```

## Root Cause
The audit service ([src/lib/audit/auditService.ts](src/lib/audit/auditService.ts)) was using the `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is subject to Row Level Security (RLS) policies. When trying to log audit events, it needed to check user roles from the `users` table, which caused permission denied errors due to RLS recursion.

## Solution Applied

### 1. Updated Audit Service to Use Service Role Key ✅
Changed [src/lib/audit/auditService.ts:17-34](src/lib/audit/auditService.ts#L17-L34) to use `SUPABASE_SERVICE_ROLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

```typescript
// Before
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
supabase = createClient(supabaseUrl, supabaseAnonKey);

// After
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### 2. Grant Service Role Permissions in Database
You need to run the SQL script in your Supabase SQL Editor:

**File:** [src/lib/supabase/fix-service-role-permissions.sql](src/lib/supabase/fix-service-role-permissions.sql)

```sql
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all permissions on ALL existing tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

## Steps to Complete the Fix

### Step 1: Restart Development Server
The code changes have been made. You need to restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 2: Run SQL Script in Supabase
1. Go to your Supabase Dashboard: https://dgdondsvtqbqnsecbayx.supabase.co
2. Navigate to SQL Editor
3. Copy the contents of `src/lib/supabase/fix-service-role-permissions.sql`
4. Paste and run the SQL script
5. Verify it completes without errors

### Step 3: Test Theme Update
1. Go to Admin → Settings → Theme
2. Try updating a theme configuration
3. The update should now succeed and audit events should be logged without errors

## What This Fix Does

### Service Role Pattern
The application now follows a consistent pattern for admin operations:

1. **Authentication**: Use regular client (`createClient()`) to verify user identity
2. **Authorization**: Use admin client (`createAdminClient()`) to check user role
3. **Operations**: Use admin client for database operations that require RLS bypass
4. **Audit Logging**: Uses service role key automatically via `auditService.ts`

### Files Updated in This Session
- ✅ [src/lib/supabase/server.ts](src/lib/supabase/server.ts) - Added `createAdminClient()` function
- ✅ [src/app/api/audit/events/route.ts](src/app/api/audit/events/route.ts) - Uses admin client
- ✅ [src/app/api/admin/theme/route.ts](src/app/api/admin/theme/route.ts) - Uses admin client for PUT
- ✅ [src/lib/audit/auditService.ts](src/lib/audit/auditService.ts) - Uses service role key
- ✅ [src/components/audit/AuditFilters.tsx](src/components/audit/AuditFilters.tsx) - Modernized to collapsible design
- ✅ [src/components/audit/AuditEventsTable.tsx](src/components/audit/AuditEventsTable.tsx) - Updated empty state icon to Shield

## Verification

After completing the steps above, you should see:
- Theme updates succeed without "Forbidden" errors
- Audit events are logged successfully in the `audit_events` table
- No "permission denied for table users" errors in console
- Theme changes appear in the audit log at Admin → Audit Trail

## Additional Notes

### Why Service Role Key?
- The service role key bypasses ALL Row Level Security (RLS) policies
- This is necessary for system-level operations like audit logging
- It's safe to use server-side only (NEVER expose to client)
- Already configured in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Alternative Approach
Instead of using service role, you could use `SECURITY DEFINER` functions as shown in [src/lib/supabase/PERMANENT-RLS-FIX.sql](src/lib/supabase/PERMANENT-RLS-FIX.sql), but the admin client pattern is simpler and more maintainable.
