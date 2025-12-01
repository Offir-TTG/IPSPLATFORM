# Product Component Implementation Plan

## Executive Summary

**Objective**: Consolidate two competing product systems into a unified "product as bridge" architecture that connects content (programs/courses) with billing, integrations, and compliance.

**Current State**:
- **Two Product Systems Coexist**:
  - **Old System**: [src/types/payments.ts](src/types/payments.ts) + [src/lib/payments/productService.ts](src/lib/payments/productService.ts) - Uses `product_type` + `product_id` string references
  - **New System**: [src/types/product.ts](src/types/product.ts) + [src/app/api/admin/products/route.ts](src/app/api/admin/products/route.ts) - Uses direct foreign keys with inline payment configuration

- **Existing UI**: [src/app/admin/payments/products/page.tsx](src/app/admin/payments/products/page.tsx) - Works with old system

- **Two Schemas**:
  - Migration: `20251122_payment_system_core.sql` - Old approach with external payment_plans table
  - Migration: `20251124_restructure_products_pure_content.sql` - New approach with inline JSONB payment_plan

**Recommendation**: Adopt the new restructured system (20251124) as it provides:
- Direct foreign key relationships (better data integrity)
- Self-contained payment configuration (JSONB payment_plan)
- DocuSign integration fields
- Keap tag support
- Support for bundles and session packs
- Matches LMS type expectations ([src/types/lms.ts](src/types/lms.ts) already references the new Product type)

---

## Product as Bridge Architecture

Products serve as the **billing and integration layer** between content and payment/compliance systems:

```
┌─────────────────────────────────────────────────────────┐
│                      CONTENT LAYER                      │
│         (Programs, Courses, Lectures, etc.)             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   PRODUCT (Bridge)                       │
│  • Links to content (program_id, course_id, etc.)      │
│  • Defines pricing (price, currency)                    │
│  • Payment configuration (payment_plan JSONB)           │
│  • DocuSign integration (requires_signature)            │
│  • Keap tags (keap_tag)                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BILLING & INTEGRATIONS LAYER                │
│  • Payment Schedules                                     │
│  • Stripe Subscriptions                                  │
│  • DocuSign Envelopes                                    │
│  • Keap Contact Tags                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Analysis

### Existing Code Review

#### 1. Old Product System (Currently Used by UI)

**Type Definition**: [src/types/payments.ts](src/types/payments.ts:18-37)
```typescript
export interface Product {
  id: string;
  tenant_id: string;
  product_type: 'program' | 'course' | 'lecture' | 'workshop' | 'custom';
  product_id: string;         // String reference, not foreign key
  product_name: string;
  price: number;
  currency: string;
  auto_assign_payment_plan: boolean;
  default_payment_plan_id?: string;  // References external table
  forced_payment_plan_id?: string;   // References external table
  metadata: Record<string, any>;
  is_active: boolean;
}
```

**Service Layer**: [src/lib/payments/productService.ts](src/lib/payments/productService.ts)
- Functions: `registerProduct`, `updateProduct`, `getProductByTypeAndId`, `listProducts`, `deleteProduct`
- Uses string-based lookup: `product_type` + `product_id`
- Relies on external `payment_plans` table

**UI**: [src/app/admin/payments/products/page.tsx](src/app/admin/payments/products/page.tsx)
- Fully functional admin UI with CRUD operations
- Search and filter capabilities
- Form for creating/editing products
- **Issue**: Uses old Product type from payments.ts

**API Routes**:
- [src/app/api/admin/payments/products/route.ts](src/app/api/admin/payments/products/route.ts)
- [src/app/api/admin/payments/products/[id]/route.ts](src/app/api/admin/payments/products/[id]/route.ts)

---

#### 2. New Product System (Partial Implementation)

**Type Definition**: [src/types/product.ts](src/types/product.ts)
```typescript
export interface Product {
  id: string;
  tenant_id: string;

