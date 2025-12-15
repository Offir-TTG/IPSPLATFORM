# Test Webhook Flow

## Current Setup ✅
- Stripe CLI running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Webhook secret in database: `whsec_b1d1e669b4cca58db0c7526b8361b9bba3c979f27ff99239fabc8b88b750c4dc`
- Integration configured with API keys

## Steps to Test

### 1. Make a Test Payment

1. Go to enrollment wizard
2. Complete payment step
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date (e.g., 12/34)
5. Any 3-digit CVC (e.g., 123)

### 2. Watch Stripe CLI Terminal

You should see:
```
--> payment_intent.succeeded [evt_xxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**If you see `[200]`** = Webhook received successfully ✅

**If you see `[400]` or `[500]`** = Webhook failed ❌
- Check application logs for errors
- Check browser console for any API errors

### 3. Check Database After Payment

Run diagnostic:
```bash
npx tsx check-webhook-data.ts <enrollment-id>
```

Expected results:
```
✅ Enrollment Status: payment_status = 'partial' (or 'paid')
✅ Payment Schedules: 1 schedule marked as 'paid'
✅ Payment Records: 1 payment record created
✅ Webhook Events: 1 webhook event logged
```

### 4. Check Application Logs

Look for these log messages:

```
Stripe webhook event received: { type: 'payment_intent.succeeded', id: 'evt_...' }
Payment intent succeeded: pi_...
✓ Created payment record for intent pi_...
Payment succeeded for enrollment <id>: $800
```

## If Webhook Not Working

### Check 1: Is integration enabled?

```sql
SELECT integration_key, is_enabled
FROM integrations
WHERE integration_key = 'stripe';
```

Should be: `is_enabled = true`

### Check 2: Check server logs for errors

Look for:
- "Missing Stripe signature header"
- "Webhook secret not configured"
- "Invalid signature"
- "Enrollment not found"
- "Error creating payment record"

### Check 3: Verify metadata in payment intent

Go to Stripe Dashboard → Payments → Click on the payment → View metadata

Should have:
- `tenant_id`
- `enrollment_id`
- `payment_type`
- `schedule_id`

If metadata is missing, the webhook can't update the correct records.

## Manual Webhook Trigger (For Testing)

Using Stripe CLI, you can manually trigger webhooks:

```bash
# Trigger a test payment succeeded event
stripe trigger payment_intent.succeeded

# Check if it was received
npx tsx check-webhook-data.ts
```

## Debug: Enable Verbose Logging

Add to `src/app/api/webhooks/stripe/route.ts` after line 202:

```typescript
console.log('=== WEBHOOK DEBUG ===');
console.log('Payment Intent ID:', id);
console.log('Amount:', amount / 100);
console.log('Metadata:', metadata);
console.log('Enrollment ID:', enrollment_id);
console.log('Schedule ID:', schedule_id);
```

This will show exactly what data the webhook is receiving.
