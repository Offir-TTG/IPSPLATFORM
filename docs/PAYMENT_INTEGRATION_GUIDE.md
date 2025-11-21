# Payment System Integration Guide

## Quick Start: Adding Payments to Courses and Programs

This guide shows you how to integrate the payment system with your existing courses and programs.

## Overview

The payment system uses a **universal product** approach:
1. Register your course/program as a "product"
2. Set up payment plans (or use auto-detection)
3. When user enrolls, payment is automatically handled

## Step 1: Register Product (One-Time Setup)

### For Courses

When you create or update a course, register it as a product:

```typescript
// In your course creation/update API route
// src/app/api/admin/lms/courses/route.ts

import { registerProduct } from '@/lib/payments/productService';

// After creating the course
const course = await supabase
  .from('courses')
  .insert({
    name: 'Advanced React',
    description: '...',
    price: 299.99,
    // ... other course fields
  })
  .select()
  .single();

// Register as product for payment system
const product = await registerProduct({
  tenant_id: tenantId,
  product_type: 'course',
  product_id: course.data.id,
  product_name: course.data.name,
  price: course.data.price,
  auto_assign_payment_plan: true, // Let system auto-detect payment plan
  metadata: {
    duration: course.data.duration,
    category: 'professional-development'
  }
});
```

### For Programs

```typescript
// In your program creation/update API route
// src/app/api/admin/programs/route.ts

import { registerProduct } from '@/lib/payments/productService';

const program = await supabase
  .from('programs')
  .insert({
    name: 'Full Stack Developer Program',
    description: '...',
    price: 2499.99,
    // ... other program fields
  })
  .select()
  .single();

// Register as product
const product = await registerProduct({
  tenant_id: tenantId,
  product_type: 'program',
  product_id: program.data.id,
  product_name: program.data.name,
  price: program.data.price,
  auto_assign_payment_plan: true,
  metadata: {
    duration_months: 6,
    course_count: 12,
    category: 'bootcamp'
  }
});
```

## Step 2: Set Up Payment Plans (Admin)

### Option A: Auto-Detection (Recommended)

Create payment plans with rules that automatically match your products:

**Example: One-Time Payment for Courses Under $500**

```typescript
// Admin creates this via UI or API
{
  plan_name: "Quick Payment",
  plan_type: "one_time",
  auto_detect_enabled: true,
  auto_detect_rules: [
    {
      condition: "price_range",
      operator: "less_than",
      value: 500
    },
    {
      condition: "product_type",
      operator: "in",
      values: ["course", "lecture"]
    }
  ],
  priority: 5
}
```

**Example: Deposit + Installments for Programs**

```typescript
{
  plan_name: "30% Deposit + 6 Months",
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
      operator: "equals",
      value: "program"
    }
  ],
  priority: 10
}
```

### Option B: Force Specific Plan

Override auto-detection for specific products:

```typescript
// When registering product
const product = await registerProduct({
  tenant_id: tenantId,
  product_type: 'program',
  product_id: program.id,
  product_name: program.name,
  price: program.price,
  forced_payment_plan_id: 'uuid-of-specific-plan', // Always use this plan
});
```

## Step 3: Handle Enrollment with Payment

### User Enrollment Flow

```typescript
// src/app/api/enrollments/route.ts

import { processEnrollment } from '@/lib/payments/enrollmentService';

export async function POST(req: Request) {
  const { course_id, program_id, stripe_payment_method_id } = await req.json();

  // Get the product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('product_type', course_id ? 'course' : 'program')
    .eq('product_id', course_id || program_id)
    .single();

  // Process enrollment with payment
  const result = await processEnrollment({
    user_id: userId,
    product_id: product.id,
    enrollment_data: {
      course_id: course_id,
      program_id: program_id,
      // ... other enrollment fields
    },
    stripe_payment_method_id: stripe_payment_method_id
  });

  return Response.json({
    success: true,
    data: {
      enrollment: result.enrollment,
      payment_plan: result.payment_plan,
      payment_schedules: result.payment_schedules,
      immediate_payment: result.immediate_payment // For deposit/full payment
    }
  });
}
```

### What Happens Automatically

The `processEnrollment` function:
1. ✅ Detects appropriate payment plan
2. ✅ Creates enrollment record
3. ✅ Calculates payment amounts
4. ✅ Creates payment schedules
5. ✅ Processes immediate payment (deposit/full)
6. ✅ Sets up future installments in Stripe
7. ✅ Returns client secret for payment UI

## Step 4: Display Payment UI

### Show Payment Options During Enrollment

