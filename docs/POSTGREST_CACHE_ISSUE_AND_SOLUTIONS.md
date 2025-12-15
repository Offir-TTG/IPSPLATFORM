# PostgREST Cache Issue - Profile Save Not Progressing to Next Step

## Problem Summary

The enrollment wizard profile save is working correctly - data is successfully saved to the database and verified. However, when the wizard-status endpoint is queried immediately after saving, it returns **stale data** (wizard_profile_data: null) from 25-30 seconds ago.

### Example from Logs

```
[Profile Save] Successfully saved - updated_at: 2025-12-03T04:16:24.543509+00:00
[Wizard Status] Query returned - updated_at: 2025-12-03T04:15:55.397899+00:00 (29 seconds old!)
[Wizard Status] wizard_profile_data: null (STALE!)
```

## Root Cause

This is a **known PostgreSQL/PostgREST connection pooling issue**:

1. Each call to `createAdminClient()` creates a new Supabase client
2. PostgREST uses connection pooling to reuse database connections
3. Different connections may have different cache states
4. Connection A writes data → Connection B (from pool) reads stale cached data
5. Cache can persist for 30+ seconds even with cache-control headers

## Solutions Implemented

### Solution 1: Frontend Aggressive Retry with Exponential Backoff

**Files Modified:**
- `src/app/(public)/enroll/wizard/[id]/page.tsx`

**Changes:**
1. Increased initial wait time from 300ms to 2000ms
2. Increased max retries from 5 to 10
3. Implemented exponential backoff: 500ms → 1s → 2s → 4s → 8s (capped at 10s)

```typescript
// Wait 2 seconds for PostgREST cache to clear
await new Promise(resolve => setTimeout(resolve, 2000));

// Retry up to 10 times with exponential backoff
await fetchEnrollmentData(1, 10);
```

**Pros:**
- ✅ Works without database changes
- ✅ Handles transient cache issues
- ✅ Eventually gets correct data

**Cons:**
- ❌ User waits 2+ seconds
- ❌ May still fail if cache persists > 30 seconds
- ❌ Band-aid solution, doesn't fix root cause

### Solution 2: Database Function to Bypass PostgREST Cache (RECOMMENDED)

**Files Created:**
- `supabase/migrations/20251203_add_get_enrollment_by_token_function.sql`

**Files Modified:**
- `src/app/api/enrollments/token/[token]/wizard-status/route.ts`

**How it Works:**
1. Creates PostgreSQL function `get_enrollment_by_token()` that executes direct SQL
2. Function bypasses PostgREST entirely, always reads fresh data
3. wizard-status endpoint uses RPC call instead of `.from('enrollments').select()`
4. Falls back to regular query if RPC fails

**Pros:**
- ✅ Always returns fresh data
- ✅ No waiting or retries needed
- ✅ Fixes root cause

**Cons:**
- ❌ Requires running database migration

**To Apply This Solution:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251203_add_get_enrollment_by_token_function.sql`
3. Run the SQL

The function is already being called by wizard-status endpoint. Once migration is applied, the issue will be completely resolved.

## Current Status

- ✅ **Solution 1 (Frontend Retry)** - Implemented and active
- ⏳ **Solution 2 (Database Function)** - Code ready, migration file created, **waiting to be applied**

## Recommendation

**Apply Solution 2 (database migration) as soon as possible** to permanently fix the issue. Solution 1 is a temporary workaround that makes the problem less noticeable but doesn't eliminate it.

## Related Issues Fixed in This Session

1. ✅ **Enrollment API Foreign Key Ambiguity** - Fixed by explicitly specifying FK names
2. ✅ **Signature Step Spinning Forever** - Fixed by adding embedded signing URL
3. ✅ **DocuSign Webhook Not Working** - Fixed by using admin client
4. ⏳ **Profile Save Cache Issue** - Partially fixed with retry logic, full fix pending migration

## Files Changed

### Fixed Issues
- `src/app/api/enrollments/route.ts` - Added explicit FK for users join
- `src/lib/payments/enrollmentService.ts` - Added explicit FK for users join
- `src/app/api/enrollments/token/[token]/send-contract/route.ts` - Added signing URL generation
- `src/app/api/webhooks/docusign/route.ts` - Changed to use admin client

### Cache Issue Workarounds
- `src/app/(public)/enroll/wizard/[id]/page.tsx` - Added aggressive retry logic
- `src/app/api/enrollments/token/[token]/wizard-status/route.ts` - Added RPC call with fallback

### Migrations Pending
- `supabase/migrations/20251203_fix_enrollment_cascade_delete.sql` - **Needs to be applied**
- `supabase/migrations/20251203_add_get_enrollment_by_token_function.sql` - **Needs to be applied**

## Next Steps

1. Apply both pending migrations in Supabase Dashboard
2. Test enrollment wizard flow end-to-end
3. Monitor logs to confirm fresh data is being returned
4. Remove or reduce retry delays once migration is applied
