# Stripe Payment Testing Checklist

## Pre-Testing Verification

### 1. Stripe CLI Webhook Listener
✅ **Status**: Configured with webhook secret `whsec_b1d1e669b4cca58db0c7526b8361b9bba3c979f27ff99239fabc8b88b750c4dc`

**Start the listener** (if not already running):
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Expected output**:
```
> Ready! You are using Stripe API Version [2023-10-16]. Your webhook signing secret is whsec_b1d1e669b4cca58db0c7526b8361b9bba3c979f27ff99239fabc8b88b750c4dc (^C to quit)
```

### 2. Development Server
Ensure Next.js dev server is running:
```bash
npm run dev
```

**Expected**: Server running on `http://localhost:3000`

### 3. Database Configuration
✅ **Webhook secret saved via UI**

Verify Stripe integration exists:
```sql
SELECT
  integration_key,
  credentials->>'publishable_key' as publishable_key,
  credentials->>'secret_key' as secret_key_prefix,
  credentials->>'webhook_secret' as webhook_secret_prefix
FROM integrations
WHERE integration_key = 'stripe';
```

**Expected**: Row exists with all three keys present

---

## Test Scenario 1: Complete Payment Flow (Deposit Payment)

### Step 1: Navigate to Enrollment Wizard
1. Go to enrollment wizard URL (with valid token)
2. Complete student information steps
3. Reach payment step

### Step 2: Verify Payment Page Loads
**Check for**:
- ✅ Product name displays correctly (course/program title)
- ✅ Payment amount shows correctly
- ✅ Currency displays (USD/ILS)
- ✅ Stripe payment form loads
- ✅ Hebrew/English translations work
- ✅ Test mode alert shows

**Screenshot checkpoint**: Payment form fully loaded

### Step 3: Complete Payment
1. Enter test card: `4242 4242 4242 4242`
2. Expiration: Any future date (e.g., `12/25`)
3. CVC: Any 3 digits (e.g., `123`)
4. Name: Any name (e.g., `Test Student`)
5. Click "Pay" button

### Step 4: Monitor Webhook Events
**Switch to PowerShell terminal running `stripe listen`**

**Expected output**:
```
2025-12-12 XX:XX:XX   --> payment_intent.created [evt_xxxxxxxxxxxxx]
2025-12-12 XX:XX:XX   --> payment_intent.succeeded [evt_xxxxxxxxxxxxx]
2025-12-12 XX:XX:XX  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxxxxxxxxxx]
```

**Success indicators**:
- ✅ `payment_intent.succeeded` event received
- ✅ `[200]` response (webhook processed successfully)

### Step 5: Verify Database Updates

**Check payment schedule updated**:
```sql
SELECT
  id,
  enrollment_id,
  amount,
  currency,
  status,
  paid_date,
  payment_type,
  payment_number
FROM payment_schedules
WHERE enrollment_id = 'YOUR_ENROLLMENT_ID'
ORDER BY payment_number;
```

**Expected**:
- First payment: `status = 'paid'`
- `paid_date` is set to current timestamp
- Remaining payments: `status = 'pending'`

**Check payment record created**:
```sql
SELECT
  id,
  enrollment_id,
  amount,
  currency,
  payment_method,
  status,
  metadata
FROM payments
WHERE enrollment_id = 'YOUR_ENROLLMENT_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- New payment record exists
- `status = 'succeeded'`
- `payment_method = 'stripe'`
- `metadata` contains Stripe payment_intent_id

**Check enrollment updated**:
```sql
SELECT
  id,
  total_amount,
  paid_amount,
  payment_status,
  status
FROM enrollments
WHERE id = 'YOUR_ENROLLMENT_ID';
```

**Expected**:
- `paid_amount` increased by payment amount
- `payment_status` updated (e.g., 'partial' or 'paid')
- If first payment of plan: `status` might change to 'active'

### Step 6: Verify UI Updates
**Return to browser**:
- ✅ Success message displayed
- ✅ Wizard advances to next step OR completion page
- ✅ Payment confirmation shown

---

## Test Scenario 2: Failed Payment

### Step 1: Trigger Payment Failure
Use Stripe test card that triggers decline:
- Card: `4000 0000 0000 9995` (Always declined)

### Step 2: Expected Behavior
**Browser**:
- ❌ Error message displayed
- Payment form remains visible
- User can retry

**Webhook terminal**:
```
2025-12-12 XX:XX:XX   --> payment_intent.payment_failed [evt_xxxxxxxxxxxxx]
2025-12-12 XX:XX:XX  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

**Database**:
```sql
SELECT status FROM payment_schedules WHERE id = 'SCHEDULE_ID';
```
**Expected**: `status = 'failed'`

