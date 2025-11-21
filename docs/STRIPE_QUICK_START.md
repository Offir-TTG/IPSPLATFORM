# Stripe Integration - Quick Start (5 Minutes)

## Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret Key** (`sk_test_...`)
3. Copy your **Publishable Key** (`pk_test_...`)

## Configure in IPS Platform

1. Open: http://localhost:3000/admin/config/integrations
2. Click **Stripe** tab
3. Paste keys:
   - **Secret Key**: `sk_test_...`
   - **Publishable Key**: `pk_test_...`
4. Click **Test Connection** → Should see ✅ success
5. Toggle **Enabled** ON
6. Click **Save Configuration**

## Setup Webhooks (Optional but Recommended)

### If using localtunnel (already running):
Your webhook URL: `https://curly-teams-say.loca.lt/api/webhooks/stripe`

### Configure in Stripe:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://curly-teams-say.loca.lt/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **Add endpoint**
6. Click **Reveal** under "Signing secret"
7. Copy the secret (`whsec_...`)
8. Back in IPS Platform → Paste in **Webhook Signing Secret**
9. Click **Save Configuration**

## Test with Sample Card

Use these test card numbers:

**Success**: `4242 4242 4242 4242`
**Decline**: `4000 0000 0000 0002`

- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## What's Next?

You're ready to accept payments! The webhook will automatically:
- Update enrollment payment status
- Create payment records
- Send notifications
- Handle refunds

See [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) for detailed documentation.

---

## Troubleshooting

**Test Connection Fails?**
- Verify you copied the complete secret key
- Make sure you're using `sk_test_` (not `pk_`)

**Webhooks not working?**
- Check if localtunnel is still running
- Verify webhook secret matches Stripe
- Check Stripe Dashboard → Webhooks → Recent deliveries

**Questions?**
See the [full setup guide](./STRIPE_SETUP_GUIDE.md) or Stripe docs at https://stripe.com/docs