```typescript
// components/enrollment/PaymentSection.tsx
'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentSection({ product, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  // Fetch available payment plans for this product
  const { data: plans } = useFetch(`/api/products/${product.id}/payment-plans`);

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);

    // Initialize enrollment and get client secret
    const response = await fetch('/api/enrollments/initialize', {
      method: 'POST',
      body: JSON.stringify({
        product_id: product.id,
        payment_plan_id: plan.id
      })
    });

    const data = await response.json();
    setClientSecret(data.client_secret);
  };

  return (
    <div>
      <h3>Select Payment Plan</h3>

      {/* Display available plans */}
      <div className="grid gap-4">
        {plans?.map(plan => (
          <PaymentPlanCard
            key={plan.id}
            plan={plan}
            product={product}
            selected={selectedPlan?.id === plan.id}
            onClick={() => handleSelectPlan(plan)}
          />
        ))}
      </div>

      {/* Stripe Payment Form */}
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm onSuccess={onSuccess} />
        </Elements>
      )}
    </div>
  );
}

function PaymentPlanCard({ plan, product, selected, onClick }) {
  const getDisplayText = () => {
    switch (plan.plan_type) {
      case 'one_time':
        return `Pay ${formatCurrency(product.price)} now`;

      case 'deposit':
        const depositAmount = plan.deposit_type === 'percentage'
          ? product.price * (plan.deposit_percentage / 100)
          : plan.deposit_amount;
        const remaining = product.price - depositAmount;
        return `${formatCurrency(depositAmount)} deposit, then ${plan.installment_count} payments of ${formatCurrency(remaining / plan.installment_count)}`;

      case 'installments':
        return `${plan.installment_count} payments of ${formatCurrency(product.price / plan.installment_count)}`;

      case 'subscription':
        return `${formatCurrency(product.price)} per ${plan.subscription_frequency}`;
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer ${selected ? 'border-primary' : ''}`}
      onClick={onClick}
    >
      <h4>{plan.plan_name}</h4>
      <p>{getDisplayText()}</p>
      <p className="text-sm text-muted-foreground">{plan.plan_description}</p>
    </Card>
  );
}
```

### Display Payment Schedule to User

```typescript
// components/user/PaymentSchedule.tsx
'use client';

import { usePaymentSchedule } from '@/hooks/usePaymentSchedule';

