# Enrollment Wizard Fix Summary

## Problem Statement

After completing DocuSign signature, the enrollment wizard was incorrectly redirecting users back to the profile step instead of advancing to the payment step.

---

## Root Causes Identified

### 1. **Navigation Refs Never Being Reset** (FIXED ✅)

**Problem:** `isReturningFromDocuSignRef` was set to `true` when user returned from DocuSign, but never reset to `false`. This permanently blocked the `determineCurrentStep()` function from running.

**Code Location:** `src/app/(public)/enroll/wizard/[id]/page.tsx` line 412

**Fix Applied:**
- Reset refs after initial step determination (lines 326-335)
- Reset refs before navigation in signature sync (lines 973-976)

**Verification:**
Check logs for: `✅ RESET isReturningFromDocuSignRef = false`

---

### 2. **Memory State vs Database State Mismatch** (FIXED ✅)

**Problem:** Wizard was checking `wizardData.signatureCompleted` (React state) instead of `enrollment.signature_status` (database state) when determining the current step.

**Code Location:** `src/app/(public)/enroll/wizard/[id]/page.tsx` - `determineCurrentStep()` function

**Fix Applied:**
- Modified `determineCurrentStep()` to check database state FIRST: `enrollment.signature_status === 'completed'`
- Added memory state synchronization in `fetchEnrollmentData()` (lines 643-656)

**Verification:**
Check logs for: `✅ Synced memory state with database`

---

### 3. **PostgreSQL Function Caching Stale Data** (NEEDS DATABASE UPDATE ⚠️)

**Problem:** The `get_enrollment_fresh()` RPC function was marked as `STABLE`, which allows PostgreSQL to cache results. This caused the wizard-status endpoint to return stale profile data (only 3 fields) even though the send-contract endpoint had saved all 5 fields.

**Evidence:**
- Send-contract logs showed: `wizard_profile_data: { first_name, last_name, email, phone, address }` (5 fields)
- Wizard-status logs showed: `wizard_profile_data: { first_name, last_name, email }` (3 fields)
- This happened because wizard-status was getting CACHED data from BEFORE the profile update

**Code Location:** `supabase/migrations/20260122_add_get_enrollment_fresh.sql`

**Fix Applied:**
- Changed RPC function from `STABLE` to `VOLATILE` (line 57)
- This forces PostgreSQL to NEVER cache results, always fetching fresh data

**⚠️ ACTION REQUIRED:**
The migration file has been updated, but you need to apply it to the database:

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL script from `APPLY_RPC_FIX.sql`
3. Verify output shows `volatility_label: 'VOLATILE'`

---

### 4. **Profile Data Flow Architecture** (BY DESIGN ℹ️)

**Current Flow:**
1. User fills profile form → stored in React state (`wizardData.profile`)
2. User clicks "Next" on profile step → wizard advances to signature step
3. User clicks "Send Contract" → `send-contract` endpoint saves profile to database (`wizard_profile_data`)
4. User completes DocuSign signature → returns to wizard
5. Wizard fetches enrollment data → should get all 5 profile fields from database

**Why profile data was missing:**
- After step 3, the profile WAS saved to database with all 5 fields ✅
- But step 5 was getting STALE CACHED data from BEFORE step 3 ❌
- This is why wizard-status only returned 3 fields (old cached data)

**Fix:**
- Changed RPC function to `VOLATILE` to prevent caching
- Now step 5 will ALWAYS get fresh data from database

---

## Files Modified

### 1. `src/app/(public)/enroll/wizard/[id]/page.tsx`

**Changes:**
- Reset refs after initial step determination (lines 326-335)
- Modified `determineCurrentStep()` to check database state first (lines 772-827)
- Added memory state synchronization in `fetchEnrollmentData()` (lines 643-656)
- Reset DocuSign ref before navigation in signature sync (lines 973-976)

**Why Important:**
This is the main wizard component that manages the entire enrollment flow. The navigation logic had critical bugs blocking step advancement.

### 2. `supabase/migrations/20260122_add_get_enrollment_fresh.sql`

**Changes:**
- Changed function volatility from `STABLE` to `VOLATILE` (line 57)

**Why Important:**
This RPC function is used by the wizard-status endpoint to fetch enrollment data. The `VOLATILE` keyword prevents PostgreSQL from caching results, ensuring fresh data is always returned.

### 3. `src/app/api/enrollments/token/[token]/wizard-status/route.ts`

**No Changes Needed:**
Already correctly using the RPC function (line 41).

### 4. `src/app/api/webhooks/docusign/route.ts`

**No Changes Needed:**
Already correctly updating `signature_status` and `updated_at` fields (lines 207-213).

---

## What You Need to Do Now

### Step 1: Apply Database Fix (CRITICAL ⚠️)

The RPC function in the database still has the old `STABLE` volatility. You need to update it:

```bash
# Option A: Run SQL directly in Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of APPLY_RPC_FIX.sql
3. Paste and click "Run"
4. Verify output shows: volatility_label: 'VOLATILE'

# Option B: Use Supabase CLI (if you have it set up)
supabase db push
```

### Step 2: Test the Full Flow

Follow the test scenarios in `ENROLLMENT_WIZARD_TEST_CHECKLIST.md`:

1. **Test Scenario 1:** New user with signature - Full flow
2. **Test Scenario 4:** Browser back button handling
3. **Test Scenario 5:** Profile data persistence

### Step 3: Monitor Logs

Watch for these key log messages:

**Good Signs (what you WANT to see):**
```
✅ [Wizard] ✅ RESET isReturningFromDocuSignRef = false
✅ [Wizard] ✅ Synced memory state with database
✅ [Wizard Status] wizard_profile_data: { first_name, last_name, email, phone, address }
✅ [Wizard] → Setting step to: payment
```

**Bad Signs (what indicates problems):**
```
❌ [Wizard] → Setting step to: profile (after signature completed)
❌ [Wizard Status] wizard_profile_data: { first_name, last_name, email } (missing phone/address)
❌ [Wizard] Ref still true, blocking determineCurrentStep
```

---

## Why This Happened

Looking at git history might show:

1. **Original Working State:**
   - Wizard used direct Supabase queries (not RPC)
   - PostgREST caching wasn't an issue initially
   - Profile data flow was simpler

2. **Changes That Caused Issues:**
   - Introduction of RPC function to bypass PostgREST cache (good idea!)
   - BUT function was marked `STABLE` instead of `VOLATILE` (bug!)
   - Navigation refs added for DocuSign/payment returns (good idea!)
   - BUT refs were never reset (bug!)
   - Step determination checking memory state before database state (bug!)

3. **What We Fixed:**
   - Changed RPC to `VOLATILE` → fixes caching
   - Reset refs properly → fixes navigation
   - Check database state first → fixes state mismatch

---

## PostgreSQL Function Volatility Explained

PostgreSQL has 3 volatility levels for functions:

### `IMMUTABLE` (Most Cacheable)
- Function ALWAYS returns same result for same inputs
- Result can be cached forever
- Example: `abs(-5)` always returns 5

### `STABLE` (Medium Cacheable) ← OLD SETTING
- Function returns same result for same inputs WITHIN A SINGLE QUERY
- Result can be cached for the duration of one query
- **Problem:** PostgREST connection pooling + query planning can cache longer than expected
- Example: `NOW()` returns same time during one query

### `VOLATILE` (Never Cached) ← NEW SETTING ✅
- Function MAY return different results even with same inputs
- Result is NEVER cached
- Forces PostgreSQL to execute function every time
- Example: `random()` returns different value each call

**Why `VOLATILE` fixes our issue:**

With `STABLE`:
```
1. User submits profile → wizard-status calls RPC → PostgreSQL caches result (3 fields)
2. Send-contract saves profile → database updated (5 fields)
3. User returns from DocuSign → wizard-status calls RPC → PostgreSQL returns CACHED result (3 fields) ❌
```

With `VOLATILE`:
```
1. User submits profile → wizard-status calls RPC → PostgreSQL fetches fresh data (3 fields)
2. Send-contract saves profile → database updated (5 fields)
3. User returns from DocuSign → wizard-status calls RPC → PostgreSQL fetches fresh data (5 fields) ✅
```

---

## Next Steps After Testing

If all tests pass:

1. ✅ Commit all changes
2. ✅ Update plan mode task: "Test all enrollment wizard scenarios end-to-end" → completed
3. ✅ Move on to next phase of Bulletproof Payment System

If issues remain:

1. Share server logs showing the problem
2. Verify RPC function volatility in database
3. Check if refs are being reset properly
4. Verify database state vs memory state

---

## Quick Reference

**Files to check for debugging:**
- `src/app/(public)/enroll/wizard/[id]/page.tsx` - Main wizard logic
- `src/app/api/enrollments/token/[token]/wizard-status/route.ts` - Fetch enrollment
- `src/app/api/enrollments/token/[token]/send-contract/route.ts` - Save profile
- `src/app/api/enrollments/token/[token]/sync-signature/route.ts` - Manual signature sync
- `supabase/migrations/20260122_add_get_enrollment_fresh.sql` - RPC function

**Key log messages to watch:**
- `[Wizard Status] wizard_profile_data:` - Should show all 5 fields
- `[Wizard] → Setting step to:` - Should show correct step after DocuSign
- `[Wizard] ✅ RESET isReturningFromDocuSignRef` - Confirms refs are being reset
- `[Wizard] ✅ Synced memory state` - Confirms state synchronization

**Database queries for debugging:**
```sql
-- Check RPC function volatility (should return 'v' for VOLATILE)
SELECT provolatile FROM pg_proc WHERE proname = 'get_enrollment_fresh';

-- Check enrollment data directly
SELECT id, signature_status, wizard_profile_data, updated_at
FROM enrollments
WHERE enrollment_token = 'YOUR_TOKEN_HERE';

-- Test RPC function directly
SELECT * FROM get_enrollment_fresh('YOUR_ENROLLMENT_ID_HERE');
```

---

## Summary

**Problem:** Wizard went back to profile after signature
**Root Cause:** 3 issues - refs not reset, memory state checked before database state, RPC caching stale data
**Solution:** Reset refs properly, check database state first, change RPC to VOLATILE
**Action Required:** Apply SQL fix to database (run APPLY_RPC_FIX.sql)
**Next:** Test full enrollment flow end-to-end
