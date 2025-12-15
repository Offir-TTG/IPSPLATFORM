# Payment Flow Explanation

## Why the Payments Table is Empty

The `payments` table is **NOT** populated during payment intent creation. It gets populated **AFTER** a payment is successfully completed through Stripe's webhook system.

## Complete Payment Flow

### Step 1: User Initiates Payment
**Location**: Enrollment wizard payment step

When a user submits a payment, the system calls:
```typescript
// src/lib/payments/stripeService.ts
createPaymentIntent({
  enrollment_id: 'xxx',
  amount: 800,
  currency: 'USD',
  payment_type: 'deposit',
  schedule_id: 'yyy'
}, tenant_id, user_id)
```

**What happens**:
1. Creates Stripe customer (or retrieves existing one)
2. Creates payment intent with metadata:
   ```json
   {
     "tenant_id": "...",
     "enrollment_id": "...",
     "payment_type": "deposit",
     "schedule_id": "...",
     "product_name": "..."
   }
   ```
3. Returns `client_secret` to frontend
4. **DOES NOT create payment record yet**

### Step 2: User Completes Payment in Stripe UI
User enters card details in Stripe's payment form and submits.

Stripe processes the payment on their servers.

### Step 3: Stripe Sends Webhook Event
**When**: Payment succeeds on Stripe's side

Stripe sends a `payment_intent.succeeded` webhook event to:
```
POST http://localhost:3000/api/webhooks/stripe
```

**Event payload includes**:
- Payment intent ID
- Amount paid
- Currency
- **All the metadata** we attached in Step 1

### Step 4: Webhook Handler Creates Payment Record
**Location**: `src/app/api/webhooks/stripe/route.ts` lines 198-309

The webhook handler:

1. **Extracts metadata** from the payment intent:
   ```typescript
   const { tenant_id, enrollment_id, payment_type, schedule_id } = paymentIntent.metadata;
   ```

2. **Creates payment record** in the payments table:
   ```typescript
   await supabase.from('payments').insert({
     tenant_id,
     user_id: enrollment.user_id,
     enrollment_id,
     amount: amount / 100,
     currency: currency.toUpperCase(),
     payment_method: 'stripe',
     transaction_id: charge.id,
     stripe_payment_intent_id: id,
     status: 'completed',
     metadata: { payment_type, schedule_id }
   });
   ```

3. **Updates payment schedule** to "paid":
   ```typescript
   await supabase
     .from('payment_schedules')
     .update({ status: 'paid', paid_date: new Date() })
     .eq('id', schedule_id);
   ```

4. **Updates enrollment** status:
   ```typescript
   await supabase
     .from('enrollments')
     .update({
       paid_amount: paidAmount,
       payment_status: isFullyPaid ? 'paid' : 'partial',
       status: isFullyPaid ? 'active' : 'pending'
     })
     .eq('id', enrollment_id);
   ```

---

## Current Configuration Status

✅ **Stripe Integration Configured**
- Publishable key: Set
- Secret key: Set
- Webhook secret: Set (`whsec_b1d1e669b...`)
- Tenant ID: `70d86807-7e7c-49cd-8601-98235444e2ac`

✅ **Webhook Endpoint Active**
- URL: `http://localhost:3000/api/webhooks/stripe`
- Method: POST
- Listening for: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.

⚠️ **No Webhook Events Yet**
- 0 webhook events in database
- This is expected - you haven't completed any payments yet

⚠️ **Payments Table Empty**
- 0 payment records
- Will populate once you complete a payment and the webhook fires

---

## Testing the Payment Flow

### For Development (Local Testing)

1. **Start Stripe CLI listener** (in separate terminal):
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

   **Expected output**:
   ```
   Ready! Your webhook signing secret is whsec_b1d1e669b4cca58db0c7526b8361b9bba3c979f27ff99239fabc8b88b750c4dc
   ```

2. **Start Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Complete a test payment**:
   - Navigate to enrollment wizard
   - Reach payment step
   - Use test card: `4242 4242 4242 4242`
   - Expiration: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Submit payment

4. **Monitor webhook in Stripe CLI terminal**:
   ```
   --> payment_intent.created [evt_xxxxx]
   --> payment_intent.succeeded [evt_xxxxx]
   <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
   ```

5. **Verify database**:
   ```sql
   SELECT * FROM payments WHERE enrollment_id = 'YOUR_ENROLLMENT_ID';
   SELECT * FROM payment_schedules WHERE enrollment_id = 'YOUR_ENROLLMENT_ID';
   SELECT * FROM webhook_events WHERE source = 'stripe';
   ```

### For Production

1. **Configure Stripe webhook in dashboard**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.
   - Copy webhook signing secret

2. **Update production integration**:
   - Go to Admin → Integrations → Stripe
   - Update webhook secret with production value
   - Save

---

## Troubleshooting Payment Issues

### Issue 1: Payments Table Still Empty After Payment

**Check**:
1. Did payment succeed in Stripe dashboard?
2. Did webhook fire? (Check Stripe dashboard → Webhooks → Events)
3. Did webhook return 200 status?
4. Check server logs for webhook errors

**Solution**:
- If webhook failed, check webhook secret matches
- If webhook didn't fire, verify endpoint is configured in Stripe
- If webhook returned error, check server logs

### Issue 2: Duplicate Payment Records

**Cause**: Webhook fired multiple times for same payment

**Prevention**: The system should check for existing payment by `stripe_payment_intent_id` before inserting.

**Current behavior**: Currently no duplicate checking in webhook handler (lines 244-266).

**Recommendation**: Add duplicate check:
```typescript
// Check if payment already recorded
const { data: existing } = await supabase
  .from('payments')
  .select('id')
  .eq('stripe_payment_intent_id', id)
  .single();

if (existing) {
  console.log(`Payment already recorded: ${id}`);
  return;
}
```

### Issue 3: Wrong Payment Dates

**Fixed**: Payment schedule dates now use proper month-based calculation via `addMonths()` helper.

**To apply fix**: Delete existing enrollment and create new one.

---

## Summary

**Why payments table is empty**:
- It's populated by webhook AFTER payment completes
- No payments have been completed yet
- This is normal and expected

**To populate it**:
1. Complete a test payment in the enrollment wizard
2. Stripe will send webhook to your server
3. Webhook handler will create payment record
4. Payments table will have data

**Current status**:
- ✅ Stripe integration configured
- ✅ Webhook endpoint active
- ✅ Payment schedule date calculation fixed
- ⏳ Waiting for first payment to test flow
