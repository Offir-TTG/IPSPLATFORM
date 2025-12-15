# Payment Webhook Diagnosis - December 12, 2025

## Current Status: WEBHOOKS NOT FIRING

### What We Know ✅

1. **Browser Console Shows:**
   - Wizard loads successfully
   - Payment step renders
   - Wizard redirects back with `?payment=complete` parameter
   - No JavaScript errors in console

2. **Database State:**
   - Enrollment: `7051d98f-6709-403a-9fbd-b4a7dcaa6e73`
   - 13 payment schedules created ✅
   - 0 payments recorded ❌
   - 0 webhook events ❌
   - Enrollment `payment_status`: `pending` ❌
   - Enrollment `paid_amount`: `0` ❌

3. **Stripe CLI:**
   - Running: ✅
   - Webhook secret configured: ✅ `whsec_b1d1e669b4cca58db0c7526b8361b9bba3c979f27ff99239fabc8b88b750c4dc`
   - Events received: **0** ❌

4. **Integration Table:**
   - Stripe integration configured ✅
   - `is_enabled`: `true` ✅
   - `webhook_secret` matches CLI ✅

### What We DON'T Know ❓

1. **Was create-intent endpoint called?**
   - No server logs visible in user's output
   - Browser network tab not checked
   - Payment intent ID unknown

2. **Was payment actually submitted?**
   - User clicked "Pay" button - unknown
   - Payment form filled out - unknown
   - Stripe confirmPayment() called - unknown

3. **Did payment succeed in Stripe?**
   - No payment intent ID to check
   - No Stripe dashboard verification
   - No webhook event received

## The Problem

### Most Likely: Payment Intent Never Created

Looking at the browser console logs, we see:
```
[Wizard] Loading wizard for ID: 71f47e27-3dc1-4ad7-9d84-d5aa92b43a6e
[Wizard] Wizard data loaded successfully
...
[Wizard] Wizard completed, returning to view
```

**But we do NOT see:**
- `POST /api/enrollments/token/.../payment/create-intent` network request
- `[Stripe] Checking for existing intent...` server log
- `[Stripe] Creating new payment intent...` server log
- Payment intent client secret received

### Code Flow Analysis

#### Expected Flow:
1. User navigates to `/enroll/wizard/[id]/pay?token=...&schedule=...`
2. `pay/page.tsx` loads
3. `useEffect` calls `fetchPaymentInfo()` → GET `/api/enrollments/token/.../payment`
4. Payment info returned, `setPaymentInfo()` updates state
5. Second `useEffect` triggers when `paymentInfo` is set
6. `createPaymentIntent()` called → POST `/api/enrollments/token/.../payment/create-intent`
7. Payment intent created in Stripe
8. Client secret returned
9. `StripePaymentForm` renders with client secret
10. User fills form and clicks "Pay"
11. `stripe.confirmPayment()` called
12. Payment succeeds in Stripe
13. Stripe sends `payment_intent.succeeded` webhook
14. Webhook handler updates database tables

#### Actual Flow (Based on Evidence):
1. ✅ User navigates to pay page
2. ✅ `pay/page.tsx` loads
3. ❓ `fetchPaymentInfo()` - no evidence
4. ❓ Payment info returned - browser shows wizard completing, not payment form
5. ❌ `createPaymentIntent()` - NO evidence this was called
6. ❌ No payment intent created
7. ❌ No Stripe interaction
8. ✅ Wizard redirects back with `?payment=complete`

### Why Wizard Shows "Complete" Without Payment

Looking at the browser logs:
```
[Wizard] Step changed to: complete
[Wizard] Current URL search params: ?token=...&payment=complete
```

The wizard thinks payment is complete because:
1. URL has `?payment=complete` parameter
2. But this parameter is added by the payment page's `handlePaymentSuccess()` callback
3. Which should only be called after `paymentIntent.status === 'succeeded'`

**Contradiction:** If payment succeeded, there MUST be a payment intent, and Stripe MUST have sent a webhook.

### Possible Explanations

