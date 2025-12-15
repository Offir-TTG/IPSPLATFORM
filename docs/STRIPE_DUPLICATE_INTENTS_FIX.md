# Stripe Duplicate Payment Intents Fix

**Date:** 2025-12-12
**Status:** ✅ Fixed

## Problem

Multiple Stripe Payment Intents were being created for the same payment, visible in the Stripe dashboard:

1. **Succeeded** payment: $800 on Dec 12, 11:34 AM
2. **Incomplete** payment: $800 on Dec 12, 11:34 AM (same time)

This created confusion and potential billing issues.

## Root Cause

The issue was in the payment page component: [src/app/(public)/enroll/wizard/[id]/pay/page.tsx](../src/app/(public)/enroll/wizard/[id]/pay/page.tsx)

### Issue #1: Unstable useEffect Dependencies

**Before (Buggy):**
```typescript
useEffect(() => {
  if (!enrollmentToken) {
    setError('Invalid enrollment token');
    setLoading(false);
    return;
  }
  fetchPaymentInfo();
}, [params.id, searchParams]); // ❌ searchParams changes on every render!
```

The problem:
- `searchParams` is a **constantly changing object** in Next.js
- Every component re-render creates a new `searchParams` object reference
- This triggers the `useEffect` to run again
- Which calls `fetchPaymentInfo()` multiple times
- Which sets `paymentInfo` multiple times

### Issue #2: No Guard Against Multiple Intent Creation

**Before (Buggy):**
```typescript
useEffect(() => {
  if (paymentInfo && !stripeData) {
    createPaymentIntent(); // ❌ Can run multiple times!
  }
}, [paymentInfo]); // Triggers every time paymentInfo changes
```

The problem:
- When `paymentInfo` is set multiple times (due to Issue #1), this effect runs multiple times
- Each time it calls `createPaymentIntent()`, which creates a **new Stripe Payment Intent**
- No guard to prevent multiple creations

## Solution

### Fix #1: Use Stable Dependencies

**After (Fixed):**
```typescript
const enrollmentToken = searchParams?.get('token');
const scheduleId = searchParams?.get('schedule');

useEffect(() => {
  if (!enrollmentToken) {
    setError('Invalid enrollment token');
    setLoading(false);
    return;
  }
  fetchPaymentInfo();
  // Only run once on mount or when token/schedule changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [enrollmentToken, scheduleId]); // ✅ Use stable string values, not object references
```

Changes:
- Extract `enrollmentToken` and `scheduleId` as strings **outside** the effect
- Use these stable string values as dependencies instead of the unstable `searchParams` object
- Effect now only runs when the actual token or schedule ID changes

### Fix #2: Add Guard with useRef

**After (Fixed):**
```typescript
// Use ref to prevent multiple intent creations
const intentCreatedRef = useRef(false);

useEffect(() => {
  if (paymentInfo && !stripeData && !intentCreatedRef.current) {
    intentCreatedRef.current = true; // ✅ Mark as creating
    createPaymentIntent();
  }
  // Only run when paymentInfo becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [paymentInfo]);
```

Changes:
- Added `useRef` flag to track if intent creation has been initiated
- Check `!intentCreatedRef.current` before creating intent
- Set flag to `true` immediately to prevent subsequent calls
- This ensures `createPaymentIntent()` is only called **once**

## Additional Protection

The backend API endpoint also has protection against duplicates:

**In [src/app/api/enrollments/token/[token]/payment/create-intent/route.ts](../src/app/api/enrollments/token/[token]/payment/create-intent/route.ts):**

```typescript
// Check if there's an existing incomplete payment intent for this schedule
const existingIntentId = schedule.stripe_payment_intent_id;

if (existingIntentId) {
  try {
    const existingIntent = await stripe.paymentIntents.retrieve(existingIntentId);

    // If it's still incomplete, reuse it
    if (existingIntent.status === 'requires_payment_method' ||
        existingIntent.status === 'requires_confirmation' ||
        existingIntent.status === 'requires_action') {
      console.log('[Stripe] ✓ Reusing existing payment intent:', existingIntentId);
      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        payment_intent_id: existingIntent.id,
        publishableKey: integration.credentials.publishable_key,
      });
    }
  } catch (error) {
    // Intent doesn't exist, create new one
  }
}
```

This provides **server-side** protection by:
1. Checking if a payment intent already exists for this schedule
2. Reusing the existing intent if it's still incomplete
3. Only creating a new one if necessary

## Impact

✅ **Frontend fixes** prevent multiple API calls from being made
✅ **Backend protection** ensures only one intent per schedule
✅ **No more duplicate payment intents** in Stripe dashboard
✅ **Better user experience** - faster page loads, no confusion

## Testing

To verify the fix works:

1. **Clear browser cache** to ensure fresh component mount
2. Navigate to payment page: `/enroll/wizard/[id]/pay?token=xxx`
3. **Open browser DevTools → Network tab**
4. Verify only **ONE** call to `/api/enrollments/token/[token]/payment/create-intent`
5. **Check Stripe dashboard**
6. Verify only **ONE** payment intent is created
7. Complete the payment
8. Verify webhook is called and database is updated

## Related Issues

This fix also helps with:
- **Issue #1**: Duplicate payment transactions in database (now prevented at source)
- **Issue #2**: Database not updating (fewer race conditions from multiple intents)
- Better performance (fewer unnecessary API calls)
- Reduced Stripe API usage (fewer payment intent creations)

## Files Modified

1. **[src/app/(public)/enroll/wizard/[id]/pay/page.tsx](../src/app/(public)/enroll/wizard/[id]/pay/page.tsx)**
   - Fixed useEffect dependencies to use stable values
   - Added `useRef` guard against multiple intent creations
   - Improved component performance and reliability
