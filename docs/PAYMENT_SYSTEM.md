# Payment System Architecture

## Overview

This document provides comprehensive documentation for the universal payment system that supports multiple payment types across all products (programs, courses, lectures, workshops, etc.) in the IPS Platform.

## Key Features

- **Universal Product Integration**: Works with any billable product type
- **Automatic Payment Plan Detection**: Rule-based auto-assignment of payment plans
- **Smart Admin Controls**: Full control over payment schedules and timing
- **Multiple Payment Types**: One-time, deposit, installments, and subscriptions
- **Comprehensive Reporting**: 7 report types with charts and graphs
- **Stripe Integration**: Complete payment processing through Stripe
- **Flexible Payment Plans**: Reusable plan templates

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Payment System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Products   │─────▶│Payment Plans │─────▶│ Schedules │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                     │       │
│         │                      │                     │       │
│         ▼                      ▼                     ▼       │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │Auto-Detector │      │ Stripe API   │      │  Reports  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. Products Table

Universal product registration table that links any billable item to the payment system.

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('program', 'course', 'lecture', 'workshop', 'custom')),
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,

  -- Payment Configuration
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  auto_assign_payment_plan BOOLEAN DEFAULT true,
  default_payment_plan_id UUID REFERENCES payment_plans(id),
  forced_payment_plan_id UUID REFERENCES payment_plans(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tenant_id, product_type, product_id)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_type ON products(product_type, product_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
```

**Metadata examples**:
```json
{
  "eligibleUserSegments": ["students", "parents"],
  "minimumPurchaseAmount": 500,
  "requiresDeposit": true,
  "maxInstallments": 12,
  "category": "professional-development"
}
```

### 2. Payment Plans Table

Reusable payment plan templates with auto-detection rules.

```sql
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Plan Details
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('one_time', 'deposit', 'installments', 'subscription')),

  -- Deposit Configuration (for deposit and installments)
  deposit_type TEXT CHECK (deposit_type IN ('percentage', 'fixed')),
  deposit_amount DECIMAL(10, 2),
  deposit_percentage DECIMAL(5, 2),

  -- Installment Configuration
  installment_count INTEGER,
  installment_frequency TEXT CHECK (installment_frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
  custom_frequency_days INTEGER,

  -- Subscription Configuration
  subscription_frequency TEXT CHECK (subscription_frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
  subscription_trial_days INTEGER DEFAULT 0,

  -- Auto-Detection
  auto_detect_enabled BOOLEAN DEFAULT false,
  auto_detect_rules JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tenant_id, plan_name)
);

CREATE INDEX idx_payment_plans_tenant ON payment_plans(tenant_id);
CREATE INDEX idx_payment_plans_priority ON payment_plans(priority DESC) WHERE auto_detect_enabled = true;
CREATE INDEX idx_payment_plans_type ON payment_plans(plan_type);
```

**Auto-detect rules examples**:
```json
[
  {
    "condition": "price_range",
    "min": 1000,
    "max": 5000,
    "operator": "between"
  },
  {
    "condition": "product_type",
    "values": ["program", "course"],
    "operator": "in"
  },
  {
    "condition": "metadata",
    "field": "category",
    "value": "professional-development",
    "operator": "equals"
  },
  {
    "condition": "user_segment",
    "values": ["students", "parents"],
    "operator": "in"
  }
]
```

### 3. Payment Schedules Table

Individual payment dates with full admin control.

```sql
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id),

  -- Schedule Details
  payment_number INTEGER NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'installment', 'subscription', 'full')),

  -- Amounts
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Dates
  original_due_date TIMESTAMPTZ NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed',
    'paused', 'adjusted', 'cancelled', 'refunded'
  )),

  -- Payment Processing
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_id UUID REFERENCES payments(id),

  -- Admin Controls
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES users(id),
  paused_reason TEXT,
  resumed_at TIMESTAMPTZ,
  resumed_by UUID REFERENCES users(id),

  -- Adjustment History
  adjustment_history JSONB DEFAULT '[]',
  adjusted_by UUID REFERENCES users(id),
  adjustment_reason TEXT,

  -- Retry Information
  retry_count INTEGER DEFAULT 0,
  next_retry_date TIMESTAMPTZ,
  last_error TEXT,

  -- Notifications
  reminder_sent_at TIMESTAMPTZ,
  overdue_notice_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(enrollment_id, payment_number)
);

