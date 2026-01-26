# Payment System Requirements Verification

## Source Requirements (from your message)

### PART 1: AUTOMATIC RECURRING PAYMENT ENGINE

#### Core Architecture
- [ ] **Option A: Stripe Invoices (RECOMMENDED)**
  - Create invoices in Stripe for each payment schedule
  - Set collection_method: 'charge_automatically'
  - Stripe automatically charges on due date
  - Webhooks notify of success/failure

- [ ] **Hybrid Approach**: Use Stripe Invoices with cron fallback

#### PHASE 1: Core Auto-Payment Infrastructure

**Step 1.1: Create Stripe Invoice Service**
- [ ] File: `src/lib/payments/invoiceService.ts`
- [ ] Function: `createScheduledInvoice(scheduleId, tenantId)`
  - [ ] Get schedule details with enrollment/user info
  - [ ] Ensure user has Stripe customer ID (create if missing)
  - [ ] Calculate due date timestamp
  - [ ] Create invoice item
  - [ ] Create invoice with auto-charge
  - [ ] Store invoice ID in schedule
- [ ] Function: `createUpcomingInvoices(daysAhead: number)`
  - [ ] Batch create invoices for schedules due within N days
  - [ ] Rate limiting (100 requests/sec for Stripe)
  - [ ] Return success/failure stats

**Database Changes:**
- [ ] Add `stripe_invoice_id` column to `payment_schedules` table
- [ ] Create index on `stripe_invoice_id`
- [ ] Create index on `next_retry_date` for failed status

**Step 1.2: Create Cron Job for Invoice Generation**
- [ ] File: `src/app/api/cron/create-payment-invoices/route.ts`
- [ ] Verify cron secret authorization
- [ ] Call `createUpcomingInvoices(30)` for next 30 days
- [ ] Return stats: created, failed, errors
- [ ] Schedule: Daily at 3 AM (`0 3 * * *`)

**Step 1.3: Enhance Stripe Webhook for Invoice Events**
- [ ] File: `src/app/api/webhooks/stripe/route.ts`
- [ ] Handler: `invoice.payment_succeeded`
  - [ ] Extract schedule_id from metadata
  - [ ] Update schedule status to 'paid'
  - [ ] Set paid_date
  - [ ] Reset retry_count
  - [ ] Clear last_error
  - [ ] Update enrollment paid_amount
  - [ ] Create payment record
  - [ ] Send success notification email
- [ ] Handler: `invoice.payment_failed`
  - [ ] Extract schedule_id from metadata
  - [ ] Increment retry_count
  - [ ] Calculate next_retry_date with exponential backoff:
    - Retry 1: +1 day
    - Retry 2: +3 days
    - Retry 3: +7 days
    - After 3: null (no more auto-retries)
  - [ ] Store last_error
  - [ ] Update schedule status to 'failed'
  - [ ] Send failure notification email
- [ ] Handler: `invoice.finalized`
  - [ ] Log that invoice is ready for payment

**Step 1.4: Modify Enrollment Service to Create Invoices**
- [ ] File: `src/lib/payments/enrollmentService.ts`
- [ ] After creating payment schedules
- [ ] Filter future schedules (not immediate payment)
- [ ] Create invoices for each future schedule

#### PHASE 2: Payment Retry & Recovery System

**Step 2.1: Automatic Retry Cron Job**
- [ ] File: `src/app/api/cron/retry-failed-payments/route.ts`
- [ ] Find schedules with:
  - status = 'failed'
  - next_retry_date <= now
  - retry_count < 3
- [ ] Create new invoice for each (old one failed)
- [ ] Return retry stats
- [ ] Schedule: Every 6 hours (`0 */6 * * *`)

#### PHASE 3: User-Side Enhancements

