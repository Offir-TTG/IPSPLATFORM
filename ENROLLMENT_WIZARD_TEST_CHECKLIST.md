# Enrollment Wizard Test Checklist

## Pre-Test Setup

### 1. Apply Database Fix
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run the SQL script from `APPLY_RPC_FIX.sql`
- [ ] Verify output shows: `volatility_label: 'VOLATILE'`

### 2. Deploy Latest Code
- [ ] Commit all changes: `git add . && git commit -m "Fix: Enrollment wizard navigation and RPC caching"`
- [ ] Push to production: `git push`
- [ ] Wait for Vercel deployment to complete

---

## Test Scenarios

### Scenario 1: New User - Full Enrollment Flow with Signature

**Setup:**
- Product requires signature
- Payment plan with deposit + installments
- User does not have account

**Steps:**
1. [ ] Access enrollment wizard with fresh token
2. [ ] **Profile Step:**
   - [ ] Fill all 5 fields: first_name, last_name, email, phone, address
   - [ ] Click "Next"
   - [ ] Verify no errors
3. [ ] **Signature Step:**
   - [ ] Click "Send Contract"
   - [ ] **VERIFY:** Check server logs - profile data should be saved to `wizard_profile_data` with all 5 fields
   - [ ] Wait for DocuSign embedded signing to load
   - [ ] Complete signature in DocuSign
   - [ ] DocuSign redirects back to wizard with `?docusign=complete`
4. [ ] **After DocuSign Return:**
   - [ ] **VERIFY:** Wizard calls sync-signature endpoint
   - [ ] **VERIFY:** Server logs show `signature_status: 'completed'`
   - [ ] **VERIFY:** Wizard fetches fresh data via RPC function
   - [ ] **VERIFY:** Server logs show `[Wizard Status] wizard_profile_data:` with all 5 fields
   - [ ] **CRITICAL:** Wizard should advance to **Payment Step** (not back to Profile)
5. [ ] **Payment Step:**
   - [ ] Verify deposit amount is clearly displayed vs total amount
   - [ ] Complete payment
   - [ ] Verify payment succeeds
6. [ ] **Password Step:**
   - [ ] Set password
   - [ ] Click "Complete Enrollment"
7. [ ] **Complete Step:**
   - [ ] Verify success message
   - [ ] Verify redirect to course or dashboard

**Expected Results:**
- ✅ Profile data persisted with all 5 fields in database
- ✅ Signature completed and status updated
- ✅ Wizard advances to payment (not back to profile)
- ✅ Fresh data fetched after DocuSign return (no stale cache)
- ✅ Payment completes successfully
- ✅ Enrollment completed

---

### Scenario 2: Existing User - Simplified Flow

**Setup:**
- Product requires signature
- Payment plan with deposit
- User already has account and is logged in

**Steps:**
1. [ ] Access enrollment wizard as logged-in user
2. [ ] **Profile Step:**
   - [ ] Verify email is pre-filled (disabled)
   - [ ] Fill remaining fields if needed: phone, address
   - [ ] Click "Next"
3. [ ] **Signature Step:**
   - [ ] Complete signature
   - [ ] Return from DocuSign
   - [ ] **VERIFY:** Wizard advances to Payment (skips Password step)
4. [ ] **Payment Step:**
   - [ ] Complete payment
5. [ ] **Complete Step:**
   - [ ] Verify enrollment completed
   - [ ] Verify no password step shown

**Expected Results:**
- ✅ Existing users skip password step
- ✅ Profile data saved correctly
- ✅ Navigation works without issues

---

### Scenario 3: Free Enrollment - Skip Payment

**Setup:**
- Product is free (payment_model = 'free')
- May or may not require signature

**Steps:**
1. [ ] Access enrollment wizard
2. [ ] Complete profile
3. [ ] Complete signature (if required)
4. [ ] **VERIFY:** Wizard skips payment step entirely
5. [ ] Set password (if new user)
6. [ ] Complete enrollment

**Expected Results:**
- ✅ Payment step completely skipped
- ✅ Enrollment completed without payment

---

### Scenario 4: Browser Back Button Handling

**Setup:**
- Any enrollment flow

**Steps:**
1. [ ] Complete profile step
2. [ ] Advance to signature step
3. [ ] Click browser back button
4. [ ] **VERIFY:** Wizard does NOT allow re-submission of profile
5. [ ] **VERIFY:** Wizard shows correct current step based on database state
6. [ ] Navigate forward again
7. [ ] Complete signature
8. [ ] Click browser back button during payment step
9. [ ] **VERIFY:** Does not create duplicate signature request

