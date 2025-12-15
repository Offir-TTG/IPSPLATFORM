# Stripe Payment Integration & Payment Schedule Tracking

## Overview

This document explains how Stripe payment processing integrates with the payment schedule system for enrollment wizard payments.

## Architecture

### Payment Flow

```
User in Wizard → Payment Page → Create Payment Intent → Stripe Form → Payment Success → Webhook Updates Schedule → Enrollment Status Updated
```

## Components

### 1. Payment Page (`/enroll/wizard/[id]/pay`)

**Location:** `src/app/(public)/enroll/wizard/[id]/pay/page.tsx`

**Purpose:** Display payment form for pending payment schedules

**Features:**
- Fetches payment details using enrollment token (no authentication required)
- Displays product name, payment type, payment number, and amount
- Shows Stripe payment form in test mode
- Handles payment success/failure
- Redirects back to wizard on completion

**Flow:**
1. User clicks "Pay" button in wizard
2. Page loads payment info from `/api/enrollments/token/:token/payment`
3. Creates Stripe payment intent via `/api/enrollments/token/:token/payment/create-intent`
4. Displays Stripe Elements payment form
5. On success, redirects to wizard

### 2. Payment Intent API

**Location:** `src/app/api/enrollments/token/[token]/payment/create-intent/route.ts`

**Purpose:** Create Stripe PaymentIntent for a specific payment schedule

**Request:**
```typescript
POST /api/enrollments/token/:token/payment/create-intent
{
  "schedule_id": "uuid"
}
```

**Response:**
```typescript
{
  "clientSecret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx"
}
```

**Metadata Attached to PaymentIntent:**
- `enrollment_id` - Links payment to enrollment
- `schedule_id` - Links payment to specific payment schedule
- `tenant_id` - Multi-tenancy support
- `payment_type` - Type of payment (deposit, installment, recurring, full)
- `payment_number` - Sequence number of payment
- `product_title` - Course/program name
- `product_type` - Product type (course, program, etc.)

### 3. Stripe Payment Form Component

**Location:** `src/components/payments/StripePaymentForm.tsx`

**Features:**
- Uses Stripe Elements (PaymentElement) for secure payment collection
- Test mode indicator showing test card numbers
- Theme-consistent styling using CSS variables
- Supports all payment methods enabled in Stripe
- Handles redirect flows (3D Secure, etc.)

**Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### 4. Stripe Webhook Handler

**Location:** `src/app/api/webhooks/stripe/route.ts`

**Purpose:** Process Stripe events and update database

**Key Events:**

#### `payment_intent.succeeded`
**What Happens:**
1. ✅ Updates `payment_schedules.status` to 'paid'
2. ✅ Sets `payment_schedules.paid_date` to current timestamp
3. ✅ Stores Stripe payment intent ID in schedule metadata
4. ✅ Creates payment record in `payments` table
5. ✅ Updates `enrollments.paid_amount` (accumulative)
6. ✅ Updates `enrollments.payment_status`:
   - `paid` - if paid_amount >= total_amount
   - `partial` - if paid_amount > 0 but < total_amount
   - `pending` - if paid_amount = 0
7. ✅ Updates `enrollments.status` to 'active' if fully paid

#### `payment_intent.payment_failed`
**What Happens:**
1. ❌ Updates `payment_schedules.status` to 'failed'
2. ❌ Increments `payment_schedules.retry_count`
3. ❌ Sets `payment_schedules.next_retry_date` (exponential backoff)
4. ❌ Stores error message in `payment_schedules.last_error`

**Retry Schedule:**
- 1st failure: Retry after 1 day
- 2nd failure: Retry after 3 days
- 3rd failure: Retry after 7 days
- Max retries: 3

## Payment Schedule Tracking in Stripe

### How Schedules Are Tracked

Payment schedules are **NOT created in Stripe automatically**. Instead:

