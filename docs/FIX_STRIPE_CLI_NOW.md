# Fix Stripe CLI Webhook Forwarding - IMMEDIATE STEPS

## Problem
Payments succeed in Stripe Dashboard, but Stripe CLI shows NO events.

## Root Cause
The Stripe CLI is either:
1. Not authenticated to the correct Stripe account
2. Crashed/stopped without showing an error
3. Listening to live mode while payments are in test mode (or vice versa)

## SOLUTION - Do These Steps NOW

### Step 1: Stop the Current Stripe CLI

In the terminal where Stripe CLI is running:
- Press `Ctrl+C` to stop it
- If it doesn't stop, close that terminal completely

### Step 2: Verify Stripe CLI Installation

Open a NEW terminal and run:
```bash
stripe --version
```

If you get an error, reinstall Stripe CLI from: https://stripe.com/docs/stripe-cli

### Step 3: Re-authenticate Stripe CLI

Run this command:
```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to select your Stripe account
3. Authenticate the CLI

**IMPORTANT:** Make sure you select the SAME Stripe account where the payment succeeded.

### Step 4: Verify You're in Test Mode

Run:
```bash
stripe config --list
```

Look for the line showing `test_mode`. It should say `true` for development.

### Step 5: Start Stripe CLI with Full Logging

Run this command:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe --print-secret --log-level debug
```

You should see:
```
Ready! You are using Stripe API Version [xxx].
Your webhook signing secret is whsec_...
(^C to quit)
```

### Step 6: Update Webhook Secret in Database

Copy the webhook secret from the CLI output (starts with `whsec_`).

Then run this script I'll create for you:

```bash
npx tsx update-webhook-secret.ts whsec_YOUR_SECRET_HERE
```

### Step 7: Test with Stripe Trigger

Open a SECOND terminal (keep the CLI running) and run:
```bash
stripe trigger payment_intent.succeeded
```

**Expected Result in Stripe CLI terminal:**
```
--> payment_intent.succeeded [evt_xxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**Expected Result in Server Console (npm run dev):**
```
Stripe webhook event received: { type: 'payment_intent.succeeded', id: 'evt_...' }
```

### Step 8: Verify Webhook Event Logged

Run:
```bash
npx tsx check-webhook-data.ts
```

You should see at least 1 webhook event in the output.

### Step 9: Make a New Test Payment

Once the trigger works:
1. Create a new enrollment or use existing enrollment wizard
2. Go to payment step
3. Fill out test card: `4242 4242 4242 4242`
4. Click Pay
5. **WATCH THE STRIPE CLI TERMINAL** - You should see the event immediately
6. Check database updates

---

## If Stripe CLI Still Shows Nothing

### Alternative 1: Check if Server is Running

Make sure `npm run dev` is running on port 3000:
```bash
curl http://localhost:3000/api/webhooks/stripe
```

Should return JSON with webhook info.

### Alternative 2: Use Stripe Dashboard Webhooks (Production Solution)

For production or if CLI continues to fail:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. For local development, use ngrok:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```
4. Use the ngrok HTTPS URL: `https://xxx.ngrok.io/api/webhooks/stripe`
5. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Copy the webhook signing secret and update your database

### Alternative 3: Manual Test (Debugging Only)

You can manually call your webhook endpoint to test it:
```bash
# This will test if your webhook handler works
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{}'
```

You should see "Missing signature" or "Invalid signature" error, which means the endpoint is working.

---

## Common Issues

### Issue: "command not found: stripe"

**Solution:** Install Stripe CLI
- Windows: `scoop install stripe`
- Mac: `brew install stripe/stripe-cli/stripe`
- Or download from: https://github.com/stripe/stripe-cli/releases

### Issue: "Invalid API key"

**Solution:** Re-authenticate
```bash
stripe logout
stripe login
```

### Issue: CLI shows events but webhook returns 500

**Solution:** Check server logs for errors. Likely database connection or webhook secret issue.

### Issue: CLI shows [401] Invalid signature

**Solution:** Webhook secret in database doesn't match CLI secret
```bash
# Get secret from CLI
stripe listen --print-secret

# Update database
npx tsx update-webhook-secret.ts whsec_...
```

---

## Success Indicators

You'll know it's working when:
- ✅ Stripe CLI shows "Ready!" message
- ✅ `stripe trigger payment_intent.succeeded` shows event in CLI
- ✅ Server console shows "Stripe webhook event received"
- ✅ Database has webhook_events records
- ✅ Real payment triggers webhook automatically
- ✅ Database tables update (payments, payment_schedules, enrollments)

---

## Need Help?

If you get stuck at any step, show me:
1. The exact command you ran
2. The complete error message
3. Output from `stripe config --list`
4. Output from your Stripe CLI terminal
5. Output from your server console