CREATE INDEX idx_payment_schedules_enrollment ON payment_schedules(enrollment_id);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(scheduled_date);
CREATE INDEX idx_payment_schedules_tenant ON payment_schedules(tenant_id);
```

**Adjustment history example**:
```json
[
  {
    "timestamp": "2025-01-15T10:30:00Z",
    "admin_id": "uuid-here",
    "admin_name": "Admin User",
    "action": "adjust_date",
    "old_date": "2025-01-20T00:00:00Z",
    "new_date": "2025-02-05T00:00:00Z",
    "reason": "User requested extension due to financial hardship"
  },
  {
    "timestamp": "2025-01-10T14:00:00Z",
    "admin_id": "uuid-here",
    "admin_name": "Admin User",
    "action": "pause",
    "reason": "User on medical leave"
  }
]
```

### 4. Subscriptions Table

Active subscription tracking for recurring payments.

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Subscription Details
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'cancelled', 'expired', 'past_due'
  )),

  -- Billing
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),

  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Stripe Integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Admin Controls
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES users(id),
  pause_reason TEXT,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_enrollment ON subscriptions(enrollment_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### 5. Enhanced Payments Table

```sql
-- Add new columns to existing payments table
ALTER TABLE public.payments
ADD COLUMN product_id UUID REFERENCES products(id),
ADD COLUMN payment_plan_id UUID REFERENCES payment_plans(id),
ADD COLUMN payment_schedule_id UUID REFERENCES payment_schedules(id),
ADD COLUMN subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN payment_type TEXT CHECK (payment_type IN ('deposit', 'installment', 'subscription', 'full', 'one_time')),
ADD COLUMN stripe_invoice_id TEXT,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_payments_product ON payments(product_id);
CREATE INDEX idx_payments_plan ON payments(payment_plan_id);
CREATE INDEX idx_payments_schedule ON payments(payment_schedule_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
```

### 6. Enhanced Enrollments Table

```sql
-- Add payment tracking to enrollments
ALTER TABLE public.enrollments
ADD COLUMN product_id UUID REFERENCES products(id),
ADD COLUMN payment_plan_id UUID REFERENCES payment_plans(id),
ADD COLUMN total_amount DECIMAL(10, 2),
ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
  'pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'
)),
ADD COLUMN deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN deposit_amount DECIMAL(10, 2),
ADD COLUMN remaining_amount DECIMAL(10, 2),
ADD COLUMN next_payment_date TIMESTAMPTZ,
ADD COLUMN payment_start_date TIMESTAMPTZ,
ADD COLUMN payment_metadata JSONB DEFAULT '{}';

