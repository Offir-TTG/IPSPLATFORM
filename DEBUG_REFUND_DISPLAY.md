# Debug Guide: Refund Display Not Showing

## Summary

All code is verified correct:
- ✅ API endpoint passes authenticated Supabase client (line 49 in route.ts)
- ✅ Enrichment logic works (verified by test script)
- ✅ UI display code is correct (lines 1117-1121 in profile page)
- ✅ TypeScript types updated
- ✅ Translations added
- ✅ Debug logging added

**The issue is client-side caching.** Follow these steps exactly to force a complete refresh.

---

## STEP-BY-STEP TESTING PROCEDURE

### Step 1: Stop Dev Server
Press `Ctrl+C` in your terminal to completely stop the dev server.

### Step 2: Verify Cache is Cleared
The `.next` directory has already been deleted. Verify it's gone:
```bash
ls -la .next
```
You should see: "No such file or directory"

### Step 3: Start Dev Server Fresh
```bash
npm run dev
```

**WAIT** for the server to fully compile. You should see:
```
✓ Compiled in X.Xs
```

### Step 4: Close ALL Browser Tabs
- Close every tab for `localhost:3000`
- Close the entire browser if needed

### Step 5: Open Browser with DevTools

1. Open a **brand new browser window**
2. Press **F12** to open DevTools BEFORE navigating
3. Go to **Console tab**
4. Go to **Network tab**
5. **CHECK** the "Disable cache" checkbox in Network tab
6. Navigate to: `http://localhost:3000/profile?tab=billing`

### Step 6: Check Server Console (Terminal)

Look in your terminal where `npm run dev` is running. You should see:

```
[API] Returning schedules with refunds: [
  {
    payment_number: 5,
    refunded_amount: 200,
    payment_status: 'partially_refunded'
  }
]
```

**If you see this:** ✅ API is working correctly

**If you DON'T see this:** ❌ API is not returning refund data

### Step 7: Check Browser Console

In the browser Console tab, you should see:

```
[Profile] Schedules received from API: 13
[Profile] Schedule #5 has refunded_amount: 200
```

**If you see this:** ✅ Frontend is receiving refund data

**If you DON'T see this:** ❌ Frontend is not receiving refund data

### Step 8: Check Network Tab

1. In Network tab, find the request: `/api/enrollments/d352121d-df2e-454c-bb3e-83a82ab82e25/payment`
2. Click on it
3. Click the **Response** tab
4. Look for schedule with `payment_number: 5`
5. It should have:
   ```json
   {
     "payment_number": 5,
     "amount": "540.83",
     "status": "paid",
     "payment_status": "partially_refunded",
     "refunded_amount": 200,
     "refunded_at": "2026-01-26T19:56:44.971+00:00",
     "refund_reason": "Partial refund of $200.00"
   }
   ```

**If you see this:** ✅ API response is correct

### Step 9: Check Visual Display

Scroll down to the payment history list. Find Payment #5 (Due: June 24, 2026).

You should see:
```
$540.83
Refunded: $200.00  ← In purple text below the amount
```

**If you see this:** ✅ UI is displaying correctly

**If you DON'T see this:** Continue to Step 10

### Step 10: Hard Refresh

If the UI still doesn't show the refund:

1. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
2. This forces a hard refresh bypassing all cache
3. Check the browser Console again for the debug logs
4. Check the visual display again

---

## TROUBLESHOOTING

### Scenario 1: Server console shows refund data, browser console does NOT
**Problem:** Frontend code is cached
**Solution:**
```bash
# Stop dev server
# Run these commands:
rm -rf .next
rm -rf node_modules/.cache
npm run dev
# Then hard refresh browser (Ctrl+Shift+R)
```

### Scenario 2: Network tab shows refund data, but no console logs
**Problem:** JavaScript bundle is cached
**Solution:**
1. Open DevTools
2. Go to Application tab
3. Click "Clear storage" on the left
4. Check "Cache storage" and "Application cache"
5. Click "Clear site data" button
6. Hard refresh (Ctrl+Shift+R)

### Scenario 3: Console shows refund data, but UI doesn't display it
**Problem:** React component not re-rendering or CSS issue
**Solution:**
1. Check browser Console for JavaScript errors
2. Verify `formatCurrency` function exists
3. Verify `t()` translation function works
4. Check if the purple text color is being overridden by CSS

### Scenario 4: Server console shows nothing
**Problem:** API endpoint not being called or not reaching the debug log
**Solution:**
1. Check Network tab to confirm the API request is being made
2. Check if there are any 401/403 errors
3. Verify you're logged in as the correct user
4. Check server terminal for any error messages

---

## EXPECTED END RESULT

When everything is working, you should see **ALL of these**:

1. ✅ Server terminal: `[API] Returning schedules with refunds...`
2. ✅ Browser Console: `[Profile] Schedule #5 has refunded_amount: 200`
3. ✅ Network Response: `"refunded_amount": 200`
4. ✅ UI Display: Purple text "Refunded: $200.00" below payment amount

---

## NEXT STEPS

After completing all steps above, report back:
- What do you see in the **server console**?
- What do you see in the **browser console**?
- What do you see in the **Network Response tab**?
- What do you see **visually on the page**?

This will help pinpoint exactly where the issue is occurring.