1. **Database is Source of Truth**
   - Payment schedules stored in `payment_schedules` table
   - Generated when enrollment is created (or on-demand when viewing payment page)
   - Each schedule has: amount, due_date, payment_type, payment_number

2. **On-Demand Payment Intent Creation**
   - When user clicks "Pay" for a specific schedule, we create a Stripe PaymentIntent
   - PaymentIntent stores schedule_id in metadata
   - One PaymentIntent = One payment schedule item

3. **Webhook Links Payment to Schedule**
   - When payment succeeds, webhook reads schedule_id from metadata
   - Updates that specific schedule to 'paid'
   - Calculates enrollment payment status based on all schedules

### Viewing Payment Schedules in Stripe

**In Stripe Dashboard:**

1. **Payments Tab**
   - View all processed payments
   - Each payment shows metadata with:
     - Enrollment ID
     - Schedule ID
     - Payment type (deposit, installment #1, #2, etc.)
     - Product title

2. **Customer View**
   - Search for customer by email
   - View payment history
   - See metadata for each payment

3. **Payment Intent Details**
   ```
   Metadata:
   ├── enrollment_id: abc-123
   ├── schedule_id: def-456
   ├── tenant_id: ghi-789
   ├── payment_type: installment
   ├── payment_number: 2
   ├── product_title: "Advanced Parenting Course"
   └── product_type: course
   ```

### Admin Payment Schedule Management

**Location:** `/admin/payments/schedules`

**Features:**
- View all payment schedules across all enrollments
- Filter by status (pending, paid, overdue, failed)
- Adjust individual payment dates
- Pause/resume payments
- Retry failed payments
- Bulk operations

**Schedule Statuses:**
- `pending` - Not yet due, not paid
- `paid` - Successfully paid
- `overdue` - Past due date, not paid
- `failed` - Payment attempt failed
- `cancelled` - Manually cancelled

## Stripe Configuration

### Database Storage (Multi-Tenant)

Stripe credentials are stored **per tenant** in the `integrations` table:

**Table:** `integrations`
- `tenant_id` - UUID of the tenant
- `integration_key` - 'stripe'
- `credentials` - JSONB containing:
  - `secret_key` - Stripe secret key (sk_test_xxx or sk_live_xxx)
  - `publishable_key` - Stripe publishable key (pk_test_xxx or pk_live_xxx)
  - `webhook_secret` - Webhook signing secret (whsec_xxx)

**Why Database Storage?**
- Multi-tenant support - each tenant can have their own Stripe account
- No environment variables needed
- Can be updated through admin UI
- Tenant-specific payment processing

### Setting Up Stripe for a Tenant

1. **Get Stripe API Keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)

2. **Add to Database:**
   ```sql
   INSERT INTO integrations (tenant_id, integration_key, credentials, is_active)
   VALUES (
     'your-tenant-id',
     'stripe',
     jsonb_build_object(
       'secret_key', 'sk_test_YOUR_KEY',
       'publishable_key', 'pk_test_YOUR_KEY',
       'webhook_secret', 'whsec_YOUR_WEBHOOK_SECRET'
     ),
     true
   );
   ```

3. **Or Use Admin UI:**
   - Navigate to Settings → Integrations
   - Add Stripe integration
   - Enter API keys
   - Save

### Environment Variables (Optional - Webhook Only)

For local webhook testing with Stripe CLI:

```env
# Only needed if using Stripe CLI for local webhook testing
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Setting Up Stripe Webhook

### Development (Local Testing)

1. Install Stripe CLI:
   ```bash
   # Windows
   scoop install stripe

   # Mac
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhook events to local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

4. Get webhook signing secret (starts with `whsec_`):
   ```bash
   # Displayed when you run stripe listen
   # Add to .env.local as STRIPE_WEBHOOK_SECRET
   ```