**Step 3.1: Payment Method Management**
- [ ] (Already planned in Issue #5)

**Step 3.2: Manual Payment Re-initiation**
- [ ] File: `src/app/api/user/payments/retry/route.ts`
- [ ] Verify schedule belongs to user
- [ ] Check status is 'failed' or 'pending'
- [ ] Create payment intent for manual retry
- [ ] Return client_secret

#### PHASE 4: Admin-Side Enhancements

**Step 4.1: Admin Payment Dashboard Improvements**
- [ ] File: `src/app/admin/payments/schedules/page.tsx`
- [ ] Bulk Actions:
  - [ ] Select multiple schedules
  - [ ] Bulk retry failed payments
  - [ ] Bulk adjust dates
  - [ ] Bulk mark as paid
- [ ] Real-time Status Indicators:
  - [ ] Show invoices created/pending
  - [ ] Show retry attempts remaining
  - [ ] Show next retry date
- [ ] Quick Actions:
  - [ ] "Retry Now" button for failed
  - [ ] "Create Invoice" for pending without invoice
  - [ ] "Cancel Schedule" for unwanted charges

**Step 4.2: Admin Manual Charge Initiation**
- [ ] File: `src/app/api/admin/payments/schedules/[id]/charge-now/route.ts`
- [ ] Verify admin role
- [ ] Create invoice immediately (ignore scheduled_date)
- [ ] Return invoice_id

**Step 4.3: Admin Reporting Enhancements**
- [ ] Failed Payment Report
- [ ] Upcoming Payments Report (30-day forecast)
- [ ] Retry Status Report
- [ ] Invoice Status Report

---

### ISSUE #1: Cascade Payment Schedule Adjustment

**Problem:** Payment #3 paid 10 days late, but schedules 4-12 remain on original dates

**Solution:**
- [ ] File: `src/lib/payments/scheduleManager.ts`
- [ ] Function: `cascadeScheduleAdjustment(enrollmentId, paidScheduleId, delayDays, tenantId)`
  - [ ] Get paid schedule details
  - [ ] Find all future unpaid schedules
  - [ ] Calculate new dates (original + delay)
  - [ ] Update scheduled_date
  - [ ] Set status to 'adjusted'
  - [ ] Add record to adjustment_history JSONB
  - [ ] Keep original_due_date unchanged
  - [ ] Return count of adjusted schedules

**Integration:**
- [ ] File: `src/app/api/webhooks/stripe/route.ts`
- [ ] After marking schedule as paid
- [ ] Calculate delay: paid_date - original_due_date
- [ ] If delay > 1 day AND < 90 days AND config enabled:
  - [ ] Call cascadeScheduleAdjustment()

**Configuration:**
- [ ] File: `src/lib/payments/config.ts`
- [ ] `enableCascadeAdjustment` (default true)
- [ ] `minimumDelayForCascade` (default 1 day)
- [ ] `maximumDelayForCascade` (default 90 days)

---

### ISSUE #2: Payment-Based Course Access Blocking

**Problem:** Users can access courses even with overdue payments

**Solution:**

**Step 1: Create Access Control Helper**
- [ ] File: `src/lib/payments/accessControl.ts`
- [ ] Function: `checkCourseAccess(userId, courseId, tenantId)`
  - [ ] Get enrollment with payment_schedules
  - [ ] Check enrollment status (active/completed)
  - [ ] Define GRACE_PERIOD_DAYS = 7
  - [ ] Find overdue schedules (due_date + grace > now)
  - [ ] Return: hasAccess, reason, overdueAmount, overdueDays, gracePeriodEnd
- [ ] Function: `requireCourseAccess(userId, courseId, tenantId)`
  - [ ] Call checkCourseAccess()
  - [ ] Return 402 Payment Required if blocked
  - [ ] Return 403 Forbidden if inactive
  - [ ] Return null if access granted

**Step 2: Apply to Course Access Endpoints**
- [ ] File: `src/app/api/user/courses/[id]/route.ts`
  - [ ] Add requireCourseAccess() check before query
- [ ] File: `src/app/api/user/courses/route.ts`
  - [ ] Filter courses by access in list view
- [ ] File: `src/app/api/user/courses/[id]/lessons/route.ts`
  - [ ] Add access check
- [ ] File: `src/app/api/user/courses/[id]/assignments/route.ts`
  - [ ] Add access check
- [ ] File: `src/app/api/user/courses/[id]/exams/route.ts`
  - [ ] Add access check

**Step 3: Add Frontend Access Messaging**
- [ ] File: `src/components/user/CourseAccessBlocked.tsx`
- [ ] Display:
  - [ ] Alert icon + "Course Access Restricted" title
  - [ ] "Payment is X days overdue" message
  - [ ] Outstanding amount
  - [ ] Days overdue
  - [ ] "Make Payment" button → /payments/{enrollmentId}

**Step 4: Add Cron Job for Automatic Suspension**
- [ ] File: `src/app/api/cron/check-overdue-payments/route.ts`
- [ ] Find schedules overdue > 7 days
- [ ] Update enrollment status to 'suspended'
- [ ] Set suspended_reason = 'payment_overdue'
- [ ] Send notification emails
- [ ] Schedule: Daily at 2 AM (`0 2 * * *`)

---

### ISSUE #3: User Payment History Filters

**Problem:** User payment views have no filtering (admin has filters, users don't)

**Solution:**

**Step 1: Add Filter Component**
- [ ] File: `src/components/user/payments/PaymentFilters.tsx`
- [ ] Filters:
  - [ ] Status dropdown (all, pending, paid, partial, overdue, failed)
  - [ ] Search input (product/course name)
  - [ ] Date From picker
  - [ ] Date To picker
  - [ ] Quick toggles: "Overdue Only", "Failed Only"
- [ ] Reset filters button
- [ ] onChange handler to update parent state

**Step 2: Integrate Filters into Payments Page**
- [ ] File: `src/app/(user)/payments/page.tsx`
- [ ] Add filter state management
- [ ] Pass filters to PaymentFilters component
- [ ] Apply filters to enrollment/schedule queries:
  - [ ] Filter by status
  - [ ] Filter by date range
  - [ ] Search in product_name
  - [ ] Show overdue only
  - [ ] Show failed only
- [ ] Update counts and summaries based on filtered data

**Step 3: Enhance API Endpoints**
- [ ] File: `src/app/api/user/payments/route.ts` (or similar)
- [ ] Accept query params: status, search, dateFrom, dateTo
- [ ] Apply filters in Supabase query
- [ ] Return filtered results

---

## Summary Files Matrix

### New Files to Create
| File | Phase | Description |
|------|-------|-------------|
| `src/lib/payments/invoiceService.ts` | 1 | Stripe invoice creation & batch processing |
| `src/lib/payments/config.ts` | 1 | Payment system configuration |
| `src/app/api/cron/create-payment-invoices/route.ts` | 1 | Daily invoice generation cron |
| `src/app/api/cron/retry-failed-payments/route.ts` | 2 | Retry cron (every 6 hours) |
| `src/app/api/user/payments/retry/route.ts` | 3 | User manual retry endpoint |
| `src/app/api/admin/payments/schedules/[id]/charge-now/route.ts` | 4 | Admin manual charge |
| `src/lib/payments/accessControl.ts` | Issue 2 | Course access control logic |
| `src/components/user/CourseAccessBlocked.tsx` | Issue 2 | Blocked access UI |
| `src/app/api/cron/check-overdue-payments/route.ts` | Issue 2 | Auto-suspension cron |
| `src/components/user/payments/PaymentFilters.tsx` | Issue 3 | User filter component |
| `src/components/user/payments/UpdateCardDialog.tsx` | 3 | Update payment method |
| `src/components/user/payments/RetryPaymentDialog.tsx` | 3 | Retry confirmation |
| `src/components/admin/payments/ChargeNowDialog.tsx` | 4 | Admin charge confirmation |
| `src/components/admin/payments/BulkRetryDialog.tsx` | 4 | Admin bulk retry UI |

### Files to Modify
| File | Changes |
|------|---------|
| `src/lib/payments/enrollmentService.ts` | Create invoices after schedules |
| `src/app/api/webhooks/stripe/route.ts` | Add invoice handlers + cascade logic |
| `src/lib/payments/scheduleManager.ts` | Add cascadeScheduleAdjustment() |
| `src/app/admin/payments/schedules/page.tsx` | Bulk actions + status indicators |
| `src/app/(user)/payments/page.tsx` | Add "My Payments" tab + filters |
| `src/app/api/user/courses/[id]/route.ts` | Add access control |
| `src/app/api/user/courses/route.ts` | Filter by access |
| `src/app/api/user/courses/[id]/lessons/route.ts` | Add access check |
| `src/app/api/user/courses/[id]/assignments/route.ts` | Add access check |
| `src/app/api/user/courses/[id]/exams/route.ts` | Add access check |
| `vercel.json` | Add 4 cron schedules |

### Database Migrations
- [ ] Already exists: `stripe_invoice_id` column in payment_schedules (verified line 123)
- [ ] Create index: `idx_payment_schedules_invoice`
- [ ] Create index: `idx_payment_schedules_retry` (for failed status)

### Testing Requirements
| Test | Description |
|------|-------------|
| Test 1 | Enrollment creates invoices for future installments |
| Test 2 | Invoice auto-charges on due date (Stripe test clock) |
| Test 3 | Failed payment triggers retry with exponential backoff |
| Test 4 | Late payment triggers cascade adjustment |
| Test 5 | Admin manual charge creates immediate invoice |
| Test 6 | User manual retry creates payment intent |
| Test 7 | Course access blocked after grace period |
| Test 8 | Overdue cron suspends enrollments |
| Test 9 | User filters work correctly |

---

## Verification Checklist

### Critical Questions to Confirm:

1. **Stripe Invoice Strategy**
   - ✅ Use Stripe Invoices with `collection_method: 'charge_automatically'`
   - ✅ Create invoices 30 days ahead via daily cron
   - ✅ Stripe handles the actual charging on due_date

2. **Retry Logic**
   - ✅ Exponential backoff: 1, 3, 7 days
   - ✅ Max 3 automatic retries
   - ✅ Cron runs every 6 hours to process retries
   - ✅ Users can manually retry anytime

3. **Cascade Adjustment**
   - ✅ Triggers on late payment (delay > 1 day)
   - ✅ Shifts all future schedules by delay amount
   - ✅ Configurable via PAYMENT_CONFIG
   - ✅ Records in adjustment_history

4. **Course Access Control**
   - ✅ 7-day grace period after due date
   - ✅ Block all course content (lessons, assignments, exams)
   - ✅ Show "Payment Required" message
   - ✅ Auto-suspend after grace period
   - ✅ Restore immediately after payment

5. **User Features**
   - ✅ Filter payments by status/date/search
   - ✅ Retry failed payments
   - ✅ Update payment method
   - ✅ View all schedules in "My Payments" tab

6. **Admin Features**
   - ✅ Bulk retry failed payments
   - ✅ Manual charge now
   - ✅ Invoice status visibility
   - ✅ Enhanced reporting

---

## Missing or Unclear Items (NEED CONFIRMATION)

❓ **Question 1:** Should we also create invoices for the FIRST payment (deposit), or only future installments?
   - Your code shows: "filter future schedules (not the immediate one)"
   - Assumption: First payment uses payment intent, rest use invoices

❓ **Question 2:** Payment method update - do you want:
   - Option A: Update default payment method in Stripe customer
   - Option B: Create new payment method and set as default
   - Option C: Both options available to user

❓ **Question 3:** Email notifications mentioned in several places:
   - Payment success email
   - Payment failure email
   - Overdue suspension email
   - Should I implement these using the existing trigger engine?

❓ **Question 4:** "My Payments" tab on user payments page:
   - Should this replace one of the existing tabs or be a 3rd tab?
   - Existing tabs: "My Enrollments", "Upcoming Payments"

❓ **Question 5:** Admin reporting - should I create new report components or add tabs to existing reports page?

---

## Implementation Order (Recommended)

**Critical Path (Must Do First):**
1. ✅ Database: Verify stripe_invoice_id exists (already done)
2. Create `invoiceService.ts` (foundation)
3. Create `config.ts` (configuration)
4. Add invoice webhook handlers
5. Modify `enrollmentService.ts` to create invoices
6. Create invoice generation cron job
7. Create retry cron job
8. Update `vercel.json`

**Issue Fixes (After Core Works):**
9. Add cascade adjustment to `scheduleManager.ts`
10. Integrate cascade into webhook
11. Create `accessControl.ts`
12. Add access checks to course endpoints
13. Create `CourseAccessBlocked` component
14. Create overdue suspension cron

**UI Enhancements (Final Polish):**
15. Create user payment filters
16. Add "My Payments" tab
17. Create retry/update card dialogs
18. Enhance admin schedules page
19. Create admin charge now endpoint
20. Add admin bulk actions

---

## Ready to Proceed?

Please review this verification document and confirm:

✅ **All requirements captured correctly**
✅ **Any missing/unclear items answered**
✅ **Implementation order makes sense**
✅ **Ready to start with Phase 1**

Once confirmed, I'll begin systematic implementation starting with `invoiceService.ts`.
