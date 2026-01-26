# Verify RPC Fix Was Applied

## Step 1: Check Function Volatility

Run this query in Supabase SQL Editor:

```sql
SELECT
  proname as function_name,
  provolatile as volatility_code,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE ❌'
    WHEN 's' THEN 'STABLE ❌ (STILL BROKEN)'
    WHEN 'v' THEN 'VOLATILE ✅ (FIXED!)'
  END as volatility_description
FROM pg_proc
WHERE proname = 'get_enrollment_fresh';
```

**Expected Result:**
```
function_name: get_enrollment_fresh
volatility_code: v
volatility_description: VOLATILE ✅ (FIXED!)
```

If you see `STABLE ❌`, the fix was NOT applied. Run APPLY_RPC_FIX.sql again.

---

## Step 2: Test the Enrollment Wizard

1. **Open your browser** to the enrollment wizard
2. **Refresh the page** (F5 or Ctrl+R)
3. **Fill the profile form** with all 5 fields:
   - First Name: Offir
   - Last Name: Omer
   - Email: offir.omer@gmail.com
   - Phone: +12013643030
   - Address: 14 Venus Dr, Closter, NJ 07624, USA

4. **Click "Next"** → Should advance to signature step

5. **Click "Send Contract"** → DocuSign should load

6. **Complete the signature** in DocuSign

7. **DocuSign redirects back to wizard**

---

## Step 3: Check the Logs

Look for these log messages in the browser console:

### ✅ GOOD SIGNS (What you WANT to see):

```
[Send Contract] Saving wizard_profile_data for new user: {
  first_name: 'Offir',
  last_name: 'Omer',
  email: 'offir.omer@gmail.com',
  phone: '+12013643030',
  address: '14 Venus Dr, Closter, NJ 07624, USA'
}

[Wizard Status] wizard_profile_data: {
  first_name: 'Offir',
  last_name: 'Omer',
  email: 'offir.omer@gmail.com',
  phone: '+12013643030',  // ✅ PHONE IS HERE!
  address: '14 Venus Dr, Closter, NJ 07624, USA'  // ✅ ADDRESS IS HERE!
}

[Wizard Status] userProfileComplete: true  // ✅ NOW TRUE!

[Wizard] → Setting step to: payment  // ✅ ADVANCES TO PAYMENT!
```

### ❌ BAD SIGNS (What indicates fix NOT applied):

```
[Wizard] FAILED after 3 retries - PostgREST still serving stale/incomplete data

[Wizard Status] wizard_profile_data: {
  first_name: 'Offir',
  last_name: 'Omer',
  email: 'offir.omer@gmail.com'
  // ❌ MISSING phone and address
}

[Wizard Status] userProfileComplete: false  // ❌ STILL FALSE

[Wizard] → Setting step to: profile  // ❌ GOES BACK TO PROFILE
```

---

## Step 4: Troubleshooting

If you still see the BAD SIGNS:

### A. Check if SQL was run in correct database

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dgdondsvtqbqnsecbayx
2. Click "SQL Editor" in left sidebar
3. Run the verification query from Step 1
4. If it shows `STABLE`, the fix wasn't applied to this database

### B. Verify you're connected to the right Supabase instance

Check your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://dgdondsvtqbqnsecbayx.supabase.co
```

This should match the Supabase project you ran the SQL in.

### C. Clear all caches

1. **Browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Supabase client**: Restart your Next.js dev server:
   - Stop server (Ctrl+C in terminal)
   - Run `npm run dev` again

---

## What Should Happen After Fix

1. **Profile data saves correctly** - All 5 fields in database
2. **RPC returns fresh data** - No more stale cache
3. **Wizard advances to payment** - Doesn't go back to profile
4. **No retry errors** - No "FAILED after 3 retries" messages

---

## Summary

The fix changes the PostgreSQL function from `STABLE` (cacheable) to `VOLATILE` (never cached).

**Before fix:**
- PostgreSQL caches result from BEFORE profile save
- Wizard gets old data (only 3 fields)
- Wizard thinks profile incomplete
- Goes back to profile step

**After fix:**
- PostgreSQL never caches, always fetches fresh data
- Wizard gets new data (all 5 fields)
- Wizard knows profile complete
- Advances to payment step

The fix is **database-only** - no code changes needed, no restart needed. Once applied, it works immediately.