5. Test a payment:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded` (optional, for refunds)
5. Copy webhook signing secret
6. Add to production environment variables as `STRIPE_WEBHOOK_SECRET`

## Testing Payment Flow

### End-to-End Test

1. **Create Product**
   - Set payment model (one_time, deposit_then_plan, subscription)
   - Set `payment_start_date` (when first payment is due)

2. **Create Enrollment**
   - Select product
   - Optionally override `payment_start_date` for specific student
   - Payment schedules auto-generated

3. **Send Enrollment Email**
   - Student receives email with enrollment token
   - Email contains link to wizard

4. **Complete Wizard Steps**
   - Student completes profile, signature (if required)
   - Wizard shows "Payment" step with pending payment

5. **Process Payment**
   - Click "Pay" button
   - Redirected to payment page
   - Stripe form loads (shows test mode notice)
   - Enter test card: `4242 4242 4242 4242`
   - Click "Pay $XXX.XX"

6. **Verify Success**
   - Payment page shows success message
   - Redirects back to wizard
   - Wizard shows payment complete
   - Check database:
     - `payment_schedules.status` = 'paid'
     - `payment_schedules.paid_date` = timestamp
     - `payments` table has new record
     - `enrollments.paid_amount` increased
     - `enrollments.payment_status` updated

### Testing Different Payment Models

**One-Time Payment:**
- 1 schedule created with full amount
- Due date = enrollment created date
- Single payment completes enrollment

**Deposit + Installments:**
- Schedule 1: Deposit (due on enrollment date)
- Schedule 2-N: Installments (starting from `payment_start_date`, spaced by frequency)
- Each payment updates enrollment until fully paid

**Subscription:**
- Recurring schedules generated
- First 12 payments shown
- Each period creates new schedule

## Database Schema

### payment_schedules

```sql
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  payment_plan_id UUID NULL,  -- NULL for synthetic plans

  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,

  payment_type VARCHAR(50) NOT NULL,  -- 'deposit', 'installment', 'recurring', 'full'
  payment_number INTEGER NOT NULL,    -- Sequence number
  sequence_number INTEGER NOT NULL,   -- Same as payment_number

  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,

  status VARCHAR(20) NOT NULL,  -- 'pending', 'paid', 'overdue', 'failed', 'cancelled'

  retry_count INTEGER DEFAULT 0,
  next_retry_date TIMESTAMPTZ,
  last_error TEXT,

  metadata JSONB,  -- Stores stripe_payment_intent_id, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  enrollment_id UUID REFERENCES enrollments(id),
  schedule_id UUID REFERENCES payment_schedules(id),

  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,

  payment_method VARCHAR(50) NOT NULL,  -- 'stripe', 'paypal', etc.
  payment_status VARCHAR(20) NOT NULL,   -- 'completed', 'pending', 'failed', 'refunded'

  transaction_id TEXT,  -- External payment processor transaction ID
  payment_metadata JSONB,

  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Payment Not Updating Schedule

**Check:**
1. Webhook is configured correctly
2. Webhook secret matches environment variable
3. Check Stripe Dashboard → Developers → Webhooks → View Events
4. Look for `payment_intent.succeeded` event
5. Check webhook response (should be 200)
6. Check server logs for webhook processing errors

### Schedule ID Not Found

**Cause:** Payment intent metadata doesn't have schedule_id

**Solution:**
1. Check payment intent creation code
2. Ensure `schedule_id` is passed in metadata
3. Verify enrollment token API returns schedule data

### Payment Intent Creation Failed

**Check:**
1. Stripe API key is correct (starts with `sk_`)
2. Schedule exists in database
3. Schedule status is 'pending' (not already paid)
4. Amount is valid (> 0)

## Summary

✅ **Payments are processed through Stripe**
✅ **Payment schedules stored in database**
✅ **Webhook updates schedule status automatically**
✅ **Metadata links Stripe payments to schedules**
✅ **Admin can view/manage schedules in UI**
✅ **All payment history tracked in database**
✅ **Test mode available for development**

**Key Point:** Payment schedules are **generated and managed in the database**. Stripe only handles the actual payment processing. The webhook is the bridge that connects Stripe payments back to database schedules.
