# Stripe CLI Webhook Fix

## Problem
Payments are succeeding in Stripe, but webhooks are not reaching the local server.

## Solution Steps

### 1. Stop Current Stripe CLI
In the terminal where Stripe CLI is running, press `Ctrl+C` to stop it.

### 2. Restart Stripe CLI with Verbose Logging
Run this command:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe --print-secret --log-level debug
```

This will:
- Forward webhooks to your local server
- Print the webhook signing secret
- Show debug logs for each event

### 3. Test with Stripe CLI Trigger
In a NEW terminal, run:
```bash
stripe trigger payment_intent.succeeded
```

You should see in the Stripe CLI terminal:
```
--> payment_intent.succeeded [evt_xxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

And in your server console (`npm run dev`):
```
Stripe webhook event received: { type: 'payment_intent.succeeded', id: 'evt_...' }
```

### 4. Check Database After Trigger
Run:
```bash
npx tsx check-webhook-data.ts [enrollment-id]
```

Look for webhook events in the output.

### 5. Make Another Real Payment
Once the test trigger works:
1. Go to enrollment wizard
2. Complete payment with test card `4242 4242 4242 4242`
3. Watch Stripe CLI terminal for webhook event
4. Verify database updates

## Common Issues

### Issue: Stripe CLI Not Showing Events

**Cause:** CLI might be listening to test mode, but payment in live mode (or vice versa)

**Fix:** Make sure you're in the correct mode:
```bash
# For test mode (recommended for development)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe --api-key sk_test_...
```

### Issue: Port 3000 Not Responding

**Cause:** Next.js dev server not running or running on different port

**Fix:**
1. Check `npm run dev` is running
2. Verify it shows `Local: http://localhost:3000`
3. If on different port, update Stripe CLI command

### Issue: Webhook Returns 401 or 500

**Cause:** Webhook secret mismatch

**Fix:**
1. Get the webhook secret from Stripe CLI output (starts with `whsec_`)
2. Update database:
   ```sql
   UPDATE integrations
   SET credentials = jsonb_set(
     credentials,
     '{webhook_secret}',
     '"whsec_YOUR_SECRET_HERE"'::jsonb
   )
   WHERE integration_key = 'stripe';
   ```

## Verify Everything Works

### Checklist:
- [ ] Stripe CLI running and showing "Ready!"
- [ ] `npm run dev` running on port 3000
- [ ] Webhook endpoint accessible: `curl http://localhost:3000/api/webhooks/stripe`
- [ ] Test trigger works: `stripe trigger payment_intent.succeeded`
- [ ] Webhook events appear in database
- [ ] Real payment triggers webhook
- [ ] Database tables update correctly

## Alternative: Use ngrok (If Stripe CLI Still Fails)

If Stripe CLI continues to have issues, use ngrok:

```bash
# Install ngrok: https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Add webhook endpoint in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# Endpoint URL: https://abc123.ngrok.io/api/webhooks/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed

# Update database with webhook secret from Stripe Dashboard
```
