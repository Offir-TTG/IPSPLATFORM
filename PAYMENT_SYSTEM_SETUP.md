# Payment System Setup Guide

## Step 1: Apply Database Migration

**CRITICAL**: You must run this migration in Supabase before the payment system will work.

### How to Apply the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/20251122_payment_system_core.sql`
3. Paste into SQL Editor and click "Run"

This migration will create:
- ✅ `products` table - Universal product registration
- ✅ `payment_schedules` table - Payment tracking with admin controls
- ✅ `subscriptions` table - Recurring payment management
- ✅ Enhanced `payments` table with new columns
- ✅ Enhanced `enrollments` table with payment tracking
- ✅ All indexes, foreign keys, and RLS policies

### Verify Migration Success

After running the migration, verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('products', 'payment_schedules', 'subscriptions');
```

You should see all 3 tables listed.

## Step 2: Current Implementation Status

### ✅ What's Complete (20%)
- Payment Plans management (UI + API)
  - `/admin/payments/plans` - Fully functional CRUD
  - `POST /api/admin/payments/plans` - Create plan
  - `GET /api/admin/payments/plans` - List plans
  - `PUT /api/admin/payments/plans/:id` - Update plan
  - `DELETE /api/admin/payments/plans/:id` - Delete plan

### 🚧 What's Being Built (80%)

#### Phase 1: Database (IN PROGRESS)
- Migration file created: `20251122_payment_system_core.sql`
- **Action Required**: You must apply this migration manually

#### Phase 2: Backend Services (NEXT)
- `src/lib/payments/productService.ts` - Product registration
- `src/lib/payments/paymentEngine.ts` - Auto-detection & processing
- `src/lib/payments/scheduleManager.ts` - Payment schedule management
- `src/lib/payments/stripeIntegration.ts` - Stripe API wrapper

#### Phase 3: API Endpoints
- Products API (`/api/admin/payments/products/*`)
- Payment Schedules API (`/api/admin/payments/schedules/*`)
- Reports API (`/api/admin/payments/reports/*`)
- User Enrollment API (`/api/enrollments`)
- Subscriptions API (`/api/subscriptions`)
- Stripe Webhooks (`/api/webhooks/stripe`)

#### Phase 4: Connect Real Data
- Dashboard stats (currently mock data)
- Reports (7 types, all mock data)

## Step 3: Next Actions

After you apply the migration, I will:

1. Create backend services for payment processing
2. Build Products API endpoints
3. Build Payment Schedules API endpoints
4. Build Reports API endpoints
5. Connect dashboard and reports to real data
6. Implement Stripe integration
7. Create user-facing payment portal

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Payment System                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      ┌──────────────┐      ┌────────┐ │
│  │   Products   │─────▶│Payment Plans │─────▶│Schedule│ │
│  └──────────────┘      └──────────────┘      └────────┘ │
│         │                      │                   │     │
│         │                      │                   │     │
│         ▼                      ▼                   ▼     │
│  ┌──────────────┐      ┌──────────────┐      ┌────────┐ │
│  │Auto-Detector │      │ Stripe API   │      │Reports │ │
│  └──────────────┘      └──────────────┘      └────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Key Features (When Complete)

1. **Universal Product System**
   - Register any course/program/workshop as a "product"
   - Automatic payment plan detection based on rules
   - Flexible pricing and payment options

2. **Payment Plans**
   - One-time payments
   - Deposit + installments
   - Installments only
   - Subscriptions (recurring)

3. **Admin Controls**
   - Adjust payment dates
   - Pause/resume payments
   - View detailed payment schedules
   - Comprehensive reporting

4. **Stripe Integration**
   - Secure payment processing
   - Automatic invoice generation
   - Subscription management
   - Webhook handling

5. **Reporting**
   - Revenue dashboard
   - Payment status report
   - Cash flow forecast
   - Product performance
   - User payment analysis
   - Operational report
   - Financial reconciliation

## Questions?

See the comprehensive documentation:
- `docs/PAYMENT_SYSTEM.md` - Complete architecture
- `docs/PAYMENT_SYSTEM_API.md` - API reference
- `docs/PAYMENT_INTEGRATION_GUIDE.md` - Integration guide
- `docs/PAYMENT_SYSTEM_ADMIN_GUIDE.md` - Admin operations
- `docs/PAYMENT_SYSTEM_REPORTS.md` - Reporting system

## Ready to Continue?

Once you've applied the migration, let me know and I'll continue building the backend services and APIs!