---

## Test Scenario 3: Second Installment Payment

### Prerequisites
- Enrollment with deposit paid
- Second payment schedule pending

### Step 1: Access Payment Link
Navigate to: `/enroll/wizard/[token]/pay`

**Expected**:
- Shows NEXT pending payment (2nd installment)
- Amount matches second schedule
- Payment form loads

### Step 2: Complete Payment
Same process as Scenario 1

### Step 3: Verify Multiple Payments
```sql
SELECT
  payment_type,
  payment_number,
  amount,
  status,
  paid_date
FROM payment_schedules
WHERE enrollment_id = 'YOUR_ENROLLMENT_ID'
ORDER BY payment_number;
```

**Expected**:
- Payment 1: `status = 'paid'`
- Payment 2: `status = 'paid'`
- Remaining: `status = 'pending'`

---

## Test Scenario 4: Hebrew Locale

### Step 1: Change Language
Switch user language to Hebrew in app

### Step 2: Load Payment Form
Navigate to payment page

### Expected Stripe Form Fields (in Hebrew):
- "מספר כרטיס" (Card number)
- "תאריך תפוגה" (Expiration date)
- "CVC" (CVC)
- "שם בעל הכרטיס" (Cardholder name)

### Step 3: Complete Payment
Verify entire flow works in Hebrew

---

## Troubleshooting

### Issue: Webhook Returns [400] or [500]

**Check Next.js dev server logs**:
```bash
# Look for error messages in terminal running npm run dev
```

**Common causes**:
- Webhook secret mismatch
- Database connection error
- Missing enrollment/schedule

**Solution**:
1. Verify webhook secret in database matches CLI output
2. Check server logs for specific error
3. Restart dev server: `npm run dev`

### Issue: Payment Form Not Loading

**Check browser console**:
- Look for Stripe initialization errors
- Verify publishable key loaded

**Check network tab**:
- Payment intent creation API call succeeds
- Returns `clientSecret` and `publishableKey`

**Solution**:
1. Verify Stripe credentials in database
2. Check API route logs
3. Ensure enrollment has pending payment schedule

### Issue: Database Not Updating

**Verify webhook handler**:
```sql
-- Check if webhook_secret exists
SELECT credentials->>'webhook_secret'
FROM integrations
WHERE integration_key = 'stripe';
```

**Check webhook handler logs**:
- Should log: `[Stripe Webhook] Payment succeeded for schedule abc-123`
- Should log: `[Stripe Webhook] Successfully processed payment for enrollment xyz-789`

**Solution**:
1. Restart Stripe CLI: Stop with Ctrl+C, restart `stripe listen`
2. Ensure webhook secret matches exactly
3. Check RLS policies don't block admin client

---

## Success Criteria Checklist

### Payment Form
- ✅ Loads without errors
- ✅ Shows correct product name
- ✅ Shows correct amount and currency
- ✅ Displays in correct language (EN/HE)
- ✅ Test mode alert visible

### Payment Processing
- ✅ Card validation works
- ✅ Submit button shows loading state
- ✅ Success/error messages display
- ✅ Webhook events received

### Database Updates
- ✅ Payment schedule status → 'paid'
- ✅ Payment schedule paid_date set
- ✅ New payment record created
- ✅ Enrollment paid_amount updated
- ✅ Enrollment payment_status updated

### User Experience
- ✅ Wizard advances after payment
- ✅ User cannot pay twice for same schedule
- ✅ Next pending payment shows correctly
- ✅ Translations work properly

---

## Test Cards Reference

| Card Number         | Description                    | Use Case              |
|---------------------|--------------------------------|-----------------------|
| 4242 4242 4242 4242 | Successful payment             | Standard test         |
| 4000 0000 0000 9995 | Always declined                | Test failure handling |
| 4000 0027 6000 3184 | 3D Secure required             | Test authentication   |
| 4000 0000 0000 0077 | Charge succeeds, dispute later | Test disputes         |

---

## Next Steps After Testing

1. **Review Stripe Dashboard**: Check payments appear correctly
2. **Test Payment Plans**: Verify full payment plan flows
3. **Test Edge Cases**: Expired cards, insufficient funds, etc.
4. **Admin UI**: Verify schedules appear in `/admin/payments/schedules`
5. **Production Setup**: Configure production Stripe webhook endpoint

---

## Notes

- Keep Stripe CLI running throughout testing session
- Monitor both terminals (CLI + dev server) during tests
- Document any unexpected behavior
- Test with both English and Hebrew users
- Test different payment plan types (one-time, deposit+plan, recurring)