  // Direct content references (foreign keys)
  type: ProductType;  // 9 types: program, course, lecture, workshop, webinar, session, session_pack, bundle, custom
  title: string;
  description?: string;
  program_id?: string;         // FK to programs
  course_id?: string;          // FK to courses
  contains_courses?: string[]; // For bundles
  session_count?: number;      // For session packs

  // DocuSign integration
  requires_signature: boolean;
  signature_template_id?: string;

  // Payment configuration (self-contained)
  payment_model: PaymentModel;  // one_time, deposit_then_plan, subscription, free
  price?: number;
  currency?: string;
  payment_plan: PaymentPlanConfig;  // JSONB inline config

  // Keap integration
  keap_tag?: string | null;

  is_active: boolean;
  metadata?: Record<string, any>;
}
```

**API Routes**: [src/app/api/admin/products/route.ts](src/app/api/admin/products/route.ts)
- Implements GET and POST
- Full validation logic
- Proper foreign key handling
- Joins program/course data
- Updates back-references (program.product_id, course.product_id)
- **Issue**: No corresponding UI page

---

### Schema Analysis

#### Current Database State: UNKNOWN
We need to verify which migration has been applied to the actual database.

#### Schema A: Old System (20251122_payment_system_core.sql)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  product_type TEXT,  -- 'program' | 'course' | 'lecture' | 'workshop' | 'custom'
  product_id UUID,    -- String reference, not FK
  product_name TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  auto_assign_payment_plan BOOLEAN,
  default_payment_plan_id UUID,  -- FK to payment_plans table
  forced_payment_plan_id UUID,   -- FK to payment_plans table
  metadata JSONB,
  is_active BOOLEAN,
  UNIQUE(tenant_id, product_type, product_id)
);
```

**Requires**: Separate `payment_plans` table with complex rule engine

---

#### Schema B: New System (20251124_restructure_products_pure_content.sql)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID,

  -- Product type & content
  type TEXT,  -- 9 types: program, course, lecture, workshop, webinar, session, session_pack, bundle, custom
  title TEXT,
  description TEXT,

  -- Content references (FOREIGN KEYS)
  program_id UUID REFERENCES programs(id),
  course_id UUID REFERENCES courses(id),
  contains_courses UUID[],  -- For bundles
  session_count INTEGER,    -- For session packs

  -- DocuSign
  requires_signature BOOLEAN,
  signature_template_id TEXT,

  -- Payment model
  payment_model TEXT,  -- one_time, deposit_then_plan, subscription, free
  price DECIMAL(10, 2),
  currency TEXT,
  payment_plan JSONB,  -- Self-contained inline config

  is_active BOOLEAN,
  metadata JSONB,

  UNIQUE (program_id),  -- One product per program
  UNIQUE (course_id)    -- One product per course
);
```

**Also Updates**:
- `programs` table: Removes `price`, `payment_plan`, `docusign_template_id`, `require_signature`, `crm_tag`; Adds `product_id` back-reference
- `courses` table: Removes `price`, `currency`, `payment_plan`, `installment_count`; Adds `product_id` back-reference
- `enrollments` table: Adds `product_id`, `total_amount`, `currency`, `payment_model`, `deposit_paid`, `deposit_amount`, `signature_required`, `signature_status`

**Benefits**:
- Pure content/billing separation
- No external payment_plans table needed
- Better referential integrity
- Supports more product types

---

### Type System Conflicts

**Issue**: [src/types/lms.ts](src/types/lms.ts) expects the NEW Product type:
```typescript
export interface Course {
  // ...
  product_id?: string | null;
  product?: import('./product').Product;  // References NEW type!
}

