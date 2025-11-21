# Stripe Integration - Complete Setup Guide

## Overview

Stripe is a payment processing platform that allows you to accept payments, manage subscriptions, and handle refunds. This guide will walk you through setting up Stripe integration with your IPS Platform.

---

## Step-by-Step Setup Instructions

### 1. Create Stripe Account

1. Go to [Stripe](https://stripe.com/)
2. Click **Sign Up**
3. Complete the registration process
4. Verify your email address

### 2. Get Your API Keys

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** in the top navigation
3. Click **API Keys** in the sidebar

You'll see two sets of keys:

**Test Mode Keys** (for development):
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

**Live Mode Keys** (for production):
- Publishable key: `pk_live_...`
- Secret key: `sk_live_...`

⚠️ **Always start with Test Mode keys** for development.

### 3. Configure in IPS Platform

1. Go to your IPS Platform: `http://localhost:3000/admin/config/integrations`
2. Click the **Stripe** tab
3. Fill in the fields:

   **Secret Key** (Required):
   - For testing: `sk_test_...`
   - For production: `sk_live_...`
   - ⚠️ Never share this key publicly

   **Publishable Key** (Required):
   - For testing: `pk_test_...`
   - For production: `pk_live_...`
   - This key is safe to use in client-side code

   **Webhook Signing Secret** (Optional - for webhooks):
   - Leave blank for now
   - We'll fill this in Step 5

   **Default Currency**:
   - Select your preferred currency (USD, EUR, GBP, ILS, etc.)

   **Statement Descriptor**:
   - This appears on customer's credit card statements
   - Max 22 characters
   - Example: "IPS PLATFORM"

4. Click **Test Connection** to verify your keys
5. You should see: ✅ "Connected to Stripe account: your@email.com"
6. Toggle **Enabled** to ON
7. Click **Save Configuration**

---

## Setting Up Webhooks

Webhooks allow Stripe to notify your platform about events like successful payments, failed charges, and refunds.

### 4. Start Your Tunnel (For Local Development)

If you're developing locally, you need a public URL. You should already have localtunnel running from the DocuSign setup:

```bash
# If not running, start it:
npx localtunnel --port 3000
```

Copy your public URL (e.g., `https://your-url.loca.lt`)

### 5. Create Webhook in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** → **Webhooks**
3. Click **Add endpoint**

**Endpoint URL**:
- Development: `https://your-url.loca.lt/api/webhooks/stripe`
- Production: `https://yourdomain.com/api/webhooks/stripe`

**Description**: `IPS Platform Webhook`

**Events to send**:

Select these events (or click "Select all events" for simplicity):

✅ **Checkout**:
- `checkout.session.completed`

✅ **Payment Intents**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

✅ **Customers**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

✅ **Invoices**:
- `invoice.paid`
- `invoice.payment_failed`

✅ **Charges**:
- `charge.refunded`

4. Click **Add endpoint**

### 6. Get Webhook Signing Secret

After creating the webhook:

1. Click on the webhook endpoint you just created
2. In the **Signing secret** section, click **Reveal**
3. Copy the secret (starts with `whsec_...`)
4. Go back to your IPS Platform integrations page
5. Paste the secret into the **Webhook Signing Secret** field
6. Click **Save Configuration**

---

## Testing Your Integration

### Test with Stripe Test Cards

Stripe provides test card numbers for different scenarios:

**Successful Payment**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment**:
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure)**:
- Card: `4000 0025 0000 3155`

**Insufficient Funds**:
- Card: `4000 0000 0000 9995`

See more test cards: https://stripe.com/docs/testing

### Test Payment Flow

Once you implement the checkout in your application, you can test:

1. Create a checkout session
2. Use a test card number
3. Complete the payment
4. Check that the webhook was received
5. Verify the payment status updated in your database

---

## Webhook Events Flow

Here's what happens when a payment is made:

1. **checkout.session.completed** → Creates payment record, updates enrollment to "paid"
2. **payment_intent.succeeded** → Confirms payment completion
3. **invoice.paid** → For subscription payments

Alternative flows:
- **payment_intent.payment_failed** → Updates payment status to "failed"
- **charge.refunded** → Updates payment status to "refunded"

---

## Database Tables