**Expected Results:**
- ✅ Back button does not cause duplicate submissions
- ✅ Wizard always determines step from database state
- ✅ Refs are properly reset after navigation

---

### Scenario 5: Profile Data Persistence

**Setup:**
- New user enrollment

**Steps:**
1. [ ] Access enrollment wizard
2. [ ] Fill profile with all 5 fields
3. [ ] Do NOT click "Next"
4. [ ] Close browser tab
5. [ ] Re-open enrollment wizard with same token
6. [ ] **VERIFY:** Profile fields are empty (expected - not saved until "Next" clicked)
7. [ ] Fill profile again
8. [ ] Click "Next" to signature step
9. [ ] Close browser tab (simulate crash)
10. [ ] Re-open enrollment wizard
11. [ ] **VERIFY:** Wizard returns to signature step (profile was saved when "Next" clicked)
12. [ ] Click back button
13. [ ] **VERIFY:** Profile fields show saved data

**Expected Results:**
- ✅ Profile data NOT saved until user clicks "Next"
- ✅ Profile data persists in database after saving
- ✅ Data survives browser close/crash after save

---

### Scenario 6: Payment Race Condition

**Setup:**
- Enrollment with payment required

**Steps:**
1. [ ] Complete profile and signature
2. [ ] Reach payment step
3. [ ] Complete payment in Stripe
4. [ ] **Immediately** (within 1 second) click "Complete Enrollment"
5. [ ] **VERIFY:** Complete endpoint enters retry loop (logs show retries)
6. [ ] **VERIFY:** Wait up to 20 seconds for webhook to process
7. [ ] **VERIFY:** Enrollment completes successfully (no "Payment required" error)

**Expected Results:**
- ✅ Retry loop waits up to 20 seconds (10 retries x 2 seconds)
- ✅ Webhook has time to update payment status
- ✅ No false "Payment required" errors

---

## Debugging Checklist

If wizard redirects to wrong step after signature:

1. [ ] Check server logs for `[Wizard Status]` entries
2. [ ] Verify RPC function returns fresh data:
   - [ ] `wizard_profile_data` should have all 5 fields
   - [ ] `signature_status` should be 'completed'
   - [ ] `updated_at` should be recent timestamp
3. [ ] Check if refs are being reset:
   - [ ] Look for `✅ RESET isReturningFromDocuSignRef = false` in logs
4. [ ] Check `determineCurrentStep()` logs:
   - [ ] Should show database state being checked first
   - [ ] Should show memory state sync

If profile data is missing fields:

1. [ ] Check send-contract endpoint logs:
   - [ ] `[Send Contract] Using profile data:` should show all 5 fields
   - [ ] `[Send Contract] Saving wizard_profile_data for new user:` should show all 5 fields
2. [ ] Check wizard-status endpoint logs:
   - [ ] `[Wizard Status] wizard_profile_data:` should show all 5 fields
3. [ ] Verify RPC function volatility:
   - [ ] Run: `SELECT provolatile FROM pg_proc WHERE proname = 'get_enrollment_fresh';`
   - [ ] Should return 'v' (VOLATILE), not 's' (STABLE)

---

## Known Issues Fixed

✅ **Issue 1:** Wizard redirecting to profile after DocuSign
- **Fix:** Reset refs after initial step determination AND before navigation
- **Verification:** Check logs for ref reset messages

✅ **Issue 2:** Profile data missing phone/address
- **Fix:** Changed RPC function from STABLE to VOLATILE
- **Verification:** Check RPC function volatility in database

✅ **Issue 3:** Memory state vs database state mismatch
- **Fix:** Check database state first in `determineCurrentStep()`, sync memory state
- **Verification:** Check logs for state sync messages

✅ **Issue 4:** Payment race condition (3-second window too short)
- **Fix:** Increased to 10 retries x 2 seconds = 20-second window
- **Verification:** Check complete endpoint logs for retry attempts

✅ **Issue 5:** Deposit amount unclear
- **Fix:** Added clear display of deposit vs total amount
- **Verification:** Check payment page UI

---

## Success Criteria

All scenarios pass with:
- ✅ No data loss
- ✅ No stale cache issues
- ✅ Correct step navigation
- ✅ No race conditions
- ✅ Clear error messages
- ✅ Smooth user experience