export interface Program {
  // ...
  product_id?: string | null;
  product?: import('./product').Product;  // References NEW type!
}
```

**This means**:
- The codebase already expects products with `program_id`, `course_id`, `payment_plan` JSONB
- The old `product_type` + `product_id` system is incompatible with LMS types

---

## Implementation Plan

### Phase 1: Database Schema Verification & Migration (Day 1)

**Goal**: Ensure the new schema (20251124) is applied

**Tasks**:

1. **Verify Current Schema**
   ```sql
   -- Check which columns exist in products table
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'products';

   -- Check if payment_plans table exists
   SELECT EXISTS (
     SELECT 1 FROM information_schema.tables
     WHERE table_name = 'payment_plans'
   );
   ```

2. **Apply Migration if Needed**
   - If old schema is in place: Run `20251124_restructure_products_pure_content.sql`
   - This will:
     - Drop old products table
     - Create new products table with foreign keys
     - Remove payment fields from programs/courses
     - Add product_id back-references to programs/courses

3. **Data Migration** (if any products exist in old format)
   - Create script to convert old products → new products
   - Map `product_type` + `product_id` → foreign key references
   - Convert external payment_plan references → inline JSONB

**Files to Create**:
- `supabase/migrations/verify_products_schema.sql` - Verification script
- `supabase/migrations/migrate_old_products_data.sql` - Data migration (if needed)

**Success Criteria**:
- Products table has `program_id`, `course_id` foreign keys
- Products table has `payment_plan` JSONB column
- Products table has `requires_signature`, `signature_template_id`, `keap_tag` columns
- Programs table has `product_id` column, no `price` or `payment_plan`
- Courses table has `product_id` column, no `price` or `payment_plan`

---

### Phase 2: Update UI to Use New Product System (Days 2-3)

**Goal**: Migrate existing admin UI from old system to new system

**Tasks**:

1. **Update Product Page** - [src/app/admin/payments/products/page.tsx](src/app/admin/payments/products/page.tsx)
   - Change import: `from '@/types/payments'` → `from '@/types/product'`
   - Update API calls: `/api/admin/payments/products` → `/api/admin/products`
   - Update form to include new fields:
     - Content selection (program_id, course_id, bundle, session_pack)
     - DocuSign configuration (requires_signature, signature_template_id)
     - Payment model selector (one_time, deposit_then_plan, subscription, free)
     - Keap tag input
   - Remove: `auto_assign_payment_plan`, `default_payment_plan_id`, `forced_payment_plan_id`

2. **Create Payment Plan Configurator Component**
   - File: [src/components/products/PaymentPlanConfig.tsx](src/components/products/PaymentPlanConfig.tsx)
   - Visual builder for `payment_plan` JSONB based on selected `payment_model`:
     - **One-time**: No config needed (empty object)
     - **Deposit + Plan**: Installments, frequency, deposit settings
     - **Subscription**: Interval, trial period
     - **Free**: No config needed (empty object)
   - Live pricing preview
   - Validation

3. **Create Content Selector Component**
   - File: [src/components/products/ContentSelector.tsx](src/components/products/ContentSelector.tsx)
   - Dropdown to select product type (program, course, lecture, workshop, etc.)
   - Dynamic content picker based on type:
     - If type = 'program': Program dropdown
     - If type = 'course': Course dropdown
     - If type = 'bundle': Multi-select courses
     - If type = 'session_pack': Number input for session count
   - Fetch content name and auto-populate product title

**Files to Modify**:
- [src/app/admin/payments/products/page.tsx](src/app/admin/payments/products/page.tsx:1-530) - Complete rewrite of form section

**Files to Create**:
- [src/components/products/PaymentPlanConfig.tsx](src/components/products/PaymentPlanConfig.tsx) - NEW
- [src/components/products/ContentSelector.tsx](src/components/products/ContentSelector.tsx) - NEW
- [src/components/products/DocuSignConfig.tsx](src/components/products/DocuSignConfig.tsx) - NEW

**Success Criteria**:
- Can create products with program/course foreign keys
- Can configure payment plans inline (deposit, installments, subscription)
- Can enable DocuSign requirement and set template ID
- Can set Keap tags
- Product form validates all fields properly

---

### Phase 3: Update Program/Course Pages - Add "Make Billable" Flow (Day 4)

**Goal**: Allow admins to create products directly from program/course management

**Tasks**:

1. **Update Programs Page** - [src/app/admin/lms/programs/page.tsx](src/app/admin/lms/programs/page.tsx)
   - Add "Make Billable" button for programs without a product
   - Show product badge/status for programs with a product
   - Quick product creation modal with:
     - Price input
     - Payment model selector
     - Payment plan config (using PaymentPlanConfig component)
     - DocuSign toggle
     - Keap tag input
   - On save: Create product with `program_id`, update program with `product_id` back-reference

2. **Update Courses Page** - [src/app/admin/lms/courses/page.tsx](src/app/admin/lms/courses/page.tsx)
   - Same updates as programs page
   - Only show "Make Billable" for standalone courses (`is_standalone = true`)

3. **Create Product Quick Form Component**
   - File: [src/components/products/QuickProductForm.tsx](src/components/products/QuickProductForm.tsx)
   - Simplified product creation for program/course context
   - Auto-fills:
     - `type` = 'program' or 'course'
     - `title` = program/course name
     - `description` = program/course description
     - `program_id` or `course_id` = selected content ID
   - User only inputs pricing and payment configuration

**Files to Modify**:
- [src/app/admin/lms/programs/page.tsx](src/app/admin/lms/programs/page.tsx)
- [src/app/admin/lms/courses/page.tsx](src/app/admin/lms/courses/page.tsx)

**Files to Create**:
- [src/components/products/QuickProductForm.tsx](src/components/products/QuickProductForm.tsx) - NEW

**Success Criteria**:
- Can create product from program page with one click
- Can create product from standalone course page
- Product is automatically linked to content (foreign keys set)
- Back-reference is set (program.product_id, course.product_id)

---

### Phase 4: Update Enrollment Service to Use New Products (Day 5)

**Goal**: Modify enrollment processing to work with inline payment_plan JSONB

**Tasks**:

1. **Update Enrollment Service** - [src/lib/payments/enrollmentService.ts](src/lib/payments/enrollmentService.ts)
   - Change product lookup to use new structure
   - Parse `payment_plan` JSONB instead of querying `payment_plans` table
   - Generate payment schedules based on inline config:
     - **One-time**: Single schedule entry with full price
     - **Deposit + Plan**: Deposit schedule + installment schedules
     - **Subscription**: Recurring schedules based on interval
     - **Free**: No schedules
   - Handle DocuSign:
     - If `product.requires_signature = true`, create DocuSign envelope
     - Update `enrollment.signature_status`
   - Handle Keap tags:
     - If `product.keap_tag` is set, add tag to contact in Keap

2. **Create Payment Plan Parser**
   - File: [src/lib/products/paymentPlanParser.ts](src/lib/products/paymentPlanParser.ts)
   - Functions:
     - `parsePaymentPlan(product: Product): ParsedPlan`
     - `calculateDepositAmount(product: Product): number`
     - `calculateInstallmentAmount(product: Product): number`
     - `generateScheduleDates(product: Product, startDate: Date): Date[]`

3. **Update Enrollment API**
   - [src/app/api/enrollments/route.ts](src/app/api/enrollments/route.ts)
   - Use new product structure
   - Test all payment models

**Files to Modify**:
- [src/lib/payments/enrollmentService.ts](src/lib/payments/enrollmentService.ts) - Major refactor

**Files to Create**:
- [src/lib/products/paymentPlanParser.ts](src/lib/products/paymentPlanParser.ts) - NEW

**Success Criteria**:
- Enrollment works for all payment models (one_time, deposit_then_plan, subscription, free)
- Payment schedules are correctly generated from JSONB config
- DocuSign envelopes are created when required
- Keap tags are applied to contacts

---

### Phase 5: Deprecate Old System (Day 6)

**Goal**: Remove old product code and routes

**Tasks**:

1. **Mark Old Files as Deprecated**
   - Add deprecation notices to:
     - [src/types/payments.ts](src/types/payments.ts) - Product interface
     - [src/lib/payments/productService.ts](src/lib/payments/productService.ts)
     - [src/app/api/admin/payments/products/route.ts](src/app/api/admin/payments/products/route.ts)

2. **Add Redirect to Old Routes**
   - Keep `/api/admin/payments/products` but return redirect to `/api/admin/products`
   - Add warning message in response

3. **Update Documentation**
   - Create product system guide: `docs/PRODUCT_SYSTEM_GUIDE.md`
   - Migration guide for developers: `docs/PRODUCT_MIGRATION_GUIDE.md`

**Files to Modify**:
- [src/types/payments.ts](src/types/payments.ts:18-37) - Add deprecation comments
- [src/lib/payments/productService.ts](src/lib/payments/productService.ts:1-294) - Add deprecation comments
- [src/app/api/admin/payments/products/route.ts](src/app/api/admin/payments/products/route.ts) - Add redirect

**Files to Create**:
- [docs/PRODUCT_SYSTEM_GUIDE.md](docs/PRODUCT_SYSTEM_GUIDE.md) - NEW
- [docs/PRODUCT_MIGRATION_GUIDE.md](docs/PRODUCT_MIGRATION_GUIDE.md) - NEW

**Success Criteria**:
- Old routes return deprecation warnings
- Documentation is complete
- All code uses new Product type from [src/types/product.ts](src/types/product.ts)

---

### Phase 6: Testing (Day 7)

**Goal**: Comprehensive testing of product bridge system

**Test Scenarios**:

1. **Product CRUD**
   - Create program product
   - Create course product
   - Create bundle product
   - Create session pack product
   - Update product pricing
   - Update payment plan configuration
   - Deactivate product
   - Delete product (with no enrollments)

2. **Enrollment Flows**
   - **One-time payment**: Enroll in product with one-time payment
   - **Deposit + Plan**: Enroll with deposit, generate installment schedules
   - **Subscription**: Enroll with recurring subscription
   - **Free**: Enroll in free product
   - **DocuSign**: Enroll in product requiring signature, verify envelope creation
   - **Keap**: Enroll and verify tag application

3. **Content Integration**
   - Create program → Make billable → Verify product created
   - Create standalone course → Make billable → Verify product created
   - Verify program.product_id back-reference is set
   - Verify course.product_id back-reference is set

4. **Payment Schedule Generation**
   - Test monthly installments
   - Test custom frequency installments
   - Test percentage deposit vs fixed deposit
   - Test subscription intervals (weekly, monthly, quarterly, annually)

**Success Criteria**:
- All test scenarios pass
- No TypeScript errors
- No runtime errors in enrollment flow
- Payment schedules match expectations
- DocuSign integration works
- Keap integration works

---

## Technical Architecture

### Database Schema (Final State)

```sql
-- Products table (billing bridge)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),

  -- Content type & reference
  type TEXT,  -- program, course, bundle, session_pack, etc.
  title TEXT,
  description TEXT,
  program_id UUID REFERENCES programs(id),      -- FK to content
  course_id UUID REFERENCES courses(id),        -- FK to content
  contains_courses UUID[],                      -- For bundles
  session_count INTEGER,                        -- For session packs

  -- Billing configuration
  payment_model TEXT,  -- one_time, deposit_then_plan, subscription, free
  price DECIMAL(10, 2),
  currency TEXT,
  payment_plan JSONB,  -- Inline payment configuration

  -- Integration flags
  requires_signature BOOLEAN,
  signature_template_id TEXT,
  keap_tag TEXT,

  is_active BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE (program_id),
  UNIQUE (course_id)
);

