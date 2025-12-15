# Stripe Webhook Testing Guide

This guide explains how to set up Stripe CLI to test webhook events locally during development.

## Prerequisites

- Stripe account (test mode)
- Stripe API keys configured in database (integrations table)
- Local development server running

## Step 1: Install Stripe CLI

### Windows

**Option A: Using Scoop (Recommended)**
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Stripe CLI
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Option B: Direct Download**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Extract `stripe.exe` to a folder in your PATH
3. Verify installation:
   ```powershell
   stripe --version
   ```

### Mac

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Debian/Ubuntu
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

## Step 2: Login to Stripe

Open terminal/PowerShell and run:

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to log in to Stripe Dashboard
3. Generate API keys for the CLI
4. Save credentials locally

**Output:**
```
Your pairing code is: word-word-word
Press Enter to open the browser (^C to quit)
```

Press Enter, complete the login in browser, then you'll see:
```
Done! The Stripe CLI is configured for [your-account-name]
```

## Step 3: Start Webhook Forwarding

### Basic Command

Forward all webhook events to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**What this does:**
- Creates a temporary webhook endpoint in Stripe
- Listens for events in your Stripe account
- Forwards them to your local Next.js server
- Shows webhook signing secret

**Output:**
```
> Ready! You are using Stripe API Version [2023-10-16]. Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Important: Copy the Webhook Secret

**The signing secret shown (starting with `whsec_`) needs to be added to your database.**

Copy the `whsec_xxxxxxxxxxxxx` value.

## Step 4: Add Webhook Secret to Database

Add the webhook secret to your tenant's Stripe integration:

```sql
UPDATE integrations
SET credentials = jsonb_set(
  credentials,
  '{webhook_secret}',
  to_jsonb('whsec_YOUR_SECRET_HERE'::text)
)
WHERE integration_key = 'stripe'
  AND tenant_id = 'your-tenant-id';
```

**Or manually update the JSONB:**

```sql
UPDATE integrations
SET credentials = jsonb_build_object(
  'secret_key', 'sk_test_YOUR_KEY',
  'publishable_key', 'pk_test_YOUR_KEY',
  'webhook_secret', 'whsec_YOUR_WEBHOOK_SECRET_FROM_CLI'
)
WHERE integration_key = 'stripe'
  AND tenant_id = 'your-tenant-id';
```

## Step 5: Test Webhook Events

### Method 1: Trigger Test Events

In a **new terminal window** (keep `stripe listen` running), trigger test events:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test checkout session completed
stripe trigger checkout.session.completed
```

**Output:**
```
Setting up fixture for: payment_intent
Running fixture for: payment_intent
Trigger succeeded! Check the Stripe dashboard for details.
```

### Method 2: Real Payment Flow

1. Keep `stripe listen` running in terminal
2. Go to enrollment wizard in browser
3. Click "Pay" button
4. Complete payment with test card: **4242 4242 4242 4242**
5. Watch terminal for webhook events

**Terminal will show:**
```
2025-12-12 02:45:23   --> payment_intent.created [evt_xxxxxxxxxxxxx]
2025-12-12 02:45:25   --> payment_intent.succeeded [evt_xxxxxxxxxxxxx]
2025-12-12 02:45:25  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxxxxxxxxxx]
```

## Step 6: Verify Webhook Processing

### Check Terminal Output

Look for `[200]` status - means webhook was processed successfully:
```
2025-12-12 02:45:25  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

**Status codes:**
- `200` - Success ✅
- `400` - Bad request (signature verification failed)
- `500` - Server error (check your webhook handler code)

### Check Server Logs

In your Next.js development server, you should see:
```
[Stripe Webhook] Payment succeeded for schedule abc-123-def
[Stripe Webhook] Successfully processed payment for enrollment xyz-789
```

### Check Database

Verify the payment schedule was updated:

```sql
-- Check schedule status changed to 'paid'
SELECT id, status, paid_date, metadata
FROM payment_schedules
WHERE id = 'your-schedule-id';

-- Check payment record was created
SELECT *
FROM payments
WHERE enrollment_id = 'your-enrollment-id'
ORDER BY created_at DESC
LIMIT 1;

-- Check enrollment paid_amount and status updated
SELECT id, paid_amount, total_amount, payment_status, status
FROM enrollments
WHERE id = 'your-enrollment-id';
```

## Troubleshooting

### Error: "Webhook signature verification failed"

**Cause:** Webhook secret in database doesn't match CLI secret

**Solution:**
1. Check the secret shown when you ran `stripe listen`
2. Update database with correct secret (Step 4)
3. Restart your Next.js dev server

### Error: "No handler found for webhook event"

**Cause:** Webhook event type not handled in code

**Solution:**
- Only these events are handled: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Other events are logged but not processed
- This is normal for unhandled events

### Webhook Not Receiving Events

**Check:**
1. `stripe listen` is still running
2. URL is correct: `http://localhost:3000/api/webhooks/stripe`
3. Dev server is running on port 3000
4. No firewall blocking localhost

**Restart everything:**
```bash
# Terminal 1: Stop stripe listen (Ctrl+C), then restart
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Terminal 2: Restart Next.js
npm run dev
```

### Test Events Not Working

**Manual test using curl:**
```bash
# Get a real payment intent ID from test payment
# Then manually trigger webhook:

curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type": "payment_intent.succeeded", "data": {...}}'
```

Note: This bypasses signature verification, use only for debugging.

## Advanced: Filter Events

Only forward specific events:

```bash
stripe listen \
  --forward-to http://localhost:3000/api/webhooks/stripe \
  --events payment_intent.succeeded,payment_intent.payment_failed
```

## Advanced: Multiple Tenants Testing

If testing multiple tenants with different Stripe accounts:

1. Run separate `stripe listen` for each account:
   ```bash
   # Terminal 1: Tenant A
   stripe login --project-name tenant-a
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

   # Terminal 2: Tenant B
   stripe login --project-name tenant-b
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

2. Update each tenant's webhook secret in database

## Production Webhook Setup

Once ready for production, configure real webhooks:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook signing secret
6. Update production database:
   ```sql
   UPDATE integrations
   SET credentials = jsonb_set(
     credentials,
     '{webhook_secret}',
     to_jsonb('whsec_PRODUCTION_SECRET'::text)
   )
   WHERE integration_key = 'stripe'
     AND tenant_id = 'your-tenant-id';
   ```

## Quick Reference Commands

```bash
# Install Stripe CLI (Windows - Scoop)
scoop install stripe

# Login to Stripe
stripe login

# Start webhook listener
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test payment success
stripe trigger payment_intent.succeeded

# Trigger test payment failure
stripe trigger payment_intent.payment_failed

# View webhook logs
stripe logs tail

# List recent events
stripe events list --limit 10
```

## Summary

✅ **Install Stripe CLI** - Download and install
✅ **Login** - Authenticate with your Stripe account
✅ **Listen** - Forward webhooks to localhost
✅ **Copy Secret** - Add `whsec_xxx` to database
✅ **Test** - Trigger events or make real test payments
✅ **Verify** - Check terminal logs and database updates

**Keep `stripe listen` running during entire development session!**

When you see this in terminal, webhooks are working:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
2025-12-12 02:45:25  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```