#### Theory 1: Payment Page Never Rendered
- `fetchPaymentInfo()` failed silently
- Payment info error occurred
- User never saw Stripe payment form
- Wizard somehow skipped to complete

#### Theory 2: Browser Cache/Session Issue
- Old session state showing "payment complete"
- Browser cached the redirect
- User seeing stale wizard state

#### Theory 3: Code Path Bypass
- Some code path marks payment as complete without actually processing
- Logic error in wizard step progression
- Token or schedule ID invalid

## Diagnostic Steps Needed

### 1. Check Server Console Output

**User needs to check their terminal where `npm run dev` is running.**

Look for these log messages when attempting payment:

**From `pay/page.tsx` (lines 98, 134):**
```
Error fetching payment info: <error>
Error creating payment intent: <error>
```

**From `create-intent/route.ts` (lines 96, 102, 108, 115, 122, 195, 206):**
```
[Stripe] Checking for existing intent. Schedule ID: ... Intent ID: ...
[Stripe] Found existing intent with status: ...
[Stripe] ✓ Reusing existing payment intent: ...
[Stripe] No existing intent ID found - creating new one
[Stripe] Storing payment intent ID in schedule: ...
[Stripe] ✓ Successfully stored payment intent ID
```

**From webhook handler (lines 73, 202, 252, 279, 322):**
```
Stripe webhook event received: { type: 'payment_intent.succeeded', id: 'evt_...' }
Payment intent succeeded: pi_...
Payment record already exists for intent pi_..., skipping creation
✓ Created payment record for intent pi_...
Payment succeeded for enrollment <id>: $...
```

### 2. Check Browser Network Tab

**User needs to open DevTools → Network tab and attempt payment again.**

Look for these requests:
1. `GET /api/enrollments/token/.../payment` - Should return payment schedules
2. `POST /api/enrollments/token/.../payment/create-intent` - Should return client secret
3. Check response bodies for errors

### 3. Check Stripe Dashboard

**User should check Stripe Test Dashboard → Payments**

Look for:
- Recent payment intents
- Payment intent ID starting with `pi_`
- Status (succeeded, requires_payment_method, etc.)
- Metadata (should include enrollment_id, schedule_id, tenant_id)

### 4. Verify Wizard Flow

**User should:**
1. Start fresh enrollment wizard
2. Complete profile step
3. Complete signature step
4. Check what happens at payment step - does Stripe form appear?
5. Check browser console for errors
6. Check server console for logs

## Quick Fix to Test

### Add Debugging to Payment Page

Edit `src/app/(public)/enroll/wizard/[id]/pay/page.tsx`:

**After line 95 (in fetchPaymentInfo):**
```typescript
console.log('[Payment] Fetching payment info for token:', enrollmentToken);
console.log('[Payment] Response:', data);
```

**After line 132 (in createPaymentIntent):**
```typescript
console.log('[Payment] Creating payment intent for schedule:', paymentInfo!.schedule_id);
console.log('[Payment] Response:', data);
```

**After line 56 (in handlePaymentSuccess):**
```typescript
console.log('[Payment] Payment succeeded, redirecting...');
```

This will show in browser console exactly what's happening.

## Next Steps

1. **User must provide server console logs** - This is critical to understand if endpoints are being called
2. **User must check browser network tab** - Shows API requests/responses
3. **User should verify Stripe CLI is actually listening** - Run `stripe listen --print-secret` to confirm
4. **Check if payment form actually appears** - User may be bypassing it somehow

## Expected Resolution Path

Once we see the server logs, we'll know:
- ✅ If create-intent is being called → debug why payment not succeeding
- ❌ If create-intent NOT being called → debug why payment page failing to load
- Then we can trace the exact failure point and fix it

## Files to Review

- Payment page: `src/app/(public)/enroll/wizard/[id]/pay/page.tsx`
- Create intent: `src/app/api/enrollments/token/[token]/payment/create-intent/route.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Payment form: `src/components/payments/StripePaymentForm.tsx`
