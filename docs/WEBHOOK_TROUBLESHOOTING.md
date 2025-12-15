# Stripe Webhook Troubleshooting Guide

## Problem: Payments not updating database tables

When a payment succeeds in Stripe, these tables should be updated:
1. ✅ `payment_schedules` - Mark schedule as paid
2. ❌ `payments` - Create payment record (NOT WORKING)
3. ❌ `enrollments` - Update paid amount and status (NOT WORKING)
4. ❌ `webhook_events` - Log the webhook (NOT BEING CREATED)

## Root Cause

**Webhooks are not reaching the server** or **failing before processing**.

## Checklist

### 1. Check Stripe Integration in Database

```sql
SELECT integration_key, is_enabled, credentials->>'webhook_secret' as webhook_secret
FROM integrations
WHERE integration_key = 'stripe';
```

**Expected:**
- `is_enabled`: `true`
- `webhook_secret`: Should be set (starts with `whsec_`)

**If missing:** Configure Stripe integration in Admin → Integrations

### 2. Check if Running Locally

**Problem:** Stripe can't reach `localhost`

**Solution:** Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
# Then run:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret like `whsec_...`

Update your database with this temporary secret for testing:

```sql
UPDATE integrations
SET credentials = jsonb_set(
  credentials,
  '{webhook_secret}',
  '"whsec_YOUR_TEST_SECRET_HERE"'::jsonb
)
WHERE integration_key = 'stripe';
```

### 3. Check Webhook Endpoint in Stripe Dashboard

For production:
- Go to: https://dashboard.stripe.com/webhooks
- Click "+ Add endpoint"
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events to send:
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed`
  - ✅ `checkout.session.completed`
  - ✅ `charge.refunded`

### 4. Test Webhook Manually

**Using Stripe CLI:**

```bash
# Trigger a test payment_intent.succeeded event
stripe trigger payment_intent.succeeded
```

**Check if webhook was received:**

```sql
SELECT * FROM webhook_events
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Check Application Logs

When webhook is received, you should see:

```
Stripe webhook event received: { type: 'payment_intent.succeeded', id: 'evt_...' }
Payment intent succeeded: pi_...
✓ Created payment record for intent pi_...
Payment succeeded for enrollment <enrollment_id>: $800
```

**If you see errors:**

- `"Missing signature"` → Stripe signature header not sent
- `"Webhook secret not configured"` → Integration not set up in database
- `"Invalid signature"` → Wrong webhook secret
- `"Enrollment not found"` → Metadata missing from payment intent

### 6. Verify Payment Intent Has Metadata

When creating payment intent, ensure metadata is set:

```typescript
{
  tenant_id: 'uuid',
  enrollment_id: 'uuid',
  payment_type: 'deposit',
  schedule_id: 'uuid'
}
```

Check in Stripe Dashboard → Payments → Select payment → View metadata

## Common Issues

### Issue: "webhook_events table is empty"
**Cause:** Webhooks not reaching server
**Fix:** Use Stripe CLI or configure production webhook endpoint

### Issue: "payment_schedules updated but payments table empty"
**Cause:** Webhook creating schedule update but failing before creating payment record
**Check:** Application logs for errors around line 255-280 in webhook handler

### Issue: "enrollments table not updated"
**Cause:** Webhook failing at enrollment update step
**Check:**
- RLS policies on enrollments table
- Application logs around line 310-320 in webhook handler

## Testing Steps

1. **Set up Stripe CLI forwarding** (if local)
2. **Make a test payment** through enrollment wizard
3. **Check webhook was received:**
   ```sql
   SELECT event_type, processed_at
   FROM webhook_events
   WHERE event_type = 'payment_intent.succeeded'
   ORDER BY processed_at DESC LIMIT 1;
   ```
4. **Verify payment record created:**
   ```sql
   SELECT * FROM payments
   WHERE enrollment_id = 'your-enrollment-id'
   ORDER BY created_at DESC;
   ```
5. **Verify enrollment updated:**
   ```sql
   SELECT paid_amount, payment_status, deposit_paid
   FROM enrollments
   WHERE id = 'your-enrollment-id';
   ```

## Quick Diagnostic Script

Run: `npx tsx check-webhook-data.ts <enrollment_id>`

This will show:
- Enrollment payment status
- Payment schedules (paid/pending)
- Payment records
- Recent webhook events
- Identifies missing updates

## Reference

- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Payment service: `src/lib/payments/stripeService.ts`
- Diagnostic script: `check-webhook-data.ts`