Your platform should have these tables for Stripe integration:

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  enrollment_id UUID REFERENCES enrollments(id),
  program_id UUID REFERENCES programs(id),

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL, -- completed, pending, failed, refunded

  -- Stripe references
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),

  -- Additional info
  payment_method VARCHAR(50),
  failure_reason TEXT,
  refunded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Subscriptions Table (Optional - for recurring payments)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  enrollment_id UUID REFERENCES enrollments(id),

  -- Stripe references
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,

  -- Subscription details
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Update Enrollments Table
```sql
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
```

---

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables
   - Keep secrets in secure database storage

2. **Always verify webhook signatures**
   - The webhook handler already does this
   - Never skip signature verification in production

3. **Use test mode for development**
   - Test mode charges are not real
   - Switch to live mode only when ready for production

4. **Implement idempotency**
   - Webhook events may be sent multiple times
   - Use Stripe's event ID to prevent duplicate processing

5. **Log all payment events**
   - Already done via the `webhook_events` table
   - Useful for debugging and audit trail

---

## Troubleshooting

### Test Connection Fails

**Error: "Invalid API Key"**
- Verify you copied the complete key
- Make sure you're using the secret key (starts with `sk_`)
- Check if you're using test vs live mode correctly

**Error: "No such account"**
- Verify your Stripe account is fully activated
- Check that the key belongs to your account

### Webhook Not Receiving Events

**Check 1: URL Accessibility**
```bash
# Test if your webhook URL is accessible
curl https://yourdomain.com/api/webhooks/stripe

# Should return JSON with endpoint info
```

**Check 2: Webhook Signature**
- If webhooks fail with 401 errors, verify the webhook secret
- Make sure the secret in your platform matches Stripe
- You can temporarily disable verification for testing

**Check 3: Stripe Dashboard**
- Go to Developers → Webhooks → Your endpoint
- Check the "Recent deliveries" section
- Look for failed attempts and error messages

### Payments Not Updating Database

**Check 1: Metadata**
- Make sure you're passing metadata when creating checkout sessions
- Include `enrollment_id`, `student_id`, and `program_id`

**Check 2: Database Permissions**
- Verify webhook has permission to update tables
- Check RLS policies

**Check 3: Webhook Events Table**
- Query the `webhook_events` table to see if events are being received
- Check the payload to debug

```sql
SELECT * FROM webhook_events
WHERE source = 'stripe'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Production Checklist

Before going to production:

- [ ] Switch to live mode API keys (pk_live_ and sk_live_)
- [ ] Update webhook endpoint to production URL (not localtunnel)
- [ ] SSL certificate is valid
- [ ] Webhook signature verification is enabled
- [ ] All secrets stored securely
- [ ] Test with real card in test mode first
- [ ] Review Stripe account settings
- [ ] Complete business verification in Stripe
- [ ] Set up email notifications for failed payments
- [ ] Configure statement descriptor
- [ ] Review payment flow from user perspective
- [ ] Test refund process

---

## Next Steps

Once Stripe is working:

1. ✅ Accept one-time payments
2. ✅ Receive webhook notifications
3. 📋 Implement checkout UI for students
4. 📋 Add subscription/payment plan support
5. 📋 Build payment history dashboard
6. 📋 Add refund functionality
7. 📋 Implement payment reminders
8. 📋 Create financial reports

---

## Useful Resources

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
- [API Reference](https://stripe.com/docs/api)
- [Test Cards](https://stripe.com/docs/testing)
- [Payment Methods](https://stripe.com/docs/payments/payment-methods)

---

## Common Use Cases

### One-Time Payment (Course Enrollment)

```javascript
// Create checkout session with enrollment metadata
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Program Enrollment Fee',
      },
      unit_amount: 50000, // $500.00
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourdomain.com/cancel',
  metadata: {
    enrollment_id: 'enroll_123',
    student_id: 'student_456',
    program_id: 'prog_789'
  }
});
```

### Subscription (Monthly Tuition)

```javascript
// Create subscription checkout
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: 'price_123456', // Your price ID from Stripe
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourdomain.com/cancel',
  metadata: {
    enrollment_id: 'enroll_123',
    student_id: 'student_456'
  }
});
```

### Issue Refund

```javascript
// Refund a charge
const refund = await stripe.refunds.create({
  payment_intent: 'pi_1234567890',
  amount: 5000, // $50.00 (or omit for full refund)
  reason: 'requested_by_customer'
});
```

---

## Support

If you encounter issues:

1. Check Stripe Dashboard → Developers → Logs
2. Check your application server logs
3. Review webhook delivery attempts in Stripe
4. Test with Stripe CLI for local webhook testing
5. Contact Stripe support if needed

Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