-- Programs table (pure content)
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  product_id UUID REFERENCES products(id),  -- Back-reference
  -- NO price, payment_plan, docusign_template_id, etc.
);

-- Courses table (pure content)
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  is_standalone BOOLEAN,
  product_id UUID REFERENCES products(id),  -- Back-reference
  -- NO price, payment_plan, etc.
);

-- Enrollments (with product reference)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,
  program_id UUID REFERENCES programs(id),
  product_id UUID REFERENCES products(id),  -- Product used for enrollment

  -- Payment tracking (copied from product at enrollment time)
  total_amount DECIMAL(10, 2),
  currency TEXT,
  payment_model TEXT,
  deposit_paid BOOLEAN,
  deposit_amount DECIMAL(10, 2),

  -- Signature tracking
  signature_required BOOLEAN,
  signature_status TEXT,  -- pending, sent, completed, declined, expired

  payment_status TEXT,
  created_at TIMESTAMPTZ
);

-- Payment Schedules (generated from product.payment_plan)
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  enrollment_id UUID REFERENCES enrollments(id),
  due_date DATE,
  amount DECIMAL(10, 2),
  status TEXT,
  payment_number INTEGER
);
```

### Type System (Final State)

**Single Source of Truth**: [src/types/product.ts](src/types/product.ts)

```typescript
export interface Product {
  // Core
  id: string;
  tenant_id: string;

