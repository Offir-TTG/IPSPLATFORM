# Payment System API Reference

## Table of Contents

- [Authentication](#authentication)
- [Products API](#products-api)
- [Payment Plans API](#payment-plans-api)
- [Enrollments & Payments API](#enrollments--payments-api)
- [Payment Schedules API](#payment-schedules-api)
- [Subscriptions API](#subscriptions-api)
- [Reports API](#reports-api)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)

## Authentication

All API endpoints require authentication via Supabase auth session. Include the session token in requests:

```typescript
headers: {
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
}
```

### Admin Endpoints

Endpoints marked with 🔐 require admin role permissions.

## Products API

### Register Product 🔐

Register a new product (program, course, lecture, etc.) in the payment system.

**Endpoint**: `POST /api/admin/payments/products`

**Request**:
```typescript
{
  product_type: 'program' | 'course' | 'lecture' | 'workshop' | 'custom';
  product_id: string; // UUID of the actual product
  product_name: string;
  price: number;
  currency?: string; // Default: 'USD'
  auto_assign_payment_plan?: boolean; // Default: true
  default_payment_plan_id?: string;
  forced_payment_plan_id?: string;
  metadata?: object;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    product_type: string;
    product_id: string;
    product_name: string;
    price: number;
    currency: string;
    auto_assign_payment_plan: boolean;
    default_payment_plan_id: string | null;
    forced_payment_plan_id: string | null;
    metadata: object;
    created_at: string;
  }
}
```

### Get Product

**Endpoint**: `GET /api/admin/payments/products/:id`

**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    product_type: string;
    product_id: string;
    product_name: string;
    price: number;
    currency: string;
    payment_plans: PaymentPlan[];
    enrollments_count: number;
    total_revenue: number;
    created_at: string;
  }
}
```

### List Products 🔐

**Endpoint**: `GET /api/admin/payments/products`

**Query Parameters**:
- `product_type`: Filter by type
- `is_active`: Filter by active status
- `search`: Search by product name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```typescript
{
  success: true;
  data: {
    products: Product[];
    total: number;
    page: number;
    limit: number;
  }
}
```

### Update Product 🔐

**Endpoint**: `PUT /api/admin/payments/products/:id`

**Request**: Same as Register Product (all fields optional)

### Delete Product 🔐

**Endpoint**: `DELETE /api/admin/payments/products/:id`

**Response**:
```typescript
{
  success: true;
  message: "Product deleted successfully"
}
```

## Payment Plans API

### Create Payment Plan 🔐

**Endpoint**: `POST /api/admin/payments/plans`

**Request**:
```typescript
{
  plan_name: string;
  plan_description?: string;
  plan_type: 'one_time' | 'deposit' | 'installments' | 'subscription';

  // For deposit plans
  deposit_type?: 'percentage' | 'fixed';
  deposit_amount?: number; // For fixed deposit
  deposit_percentage?: number; // For percentage deposit

  // For installment plans
  installment_count?: number;
  installment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;

  // For subscription plans
  subscription_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  subscription_trial_days?: number;

  // Auto-detection
  auto_detect_enabled?: boolean;
  auto_detect_rules?: Array<{
    condition: string;
    operator: string;
    value?: any;
    values?: any[];
    min?: number;
    max?: number;
    field?: string;
  }>;
  priority?: number;

  is_active?: boolean;
  is_default?: boolean;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    plan_name: string;
    plan_type: string;
    // ... all plan fields
    created_at: string;
  }
}
```

**Example - Deposit Plan**:
```typescript
{
  plan_name: "30% Deposit + 6 Monthly Installments",
  plan_description: "Pay 30% upfront, rest over 6 months",
  plan_type: "deposit",
  deposit_type: "percentage",
  deposit_percentage: 30,
  installment_count: 6,
  installment_frequency: "monthly",
  auto_detect_enabled: true,
  auto_detect_rules: [
    {
      condition: "price_range",
      operator: "between",
      min: 2000,
      max: 10000
    },
    {
      condition: "product_type",
      operator: "in",
      values: ["program", "course"]
    }
  ],
  priority: 10
}
```

### Get Payment Plan

**Endpoint**: `GET /api/admin/payments/plans/:id`

**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    plan_name: string;
    plan_type: string;
    // ... all plan fields
    usage_count: number; // Number of enrollments using this plan
    total_revenue: number;
  }
}
```

### List Payment Plans

**Endpoint**: `GET /api/admin/payments/plans`

**Query Parameters**:
- `plan_type`: Filter by type
- `is_active`: Filter by active status
- `auto_detect_enabled`: Filter plans with auto-detect
- `search`: Search by plan name

**Response**:
```typescript
{
  success: true;
  data: {
    plans: PaymentPlan[];
    total: number;
  }
}
```

### Update Payment Plan 🔐

**Endpoint**: `PUT /api/admin/payments/plans/:id`

**Request**: Same as Create (all fields optional)

### Delete Payment Plan 🔐

**Endpoint**: `DELETE /api/admin/payments/plans/:id`

**Note**: Cannot delete plans with active enrollments

### Test Auto-Detection 🔐

Test which payment plan would be assigned to a product.

**Endpoint**: `POST /api/admin/payments/plans/test-detection`

**Request**:
```typescript
{
  product_id: string;
  user_id?: string; // Optional, for user-specific rules
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    detected_plan: PaymentPlan | null;
    detection_method: 'forced' | 'auto_detect' | 'default' | 'none';
    matched_rules?: object[];
    evaluated_plans: Array<{
      plan_id: string;
      plan_name: string;
      matched: boolean;
      failed_rules?: string[];
    }>;
  }
}
```

## Enrollments & Payments API

### Create Enrollment with Payment

Process a new enrollment and set up payment.

**Endpoint**: `POST /api/enrollments`

**Request**:
```typescript
{
  product_id: string;
  enrollment_data: {
    course_id?: string;
    program_id?: string;
    // ... other enrollment fields based on product type
  };
  payment_plan_id?: string; // Optional override
  payment_start_date?: string; // ISO date, for installments
  stripe_payment_method_id?: string; // For immediate payment
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    enrollment: {
      id: string;
      user_id: string;
      product_id: string;
      payment_plan_id: string;
      total_amount: number;
      paid_amount: number;
      payment_status: 'pending' | 'partial' | 'paid';
      deposit_paid: boolean;
      next_payment_date: string | null;
      created_at: string;
    };
    payment_plan: PaymentPlan;
    payment_schedules: PaymentSchedule[];
    immediate_payment?: {
      amount: number;
      stripe_client_secret: string;
      payment_type: 'full' | 'deposit';
    };
  }
}
```

### Get Enrollment Payment Details

**Endpoint**: `GET /api/enrollments/:enrollmentId/payment`

**Response**:
```typescript
{
  success: true;
  data: {
    enrollment: Enrollment;
    payment_plan: PaymentPlan;
    payment_schedules: PaymentSchedule[];
    payments: Payment[];
    subscription?: Subscription;
    summary: {
      total_amount: number;
      paid_amount: number;
      remaining_amount: number;
      next_payment_date: string | null;
      next_payment_amount: number | null;
      is_overdue: boolean;
      overdue_amount: number;
    };
  }
}
```

### Process Payment

Process a scheduled payment.

**Endpoint**: `POST /api/payments/process`

**Request**:
```typescript
{
  payment_schedule_id: string;
  stripe_payment_method_id: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    payment: Payment;
    payment_schedule: PaymentSchedule;
    stripe_payment_intent: object;
    enrollment_updated: {
      paid_amount: number;
      remaining_amount: number;
      payment_status: string;
    };
  }
}
```

### List User Payments

Get all payments for the authenticated user.

**Endpoint**: `GET /api/user/payments`

**Query Parameters**:
- `status`: Filter by payment status
- `enrollment_id`: Filter by enrollment
- `page`, `limit`: Pagination

**Response**:
```typescript
{
  success: true;
  data: {
    payments: Payment[];
    total: number;
    summary: {
      total_paid: number;
      total_pending: number;
      total_failed: number;
    };
  }
}
```

## Payment Schedules API

### Get Payment Schedules 🔐

**Endpoint**: `GET /api/admin/payments/schedules`

**Query Parameters**:
- `enrollment_id`: Filter by enrollment
- `status`: Filter by status
- `from_date`, `to_date`: Date range
- `overdue`: Show only overdue payments
- `page`, `limit`: Pagination

**Response**:
```typescript
{
  success: true;
  data: {
    schedules: PaymentSchedule[];
    total: number;
    summary: {
      total_scheduled: number;
      total_paid: number;
      total_pending: number;
      total_overdue: number;
      total_amount_pending: number;
    };
  }
}
```

### Adjust Payment Date 🔐

Move a scheduled payment to a new date.

**Endpoint**: `POST /api/admin/payments/schedules/:scheduleId/adjust`

**Request**:
```typescript
{
  new_date: string; // ISO date
  reason: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    schedule: PaymentSchedule;
    old_date: string;
    new_date: string;
    adjusted_by: string;
  };
  message: "Payment date adjusted successfully";
}
```

### Pause Enrollment Payments 🔐

Pause all future payments for an enrollment.

**Endpoint**: `POST /api/admin/payments/enrollments/:enrollmentId/pause`

**Request**:
```typescript
{
  reason: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    enrollment_id: string;
    paused_schedules: number;
    paused_at: string;
    paused_by: string;
  };
  message: "Payments paused successfully";
}
```

### Resume Enrollment Payments 🔐

Resume paused payments.

**Endpoint**: `POST /api/admin/payments/enrollments/:enrollmentId/resume`

**Request**:
```typescript
{
  new_start_date?: string; // Optional, reschedule from this date
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    enrollment_id: string;
    resumed_schedules: number;
    resumed_at: string;
    new_schedule?: PaymentSchedule[];
  };
  message: "Payments resumed successfully";
}
```

### Set Custom Start Date 🔐

Set when installment payments should begin.

**Endpoint**: `POST /api/admin/payments/enrollments/:enrollmentId/start-date`

**Request**:
```typescript
{
  start_date: string; // ISO date
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    enrollment_id: string;
    payment_start_date: string;
    updated_schedules: PaymentSchedule[];
  };
  message: "Payment start date set successfully";
}
```

### Bulk Adjust Schedules 🔐

Apply adjustments to multiple schedules.

**Endpoint**: `POST /api/admin/payments/schedules/bulk-adjust`

**Request**:
```typescript
{
  schedule_ids: string[];
  adjustment_type: 'delay_days' | 'set_date' | 'pause';
  adjustment_value?: number | string; // Days or new date
  reason: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    updated_schedules: number;
    failed_updates: number;
    results: Array<{
      schedule_id: string;
      success: boolean;
      error?: string;
    }>;
  }
}
```

## Subscriptions API

### Create Subscription

**Endpoint**: `POST /api/subscriptions`

**Request**:
```typescript
{
  product_id: string;
  payment_plan_id?: string; // Optional override
  stripe_payment_method_id: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    subscription: Subscription;
    enrollment: Enrollment;
    stripe_subscription: object;
  }
}
```

### Get Subscription

**Endpoint**: `GET /api/subscriptions/:subscriptionId`

**Response**:
```typescript
{
  success: true;
  data: {
    subscription: Subscription;
    upcoming_invoice: {
      amount: number;
      due_date: string;
    } | null;
    payment_history: Payment[];
  }
}
```

### Cancel Subscription

**Endpoint**: `POST /api/subscriptions/:subscriptionId/cancel`

**Request**:
```typescript
{
  cancel_at_period_end: boolean; // If true, cancel at end of current period
  cancellation_reason?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    subscription: Subscription;
    cancelled_at: string;
    ends_at: string;
  };
  message: "Subscription cancelled successfully";
}
```

### Pause Subscription 🔐

**Endpoint**: `POST /api/admin/subscriptions/:subscriptionId/pause`

**Request**:
```typescript
{
  pause_reason: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    subscription: Subscription;
    paused_at: string;
  };
  message: "Subscription paused successfully";
}
```

### Resume Subscription 🔐

**Endpoint**: `POST /api/admin/subscriptions/:subscriptionId/resume`

**Response**:
```typescript
{
  success: true;
  data: {
    subscription: Subscription;
    resumed_at: string;
  };
  message: "Subscription resumed successfully";
}
```

## Reports API

### Revenue Dashboard 🔐

**Endpoint**: `GET /api/admin/payments/reports/revenue`

**Query Parameters**:
- `from_date`, `to_date`: Date range
- `product_type`: Filter by product type
- `payment_type`: Filter by payment type
- `granularity`: 'day' | 'week' | 'month' (default: 'day')

**Response**:
```typescript
{
  success: true;
  data: {
    summary: {
      total_revenue: number;
      revenue_change_percent: number;
      avg_transaction_value: number;
      total_transactions: number;
    };
    revenue_over_time: Array<{
      date: string;
      revenue: number;
      transactions: number;
    }>;
    revenue_by_type: Array<{
      payment_type: string;
      revenue: number;
      percentage: number;
    }>;
    revenue_by_product: Array<{
      product_type: string;
      product_name: string;
      revenue: number;
      transactions: number;
    }>;
    mrr?: number; // Monthly Recurring Revenue (subscriptions)
    arr?: number; // Annual Recurring Revenue
  }
}
```

### Payment Status Report 🔐

**Endpoint**: `GET /api/admin/payments/reports/status`

**Response**:
```typescript
{
  success: true;
  data: {
    summary: {
      total_enrollments: number;
      fully_paid: number;
      partially_paid: number;
      pending: number;
      overdue: number;
    };
    status_breakdown: Array<{
      status: string;
      count: number;
      total_amount: number;
      percentage: number;
    }>;
    overdue_details: Array<{
      enrollment_id: string;
      user_name: string;
      product_name: string;
      overdue_amount: number;
      days_overdue: number;
    }>;
  }
}
```

### Cash Flow Report 🔐

**Endpoint**: `GET /api/admin/payments/reports/cash-flow`

**Query Parameters**:
- `months_ahead`: Forecast horizon (default: 6)

**Response**:
```typescript
{
  success: true;
  data: {
    current_month: {
      expected: number;
      received: number;
      pending: number;
    };
    forecast: Array<{
      month: string;
      expected_revenue: number;
      scheduled_payments: number;
      subscription_revenue: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
    trends: {
      growth_rate: number;
      seasonal_patterns: object;
    };
  }
}
```

### Product Performance Report 🔐

**Endpoint**: `GET /api/admin/payments/reports/products`

**Response**:
```typescript
{
  success: true;
  data: {
    products: Array<{
      product_id: string;
      product_name: string;
      product_type: string;
      total_revenue: number;
      enrollment_count: number;
      avg_revenue_per_enrollment: number;
      payment_completion_rate: number;
      preferred_payment_plan: string;
    }>;
  }
}
```

### User Payment Analysis 🔐

**Endpoint**: `GET /api/admin/payments/reports/users`

**Response**:
```typescript
{
  success: true;
  data: {
    summary: {
      total_users: number;
      paying_users: number;
      avg_ltv: number;
      churn_rate: number;
    };
    user_segments: Array<{
      segment: string;
      user_count: number;
      total_revenue: number;
      avg_revenue: number;
    }>;
    payment_behavior: {
      on_time_percentage: number;
      late_payment_percentage: number;
      default_rate: number;
    };
  }
}
```

### Operational Report 🔐

**Endpoint**: `GET /api/admin/payments/reports/operational`

**Response**:
```typescript
{
  success: true;
  data: {
    pending_actions: {
      overdue_payments: number;
      failed_payments_to_retry: number;
      paused_schedules: number;
      ending_subscriptions: number;
    };
    recent_adjustments: Array<{
      timestamp: string;
      admin_name: string;
      action_type: string;
      enrollment_id: string;
      reason: string;
    }>;
    reminders_sent: {
      today: number;
      this_week: number;
      this_month: number;
    };
  }
}
```

### Financial Reconciliation 🔐

**Endpoint**: `GET /api/admin/payments/reports/reconciliation`

**Query Parameters**:
- `from_date`, `to_date`: Date range

**Response**:
```typescript
{
  success: true;
  data: {
    database_total: number;
    stripe_total: number;
    difference: number;
    matched_transactions: number;
    unmatched_transactions: number;
    discrepancies: Array<{
      payment_id: string;
      database_amount: number;
      stripe_amount: number;
      difference: number;
      reason: string;
    }>;
  }
}
```

### Export Report 🔐

Export any report as CSV or Excel.

**Endpoint**: `GET /api/admin/payments/reports/:reportType/export`

**Query Parameters**:
- Same as corresponding report endpoint
- `format`: 'csv' | 'excel'

**Response**: File download

## Webhooks

### Stripe Webhook Endpoint

**Endpoint**: `POST /api/webhooks/stripe`

**Headers**:
```
stripe-signature: <signature>
```

**Handled Events**:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

**Response**:
```typescript
{
  received: true
}
```

## Error Handling

### Error Response Format

```typescript
{
  success: false;
  error: string; // Human-readable error message
  error_code?: string; // Machine-readable error code
  details?: object; // Additional error details
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `PERMISSION_DENIED` | Insufficient permissions |
| `PRODUCT_NOT_FOUND` | Product not found |
| `PLAN_NOT_FOUND` | Payment plan not found |
| `ENROLLMENT_NOT_FOUND` | Enrollment not found |
| `SCHEDULE_NOT_FOUND` | Payment schedule not found |
| `INVALID_PAYMENT_STATE` | Payment in invalid state for operation |
| `STRIPE_ERROR` | Stripe API error |
| `DETECTION_FAILED` | Could not detect payment plan |
| `PAYMENT_FAILED` | Payment processing failed |
| `SCHEDULE_LOCKED` | Schedule cannot be modified (payment in progress) |
| `PLAN_IN_USE` | Cannot delete plan with active enrollments |

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `403`: Forbidden (permission denied)
- `404`: Not found
- `409`: Conflict (e.g., duplicate, locked resource)
- `422`: Unprocessable entity (business logic error)
- `500`: Internal server error

## Rate Limiting

- **User endpoints**: 100 requests per minute
- **Admin endpoints**: 300 requests per minute
- **Report endpoints**: 20 requests per minute
- **Webhook endpoint**: No rate limit (uses Stripe signature verification)

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Pagination

Paginated endpoints return:

```typescript
{
  success: true;
  data: {
    items: Array<T>;
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  }
}
```

## Versioning

API version is included in URL: `/api/v1/...`

Current version: `v1`

## SDK Examples

### TypeScript/JavaScript

```typescript
import { PaymentClient } from '@/lib/payments/client';

const client = new PaymentClient(session.access_token);

// Register product
const product = await client.products.register({
  product_type: 'course',
  product_id: courseId,
  product_name: 'Advanced React',
  price: 299.99
});

// Create enrollment with payment
const enrollment = await client.enrollments.create({
  product_id: product.id,
  enrollment_data: { course_id: courseId },
  stripe_payment_method_id: paymentMethodId
});

// Get payment details
const paymentDetails = await client.enrollments.getPaymentDetails(
  enrollment.data.enrollment.id
);
```

### cURL Examples

```bash
# Register product
curl -X POST https://your-domain.com/api/admin/payments/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_type": "course",
    "product_id": "uuid-here",
    "product_name": "Advanced React",
    "price": 299.99
  }'

# Adjust payment date
curl -X POST https://your-domain.com/api/admin/payments/schedules/SCHEDULE_ID/adjust \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_date": "2025-02-15T00:00:00Z",
    "reason": "User requested extension"
  }'
```