export function PaymentSchedule({ enrollmentId }) {
  const { data, isLoading } = usePaymentSchedule(enrollmentId);

  if (isLoading) return <Skeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(data.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.paid_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">{formatCurrency(data.remaining_amount)}</p>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-2">
            {data.payment_schedules.map((schedule, index) => (
              <div
                key={schedule.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  schedule.status === 'paid' ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-medium">Payment {index + 1}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(schedule.scheduled_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(schedule.amount)}</p>
                  <Badge variant={getStatusVariant(schedule.status)}>
                    {schedule.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Next Payment */}
          {data.next_payment && (
            <Alert>
              <AlertTitle>Next Payment</AlertTitle>
              <AlertDescription>
                {formatCurrency(data.next_payment.amount)} due on {formatDate(data.next_payment.scheduled_date)}
              </AlertDescription>
              <Button className="mt-2" onClick={() => handlePayNow(data.next_payment.id)}>
                Pay Now
              </Button>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Step 5: Updating Existing Courses/Programs

If you already have courses and programs in the database, run a migration script:

```typescript
// scripts/migrate-products.ts

import { supabase } from '@/lib/supabase/client';
import { registerProduct } from '@/lib/payments/productService';

async function migrateExistingProducts() {
  // Migrate all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_standalone', true); // Only standalone courses can be purchased

  for (const course of courses) {
    await registerProduct({
      tenant_id: course.tenant_id,
      product_type: 'course',
      product_id: course.id,
      product_name: course.name,
      price: course.price || 0,
      auto_assign_payment_plan: true,
      metadata: {
        duration: course.duration,
        level: course.level
      }
    });
    console.log(`Migrated course: ${course.name}`);
  }

  // Migrate all programs
  const { data: programs } = await supabase
    .from('programs')
    .select('*');

  for (const program of programs) {
    await registerProduct({
      tenant_id: program.tenant_id,
      product_type: 'program',
      product_id: program.id,
      product_name: program.name,
      price: program.price,
      auto_assign_payment_plan: true,
      metadata: {
        duration_months: program.duration_months,
        course_count: program.course_count
      }
    });
    console.log(`Migrated program: ${program.name}`);
  }
}

migrateExistingProducts();
```

## Common Scenarios

### Scenario 1: Free Course/Program

```typescript
// For free products, still register but set price to 0
const product = await registerProduct({
  tenant_id: tenantId,
  product_type: 'course',
  product_id: course.id,
  product_name: course.name,
  price: 0, // Free
  auto_assign_payment_plan: false // No payment needed
});

// Enrollment is immediate, no payment
const enrollment = await supabase
  .from('enrollments')
  .insert({
    user_id: userId,
    course_id: course.id,
    status: 'active',
    payment_status: 'paid' // Mark as paid since it's free
  });
```

### Scenario 2: Course Within a Program (Already Paid)

```typescript
// When user enrolls in a course that's part of their program
// Check if they already have program enrollment
const { data: programEnrollment } = await supabase
  .from('enrollments')
  .select('*')
  .eq('user_id', userId)
  .eq('program_id', programId)
  .eq('payment_status', 'paid')
  .single();

if (programEnrollment) {
  // User already paid for program, grant course access without payment
  await supabase.from('enrollments').insert({
    user_id: userId,
    course_id: courseId,
    program_id: programId,
    status: 'active',
    payment_status: 'paid', // Covered by program
    total_amount: 0
  });
}
```

### Scenario 3: User Wants to Change Payment Plan

```typescript
// Allow before any payments are made
const canChange = enrollment.paid_amount === 0;

if (canChange) {
  // Delete old schedules
  await supabase
    .from('payment_schedules')
    .delete()
    .eq('enrollment_id', enrollmentId);

  // Create new schedules with new plan
  await generatePaymentSchedules(enrollment, newPaymentPlan);
}
```

## Admin: Managing Payments

### View All Payments for a Course

```typescript
// Admin dashboard
const { data: payments } = await supabase
  .from('payments')
  .select(`
    *,
    enrollments!inner(
      course_id,
      courses(name)
    ),
    users(first_name, last_name, email)
  `)
  .eq('enrollments.course_id', courseId)
  .order('created_at', { ascending: false });
```

### Adjust Payment Dates

```typescript
import { scheduleManager } from '@/lib/payments/scheduleManager';

// User requests extension
await scheduleManager.adjustSchedule(
  scheduleId,
  newDate,
  adminId,
  "User requested 30-day extension due to illness"
);
```

### Refund Enrollment

```typescript
import { refundEnrollment } from '@/lib/payments/refundService';

await refundEnrollment({
  enrollment_id: enrollmentId,
  refund_type: 'full', // or 'partial'
  refund_amount: amount, // for partial
  reason: "User dissatisfied with course content",
  admin_id: adminId
});
```

## Database Queries

### Check if Product Exists

```sql
SELECT p.*
FROM products p
WHERE p.product_type = 'course'
  AND p.product_id = 'course-uuid-here'
  AND p.tenant_id = 'tenant-uuid';
```

### Get Payment Summary for User

```sql
SELECT
  e.id,
  p.product_name,
  p.product_type,
  e.total_amount,
  e.paid_amount,
  e.remaining_amount,
  e.payment_status,
  pp.plan_name
FROM enrollments e
JOIN products p ON e.product_id = p.id
LEFT JOIN payment_plans pp ON e.payment_plan_id = pp.id
WHERE e.user_id = 'user-uuid'
  AND e.tenant_id = 'tenant-uuid';
```

### Get Overdue Payments

```sql
SELECT
  ps.*,
  e.user_id,
  u.email,
  p.product_name
FROM payment_schedules ps
JOIN enrollments e ON ps.enrollment_id = e.id
JOIN users u ON e.user_id = u.id
JOIN products p ON e.product_id = p.id
WHERE ps.status = 'pending'
  AND ps.scheduled_date < NOW()
  AND ps.tenant_id = 'tenant-uuid'
ORDER BY ps.scheduled_date ASC;
```

## Testing

### Test Payment Plan Detection

```typescript
// Test which plan would be assigned
const response = await fetch('/api/admin/payments/plans/test-detection', {
  method: 'POST',
  body: JSON.stringify({
    product_id: 'product-uuid'
  })
});

const result = await response.json();
console.log('Detected plan:', result.detected_plan);
console.log('Method:', result.detection_method);
console.log('Matched rules:', result.matched_rules);
```

### Test Enrollment Flow (Dev Environment)

```typescript
// Use Stripe test mode
const testCard = {
  number: '4242424242424242',
  exp_month: 12,
  exp_year: 2025,
  cvc: '123'
};

// Process test enrollment
const enrollment = await processEnrollment({
  user_id: testUserId,
  product_id: testProductId,
  stripe_payment_method_id: testPaymentMethodId
});
```

## Summary Checklist

- [ ] Register courses/programs as products
- [ ] Create payment plans with auto-detection rules
- [ ] Update enrollment flow to use `processEnrollment`
- [ ] Add payment UI to course/program enrollment pages
- [ ] Display payment schedules to users
- [ ] Set up admin payment management pages
- [ ] Test with Stripe test cards
- [ ] Configure webhooks for production
- [ ] Train admins on payment controls

## Next Steps

1. See [PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md) for complete architecture
2. See [PAYMENT_SYSTEM_API.md](./PAYMENT_SYSTEM_API.md) for API reference
3. See [PAYMENT_SYSTEM_ADMIN_GUIDE.md](./PAYMENT_SYSTEM_ADMIN_GUIDE.md) for admin operations