CREATE INDEX idx_enrollments_product ON enrollments(product_id);
CREATE INDEX idx_enrollments_payment_plan ON enrollments(payment_plan_id);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX idx_enrollments_next_payment ON enrollments(next_payment_date);
```

## Payment Flows

### Flow 1: One-Time Payment

```
User enrolls → Auto-detect plan → Create product record →
Create enrollment → Process Stripe payment → Mark complete
```

### Flow 2: Deposit + Installments

```
User enrolls → Auto-detect plan → Create product record →
Create enrollment → Process deposit (Stripe) →
Generate payment schedule → Admin can adjust dates →
Create Stripe invoices → Process installments →
Send reminders → Handle failed payments → Mark complete
```

### Flow 3: Subscription

```
User subscribes → Auto-detect plan → Create product record →
Create enrollment → Create subscription record →
Create Stripe subscription → Process recurring payments →
Handle renewals → Admin can pause/cancel → Track lifetime
```

## Auto-Detection System

### Detection Process

1. **Check forced plan**: If `forced_payment_plan_id` is set, use it immediately
2. **Evaluate rules**: Query payment plans ordered by priority DESC
3. **Rule matching**: Evaluate auto_detect_rules for each plan
4. **First match wins**: Return first plan where all rules match
5. **Fallback**: Use `default_payment_plan_id` if no rules match
6. **Error**: Throw error if no plan can be assigned

### Rule Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `price_range` | Product price within range | `{"min": 1000, "max": 5000}` |
| `product_type` | Product type matches | `{"values": ["program", "course"]}` |
| `metadata` | Product metadata field matches | `{"field": "category", "value": "professional"}` |
| `user_segment` | User role/segment matches | `{"values": ["students", "parents"]}` |
| `custom` | Custom condition via function | `{"function": "checkEligibility"}` |

### Rule Operators

- `equals`: Exact match
- `not_equals`: Does not match
- `in`: Value in array
- `not_in`: Value not in array
- `between`: Numeric value between min/max
- `greater_than`: Numeric value greater than
- `less_than`: Numeric value less than
- `contains`: String contains substring
- `regex`: Regular expression match

## Admin Schedule Controls

### Available Operations

#### 1. Adjust Payment Date

Move a specific payment to a new date.

```typescript
await scheduleManager.adjustSchedule(
  scheduleId,
  newDate,
  adminId,
  "User requested extension"
);
```

#### 2. Pause Enrollment Payments

Temporarily pause all future payments for an enrollment.

```typescript
await scheduleManager.pauseSchedule(
  enrollmentId,
  adminId,
  "User on medical leave"
);
```

#### 3. Resume Payments

Resume paused payments, optionally setting a new start date.

```typescript
await scheduleManager.resumeSchedule(
  enrollmentId,
  newStartDate,
  adminId
);
```

#### 4. Set Custom Start Date

Set when installment payments should begin (useful for deposit scenarios).

```typescript
await scheduleManager.setCustomStartDate(
  enrollmentId,
  startDate,
  adminId
);
```

#### 5. Bulk Adjustments

Apply adjustments to multiple schedules at once.

```typescript
await scheduleManager.bulkAdjust(
  scheduleIds,
  adjustmentType,
  adjustmentValue,
  adminId,
  reason
);
```

## Stripe Integration

### Payment Methods

#### One-Time Payment
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,
  currency: 'usd',
  customer: stripeCustomerId,
  metadata: {
    enrollment_id: enrollmentId,
    product_id: productId,
    payment_type: 'one_time'
  }
});
```

#### Deposit Payment
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: depositAmount * 100,
  currency: 'usd',
  customer: stripeCustomerId,
  metadata: {
    enrollment_id: enrollmentId,
    product_id: productId,
    payment_type: 'deposit',
    total_amount: totalAmount
  }
});
```

#### Installment Invoices
```typescript
const invoice = await stripe.invoices.create({
  customer: stripeCustomerId,
  auto_advance: false, // Manual control
  collection_method: 'send_invoice',
  days_until_due: 7,
  metadata: {
    payment_schedule_id: scheduleId,
    enrollment_id: enrollmentId,
    installment_number: paymentNumber
  }
});

await stripe.invoiceItems.create({
  customer: stripeCustomerId,
  invoice: invoice.id,
  amount: installmentAmount * 100,
  currency: 'usd',
  description: `Payment ${paymentNumber} of ${totalInstallments}`
});
```

#### Subscription
```typescript
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: stripePriceId }],
  trial_period_days: trialDays,
  metadata: {
    enrollment_id: enrollmentId,
    product_id: productId
  }
});
```

### Webhook Handling

```typescript
// Handle payment_intent.succeeded
case 'payment_intent.succeeded':
  await handlePaymentSuccess(event.data.object);
  break;

// Handle invoice.payment_succeeded
case 'invoice.payment_succeeded':
  await handleInvoicePayment(event.data.object);
  break;

// Handle invoice.payment_failed
case 'invoice.payment_failed':
  await handlePaymentFailure(event.data.object);
  break;

// Handle customer.subscription.updated
case 'customer.subscription.updated':
  await handleSubscriptionUpdate(event.data.object);
  break;

// Handle customer.subscription.deleted
case 'customer.subscription.deleted':
  await handleSubscriptionCancellation(event.data.object);
  break;
```

## Integration Guide

### Adding Payment to a New Product Type

**Step 1**: Register the product

```typescript
import { registerProduct } from '@/lib/payments/paymentEngine';

const product = await registerProduct({
  tenant_id: tenantId,
  product_type: 'workshop', // New type
  product_id: workshopId,
  product_name: workshop.name,
  price: workshop.price,
  auto_assign_payment_plan: true,
  metadata: {
    duration: workshop.duration,
    capacity: workshop.capacity
  }
});
```

**Step 2**: Handle enrollment

```typescript
import { processEnrollment } from '@/lib/payments/paymentEngine';