  // Type & content
  type: ProductType;
  title: string;
  description?: string;
  program_id?: string;         // FK to programs
  course_id?: string;          // FK to courses
  contains_courses?: string[]; // For bundles
  session_count?: number;      // For session packs

  // Billing
  payment_model: PaymentModel;
  price?: number;
  currency?: string;
  payment_plan: PaymentPlanConfig;  // JSONB

  // Integrations
  requires_signature: boolean;
  signature_template_id?: string;
  keap_tag?: string | null;

  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

---

## File Structure

```
src/
├── types/
│   ├── product.ts              ✅ Canonical product type (KEEP)
│   ├── payments.ts             ⚠️  Deprecated Product type (MARK DEPRECATED)
│   └── lms.ts                  ✅ Uses new Product type
│
├── lib/
│   ├── products/               📁 NEW DIRECTORY
│   │   ├── productService.ts      ✅ NEW - CRUD for new products
│   │   ├── paymentPlanParser.ts   ✅ NEW - Parse JSONB payment_plan
│   │   └── validators.ts          ✅ NEW - Product validation
│   │
│   └── payments/
│       ├── productService.ts   ⚠️  DEPRECATE - Old product service
│       ├── enrollmentService.ts   🔄 UPDATE - Use new products
│       └── stripeService.ts    ✅ (Keep, may need minor updates)
│
├── components/
│   └── products/               📁 NEW DIRECTORY
│       ├── PaymentPlanConfig.tsx  ✅ NEW - Payment plan builder
│       ├── ContentSelector.tsx    ✅ NEW - Content type selector
│       ├── DocuSignConfig.tsx     ✅ NEW - Signature configuration
│       ├── QuickProductForm.tsx   ✅ NEW - Quick product creation
│       └── ProductForm.tsx        ✅ NEW - Full product form
│
├── app/
│   ├── admin/
│   │   ├── payments/
│   │   │   └── products/
│   │   │       └── page.tsx    🔄 UPDATE - Use new system
│   │   │
│   │   └── lms/
│   │       ├── programs/
│   │       │   └── page.tsx    🔄 UPDATE - Add "Make Billable"
│   │       └── courses/
│   │           └── page.tsx    🔄 UPDATE - Add "Make Billable"
│   │
│   └── api/
│       └── admin/
│           ├── products/
│           │   ├── route.ts    ✅ KEEP - New system API
│           │   └── [id]/route.ts  ✅ KEEP
│           │
│           └── payments/
│               └── products/
│                   ├── route.ts    ⚠️  DEPRECATE - Redirect to new
│                   └── [id]/route.ts  ⚠️  DEPRECATE
│
└── supabase/
    └── migrations/
        ├── 20251124_restructure_products_pure_content.sql  ✅ APPLY
        ├── verify_products_schema.sql      ✅ NEW
        └── migrate_old_products_data.sql   ✅ NEW (if needed)
```

---

## Success Criteria

### Technical
- ✅ Single Product type across entire codebase ([src/types/product.ts](src/types/product.ts))
- ✅ Products table uses foreign keys (program_id, course_id)
- ✅ Payment configuration is inline JSONB (no external payment_plans table)
- ✅ No TypeScript type errors
- ✅ All enrollment flows work with new products

### Functional
- ✅ Can create products from admin products page
- ✅ Can create products from program/course pages ("Make Billable" button)
- ✅ Can configure all payment models (one_time, deposit_then_plan, subscription, free)
- ✅ Can set DocuSign requirements and template IDs
- ✅ Can set Keap tags
- ✅ Enrollment generates correct payment schedules
- ✅ DocuSign envelopes are created when required
- ✅ Keap tags are applied to contacts

### Business
- ✅ Product serves as complete bridge between content and billing
- ✅ Content tables (programs, courses) have no payment logic
- ✅ All payment/integration configuration is centralized in products
- ✅ Support for future product types (bundles, session packs, webinars)

---

## Risk Mitigation

### High Risk: Data Loss During Migration
**Mitigation**:
- Full database backup before migration
- Test migration on staging database first
- Keep old products table as backup (rename to `products_backup_20251124`)
- Implement rollback script

### High Risk: Breaking Existing Enrollments
**Mitigation**:
- Do not modify existing enrollment records
- Only apply new product structure to new enrollments
- Add `product_id` to enrollments without breaking existing data
- Test enrollment flow extensively before production

### Medium Risk: Type Conflicts
**Mitigation**:
- Deprecate old Product type but keep it for 2 weeks
- Create type adapters for transition period
- Use feature flags to toggle between old/new systems during rollout

### Medium Risk: UI Complexity
**Mitigation**:
- Build payment plan configurator as standalone component
- Add extensive validation and error messages
- Provide real-time pricing preview
- Add tooltips and help text

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Schema Migration | 1 day | Database updated, data migrated |
| Phase 2: UI Update | 2 days | Product page updated, new components created |
| Phase 3: Content Integration | 1 day | "Make Billable" feature in programs/courses |
| Phase 4: Enrollment Service | 1 day | Enrollment works with new products |
| Phase 5: Deprecation | 1 day | Old system deprecated, docs updated |
| Phase 6: Testing | 1 day | All scenarios tested |
| **Total** | **7 days** | **Complete product bridge system** |

---

## Next Steps

1. **User Approval**: Get confirmation to proceed with new product system (20251124 schema)
2. **Schema Verification**: Check current database state
3. **Begin Phase 1**: Apply migration if needed
4. **Iterative Development**: Build components incrementally, test frequently
5. **Gradual Rollout**: Enable for beta users first, then all users

---

## Open Questions

1. **Which schema is currently applied to the database?** Need to run verification query.
2. **Are there existing products in the old format?** If yes, we need data migration.
3. **Are there existing enrollments with products?** If yes, need to ensure no disruption.
4. **DocuSign templates**: Do we have existing DocuSign template IDs to test with?
5. **Keap tags**: What are the valid Keap tag names/IDs for testing?

---

## Appendix: Payment Plan JSONB Examples

### One-Time Payment
```json
{}
```

### Deposit + Monthly Installments (20% deposit, 12 months)
```json
{
  "installments": 12,
  "frequency": "monthly",
  "deposit_type": "percentage",
  "deposit_percentage": 20,
  "start_delay_days": 30
}
```

### Deposit + Custom Installments (Fixed $500 deposit, 6 bi-weekly payments)
```json
{
  "installments": 6,
  "frequency": "custom",
  "custom_frequency_days": 14,
  "deposit_type": "fixed",
  "deposit_amount": 500
}
```

### Monthly Subscription with 7-day Trial
```json
{
  "subscription_interval": "monthly",
  "trial_days": 7
}
```

### Free Product
```json
{}
```