const result = await processEnrollment({
  user_id: userId,
  product_id: product.id,
  enrollment_data: {
    workshop_id: workshopId,
    // ... other enrollment fields
  }
});

// result contains:
// - enrollment
// - payment_plan
// - payment_schedules (if applicable)
// - stripe_client_secret (for payment UI)
```

**Step 3**: Display payment UI

```typescript
// For immediate payment (one-time, deposit)
<PaymentForm
  clientSecret={result.stripe_client_secret}
  amount={result.amount}
  onSuccess={handlePaymentSuccess}
/>

// For installments
<PaymentScheduleDisplay
  schedules={result.payment_schedules}
  totalAmount={result.total_amount}
  paidAmount={result.paid_amount}
/>
```

## Reporting System

See [PAYMENT_SYSTEM_REPORTS.md](./PAYMENT_SYSTEM_REPORTS.md) for comprehensive documentation on:
- 7 report types with examples
- Chart implementations
- Materialized views
- Report generation API
- Export functionality

## API Reference

See [PAYMENT_SYSTEM_API.md](./PAYMENT_SYSTEM_API.md) for complete API documentation including:
- All endpoints
- Request/response formats
- Authentication
- Error handling
- Rate limiting

## Admin Guide

See [PAYMENT_SYSTEM_ADMIN_GUIDE.md](./PAYMENT_SYSTEM_ADMIN_GUIDE.md) for admin operations including:
- Creating payment plans
- Managing schedules
- Handling exceptions
- Running reports
- Troubleshooting

## Security Considerations

1. **Row Level Security**: All tables enforce tenant isolation via RLS policies
2. **Admin Actions**: All schedule adjustments logged with admin ID and reason
3. **Stripe Webhooks**: Verify webhook signatures before processing
4. **Payment Data**: Never store full card numbers, use Stripe tokens only
5. **Audit Trail**: Complete history of all payment and schedule changes
6. **Access Control**: Admin payment operations require specific permissions

## Testing Strategy

1. **Unit Tests**: Core payment engine logic, auto-detection rules
2. **Integration Tests**: Stripe API interactions, webhook processing
3. **End-to-End Tests**: Complete enrollment and payment flows
4. **Admin Tests**: Schedule adjustment operations
5. **Report Tests**: Data accuracy in reporting views

## Performance Optimization

1. **Materialized Views**: Pre-calculated aggregations for reports
2. **Indexes**: Strategic indexes on foreign keys and query fields
3. **Caching**: Payment plan detection results cached per product
4. **Batch Processing**: Bulk invoice creation and schedule updates
5. **Background Jobs**: Reminder emails, retry failed payments asynchronously

## Troubleshooting

### Payment Not Processing

1. Check Stripe webhook logs
2. Verify payment_schedules status
3. Check retry_count and last_error
4. Validate Stripe customer and payment method

### Auto-Detection Not Working

1. Verify payment plans have `auto_detect_enabled = true`
2. Check rule conditions match product attributes
3. Review priority ordering
4. Check for forced_payment_plan_id override

### Schedule Adjustments Not Applied

1. Verify admin has proper permissions
2. Check adjustment_history in payment_schedules
3. Ensure schedule status allows adjustments
4. Verify Stripe invoice hasn't been finalized

## Migration Path

For existing systems:

1. Run database migrations to create new tables
2. Backfill products table from existing programs/courses
3. Create default payment plans matching current settings
4. Migrate active enrollments to new structure
5. Update admin UI to use new components
6. Configure Stripe webhooks
7. Test thoroughly in staging environment

## Future Enhancements

- Payment plan versioning
- Multi-currency support
- Dunning management (smart retry strategies)
- Payment analytics dashboard
- Automated payment plan optimization
- Custom payment terms per user
- Payment plan A/B testing
- Integration with additional payment providers

## Support

For questions or issues:
- Check [PAYMENT_SYSTEM_API.md](./PAYMENT_SYSTEM_API.md) for API details
- Review [PAYMENT_SYSTEM_ADMIN_GUIDE.md](./PAYMENT_SYSTEM_ADMIN_GUIDE.md) for admin operations
- Check [PAYMENT_SYSTEM_REPORTS.md](./PAYMENT_SYSTEM_REPORTS.md) for reporting questions
