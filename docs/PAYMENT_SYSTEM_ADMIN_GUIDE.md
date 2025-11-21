# Payment System Admin Guide

## Table of Contents

- [Overview](#overview)
- [Dashboard](#dashboard)
- [Managing Payment Plans](#managing-payment-plans)
- [Managing Schedules](#managing-schedules)
- [Handling Exceptions](#handling-exceptions)
- [User Management](#user-management)
- [Reporting](#reporting)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

This guide provides administrators with comprehensive instructions for managing the payment system, including creating payment plans, managing payment schedules, handling exceptions, and running reports.

### Admin Access

Navigate to: **Admin Panel → Payments**

Required permissions: `admin` or `finance_admin` role

## Dashboard

### Payment Dashboard Overview

The main payment dashboard (`/admin/payments/dashboard`) provides:

**Top Metrics**:
- Total Revenue (current month)
- Active Enrollments
- Pending Payments
- Overdue Payments
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)

**Charts**:
- Revenue trend (line chart)
- Payment status distribution (pie chart)
- Cash flow forecast (area chart)
- Product performance (bar chart)

**Quick Actions**:
- View overdue payments
- Process pending actions
- Run reconciliation
- Export reports

### Accessing the Dashboard

1. Log in as admin
2. Navigate to **Admin Panel → Payments → Dashboard**
3. Use date range selector to adjust reporting period
4. Click metric cards for detailed breakdown
5. Hover charts for interactive data points

## Managing Payment Plans

### Creating a Payment Plan

**Path**: Admin Panel → Payments → Payment Plans → Create New

#### One-Time Payment Plan

1. Click **Create Payment Plan**
2. Enter plan details:
   - **Plan Name**: "Full Payment"
   - **Plan Type**: One-Time
   - **Description**: "Pay full amount upfront"
3. Configure auto-detection rules (optional):
   - Add rule: Price Range → Less than 500
   - Add rule: Product Type → In [lecture, workshop]
4. Set priority: 5
5. Mark as active
6. Click **Save**

#### Deposit Payment Plan

1. Click **Create Payment Plan**
2. Enter plan details:
   - **Plan Name**: "30% Deposit + 6 Installments"
   - **Plan Type**: Deposit
   - **Description**: "Pay 30% now, rest over 6 months"
3. Configure deposit:
   - **Deposit Type**: Percentage
   - **Deposit Percentage**: 30%
4. Configure installments:
   - **Installment Count**: 6
   - **Frequency**: Monthly
5. Configure auto-detection rules:
   - Add rule: Price Range → Between 2000 and 10000
   - Add rule: Product Type → In [program, course]
6. Set priority: 10 (higher priority = evaluated first)
7. Mark as active
8. Click **Save**

#### Installment Payment Plan

1. Click **Create Payment Plan**
2. Enter plan details:
   - **Plan Name**: "12 Monthly Installments"
   - **Plan Type**: Installments
   - **Description**: "Spread cost over 12 months"
3. Configure installments:
   - **Installment Count**: 12
   - **Frequency**: Monthly
4. Configure auto-detection rules:
   - Add rule: Price Range → Greater than 10000
   - Add rule: Product Type → In [program]
5. Set priority: 15
6. Mark as active
7. Click **Save**

#### Subscription Payment Plan

1. Click **Create Payment Plan**
2. Enter plan details:
   - **Plan Name**: "Monthly Subscription"
   - **Plan Type**: Subscription
   - **Description**: "Recurring monthly access"
3. Configure subscription:
   - **Billing Frequency**: Monthly
   - **Trial Days**: 7 (optional)
4. Configure auto-detection rules:
   - Add rule: Product Metadata → Field "subscription_enabled" equals true
5. Set priority: 20
6. Mark as active
7. Click **Save**

### Auto-Detection Rule Builder

#### Available Rule Types

1. **Price Range**:
   - Operator: Between / Greater Than / Less Than
   - Example: `price between $1000 and $5000`

2. **Product Type**:
   - Operator: In / Not In
   - Example: `product_type in [program, course]`

3. **Product Metadata**:
   - Operator: Equals / Contains / Regex
   - Example: `metadata.category equals "professional-development"`

4. **User Segment**:
   - Operator: In / Not In
   - Example: `user_role in [students, parents]`

#### Rule Priority

Plans are evaluated in **priority order (highest first)**. The first plan where **all rules match** is selected.

**Example Priority Strategy**:
- Priority 20: Very specific rules (subscription plans)
- Priority 15: High-value plans (12 installments for expensive programs)
- Priority 10: Medium plans (deposit + installments)
- Priority 5: Low-value plans (one-time for cheap courses)
- Priority 1: Default fallback plan

### Testing Payment Plans

Before activating a plan, test auto-detection:

1. Navigate to **Payment Plans → Test Detection**
2. Select a product
3. Optionally select a user (for user-specific rules)
4. Click **Test Detection**
5. Review results:
   - Which plan was detected
   - Which rules matched/failed
   - Detection method (forced/auto/default)

### Editing Payment Plans

**Important**: Editing a plan only affects **new enrollments**. Existing enrollments continue with their original plan.

1. Navigate to **Payment Plans**
2. Click plan name to view details
3. Click **Edit**
4. Modify fields
5. Click **Save Changes**

**Warning**: Changing priority or rules may affect which plans are auto-assigned to new products.

### Deleting Payment Plans

**Cannot delete** plans with active enrollments.

1. Navigate to **Payment Plans**
2. Click plan name
3. Check "Usage Count" - must be 0
4. Click **Delete**
5. Confirm deletion

To remove a plan with active enrollments:
1. Mark plan as inactive
2. Wait for all enrollments to complete
3. Then delete

## Managing Schedules

### Schedule Control Center

**Path**: Admin Panel → Payments → Schedules

View and manage all payment schedules across all enrollments.

#### Filters

- **Status**: Pending / Paid / Overdue / Paused / Failed
- **Date Range**: From / To dates
- **Product**: Filter by product name
- **User**: Search by user name/email
- **Overdue Only**: Show only overdue payments

#### Schedule Table Columns

- User Name
- Product Name
- Payment #
- Amount
- Original Due Date
- Scheduled Date (admin-adjustable)
- Status
- Actions

### Adjusting Individual Payment Dates

**Scenario**: User requests payment extension

1. Navigate to **Schedules**
2. Find the payment schedule
3. Click **Actions → Adjust Date**
4. Enter new date
5. Enter reason: "User requested extension due to medical leave"
6. Click **Adjust**

**Result**:
- Payment scheduled date updated
- Adjustment logged in history
- User notified of change
- Stripe invoice rescheduled

**Important**: Cannot adjust payments that are already processing or paid.

### Adjusting All Payments for an Enrollment

**Scenario**: User needs all remaining payments delayed by 30 days

1. Navigate to **Schedules**
2. Filter by user or enrollment
3. Select all pending/future payments (checkboxes)
4. Click **Bulk Actions → Delay Payments**
5. Enter days to delay: 30
6. Enter reason: "User financial hardship"
7. Click **Apply**

**Result**: All selected payments moved forward 30 days

### Pausing Enrollment Payments

**Scenario**: User on medical leave, pause all payments for 3 months

1. Navigate to **Schedules**
2. Find enrollment or search user
3. Click **Actions → Pause Payments**
4. Enter reason: "Medical leave - 3 months"
5. Click **Pause**

**Result**:
- All future payments marked as "paused"
- No charges will process
- User notified
- Stripe subscriptions paused

**To Resume**:
1. Find paused enrollment
2. Click **Actions → Resume Payments**
3. Optionally set new start date
4. Click **Resume**

**Result**:
- Payments rescheduled from resume date
- User notified
- Stripe subscriptions resumed

### Setting Custom Payment Start Date

**Scenario**: User paid deposit today, but wants installments to start on first of next month

1. Navigate to enrollment details
2. Click **Payment Settings → Set Start Date**
3. Choose date: First of next month
4. Click **Set Start Date**

**Result**:
- All installment schedules regenerated from new start date
- Deposit remains on original schedule
- User sees updated payment calendar

### Handling Failed Payments

When a payment fails, the system automatically:
1. Marks schedule as "failed"
2. Logs error reason
3. Schedules automatic retry (if configured)
4. Sends notification to user

**Admin Actions**:

#### Retry Immediately
1. Navigate to **Schedules**
2. Filter status: Failed
3. Find payment
4. Click **Actions → Retry Payment**
5. Confirm retry

#### Update Payment Method
1. Ask user to update payment method in their account
2. Once updated, retry payment

#### Manual Resolution
1. Click **Actions → Mark as Paid** (if paid outside system)
2. Enter payment reference
3. Enter reason
4. Click **Confirm**

### Cancelling Scheduled Payments

**Scenario**: User wants to cancel remaining installments and pay balance

1. Find enrollment in schedules
2. Select all pending payments
3. Click **Bulk Actions → Cancel Payments**
4. Enter reason
5. Create new one-time payment for remaining balance
6. Click **Confirm**

## Handling Exceptions

### Refund Scenarios

#### Full Refund

1. Navigate to **Payments → Transactions**
2. Find payment
3. Click **Actions → Refund**
4. Select: Full Refund
5. Enter reason
6. Click **Process Refund**

**Result**:
- Stripe refund processed
- Payment status: "refunded"
- Enrollment status updated
- User access revoked (if configured)

#### Partial Refund

1. Find payment
2. Click **Actions → Refund**
3. Select: Partial Refund
4. Enter amount to refund
5. Enter reason
6. Click **Process Refund**

**Result**:
- Partial Stripe refund processed
- Payment partially refunded
- Enrollment remains active

### Enrollment Cancellations

**Scenario**: User wants to cancel enrollment mid-payment

1. Navigate to enrollment
2. Click **Cancel Enrollment**
3. Choose refund policy:
   - No refund (keep paid amount)
   - Partial refund (pro-rata)
   - Full refund (return all payments)
4. Cancel remaining payments
5. Process refund if applicable
6. Click **Confirm Cancellation**

### Payment Disputes

**Scenario**: User disputed payment with bank

1. Stripe webhook notifies system
2. Navigate to **Payments → Disputes**
3. Find dispute
4. Review details and evidence
5. Upload evidence documents
6. Click **Submit Evidence to Stripe**
7. Wait for Stripe resolution
8. If lost: Payment status "disputed_lost"
9. If won: Payment status remains "succeeded"

### Manual Payment Entry

**Scenario**: User paid via bank transfer outside Stripe

1. Navigate to enrollment
2. Click **Payment Actions → Add Manual Payment**
3. Enter details:
   - Amount
   - Payment date
   - Payment method: Bank Transfer
   - Reference number
   - Notes
4. Click **Record Payment**

**Result**:
- Payment recorded in system
- Enrollment balance updated
- No Stripe processing

### Overpayment Handling

**Scenario**: User accidentally paid twice

1. Navigate to enrollment payments
2. Identify duplicate payment
3. Options:
   - **Refund**: Process refund via Stripe
   - **Credit**: Apply credit to future payments
   - **Transfer**: Apply to different enrollment
4. Choose action and confirm

## User Management

### Viewing User Payment History

1. Navigate to **Users**
2. Search user
3. Click user name
4. Select **Payment History** tab

**View**:
- All enrollments
- Payment schedules
- Completed payments
- Failed payments
- Refunds
- Total lifetime value

### User Payment Settings

1. Navigate to user
2. Click **Payment Settings** tab

**Actions**:
- View payment methods
- Update default payment method
- View Stripe customer ID
- Check payment eligibility
- View credit balance

### Payment Extensions

**Scenario**: User requests payment deadline extension

1. Find user enrollment
2. Navigate to schedule
3. Follow [Adjusting Payment Dates](#adjusting-individual-payment-dates)
4. Document reason
5. Notify user of new schedule

### Payment Plans for Specific Users

**Scenario**: VIP user gets special payment terms

1. Navigate to enrollment
2. Click **Override Payment Plan**
3. Create custom plan or select existing
4. Apply to enrollment
5. Regenerate schedules
6. Click **Apply Override**

## Reporting

See [PAYMENT_SYSTEM_REPORTS.md](./PAYMENT_SYSTEM_REPORTS.md) for detailed reporting documentation.

### Quick Report Access

**Revenue Dashboard**:
- Path: Admin → Payments → Reports → Revenue
- View total revenue, trends, MRR/ARR
- Export as CSV/Excel

**Payment Status Report**:
- Path: Admin → Payments → Reports → Status
- See breakdown of paid/pending/overdue
- Identify at-risk enrollments

**Cash Flow Forecast**:
- Path: Admin → Payments → Reports → Cash Flow
- View expected revenue by month
- Plan for seasonal variations

**Product Performance**:
- Path: Admin → Payments → Reports → Products
- Compare revenue by product
- Identify top performers

**User Analysis**:
- Path: Admin → Payments → Reports → Users
- View user payment patterns
- Identify high-value users

**Operational Report**:
- Path: Admin → Payments → Reports → Operational
- See pending admin actions
- Review recent adjustments
- Monitor system health

**Financial Reconciliation**:
- Path: Admin → Payments → Reports → Reconciliation
- Compare database vs Stripe
- Identify discrepancies

### Scheduling Reports

1. Navigate to any report
2. Click **Schedule Report**
3. Configure:
   - Frequency: Daily/Weekly/Monthly
   - Recipients: Email addresses
   - Format: CSV/Excel/PDF
4. Click **Create Schedule**

**Result**: Report automatically emailed on schedule

## Common Scenarios

### Scenario 1: User Wants Deposit + Installments

**User**: "Can I pay 20% now and spread the rest over 10 months?"

**Steps**:
1. Create new payment plan (if doesn't exist):
   - Type: Deposit
   - Deposit: 20% percentage
   - Installments: 10 monthly
2. Navigate to user enrollment
3. Click **Override Payment Plan**
4. Select new plan
5. Apply and regenerate schedule
6. User processes deposit payment
7. Installments automatically scheduled

### Scenario 2: User Missed Payment Due to Card Expiry

**Alert**: Payment failed - card declined

**Steps**:
1. System sends automatic reminder to user
2. User updates card in account settings
3. Admin navigates to failed payment
4. Click **Retry Payment**
5. Payment processes successfully
6. Schedule status updated to "paid"

### Scenario 3: User Requests 2-Month Payment Pause

**User**: "I need to pause payments for 2 months"

**Steps**:
1. Navigate to enrollment schedules
2. Click **Pause Payments**
3. Enter reason: "User requested 2-month pause"
4. Click **Pause**
5. Set calendar reminder for 2 months
6. After 2 months:
   - Navigate back to enrollment
   - Click **Resume Payments**
   - Set new start date
   - User payments resume

### Scenario 4: User Wants to Switch from Installments to Full Payment

**User**: "I want to pay off the balance now"

**Steps**:
1. Navigate to enrollment
2. View remaining balance
3. Cancel all pending installments
4. Create one-time payment for remaining amount
5. User processes payment
6. Enrollment marked as fully paid

### Scenario 5: Bulk Extension for All Students in Program

**Scenario**: Program delayed, extend all payment deadlines by 30 days

**Steps**:
1. Navigate to **Schedules**
2. Filter by product: Select program
3. Filter status: Pending
4. Select all (or use bulk select)
5. Click **Bulk Actions → Delay Payments**
6. Enter days: 30
7. Enter reason: "Program start date delayed"
8. Click **Apply**
9. All students notified automatically

### Scenario 6: Setting Up Subscription Product

**Product**: Monthly membership access

**Steps**:
1. Create payment plan:
   - Type: Subscription
   - Frequency: Monthly
   - Trial: 7 days
   - Set as default for product
2. Register product with subscription plan
3. User enrolls
4. User provides payment method
5. Subscription created in Stripe
6. After trial, automatic monthly billing begins

### Scenario 7: Handling Disputed Payment

**Alert**: Chargeback filed by user's bank

**Steps**:
1. Review dispute in **Payments → Disputes**
2. Gather evidence:
   - Enrollment records
   - Access logs
   - Communication history
3. Upload evidence in Stripe dashboard
4. Submit evidence
5. If lost: Consider suspending user access
6. If won: Payment reinstated

## Troubleshooting

### Payment Not Processing

**Symptoms**: Payment stuck in "processing" status

**Checks**:
1. Check Stripe dashboard for payment intent status
2. Review webhook logs
3. Check for Stripe API errors
4. Verify payment method is valid
5. Check user's Stripe customer record

**Solutions**:
- Retry payment processing
- Ask user to update payment method
- Contact Stripe support if API issue
- Manually mark as paid if completed outside system

### Auto-Detection Not Working

**Symptoms**: Wrong payment plan assigned to enrollment

**Checks**:
1. Navigate to **Payment Plans → Test Detection**
2. Test with the product
3. Review which rules matched/failed
4. Check plan priorities

**Solutions**:
- Adjust rule conditions
- Adjust plan priorities
- Set forced plan on product if needed
- Verify product metadata is correct

### Schedule Dates Not Updating

**Symptoms**: Adjusted dates not reflected in user view

**Checks**:
1. Check schedule adjustment history
2. Verify admin permissions
3. Check if payment already processing
4. Review system logs

**Solutions**:
- Cannot adjust payments in "processing" status
- Wait for payment to complete or fail
- Then adjust and retry

### Stripe Webhook Failures

**Symptoms**: Payments processing in Stripe but not reflected in database

**Checks**:
1. Check Stripe webhook dashboard
2. Review webhook endpoint logs
3. Verify webhook signature validation
4. Check endpoint URL is correct

**Solutions**:
- Resend failed webhooks from Stripe dashboard
- Verify webhook secret matches
- Check server firewall allows Stripe IPs
- Manually sync specific payments if needed

### Duplicate Payments

**Symptoms**: User charged twice for same payment

**Checks**:
1. Check payment_schedules for duplicates
2. Review Stripe payment intents
3. Check webhook logs for duplicate events

**Solutions**:
- Refund duplicate payment
- Add idempotency key checks
- Review webhook handling code

### Reports Showing Wrong Data

**Symptoms**: Report numbers don't match expectations

**Checks**:
1. Verify date range filters
2. Check materialized view refresh status
3. Compare with raw database queries
4. Review recent data changes

**Solutions**:
- Refresh materialized views
- Run reconciliation report
- Check for timezone issues
- Verify report query logic

## Best Practices

### Payment Plan Design

1. **Keep plans simple**: Fewer, clearer plans are better than many confusing options
2. **Test auto-detection**: Always test before activating
3. **Use meaningful priorities**: Space priorities (5, 10, 15, 20) to allow insertions
4. **Document special plans**: Add detailed descriptions for custom plans
5. **Review quarterly**: Analyze which plans are most popular

### Schedule Management

1. **Document all adjustments**: Always include clear reason
2. **Communicate changes**: Notify users of any schedule changes
3. **Be consistent**: Apply same policies across similar situations
4. **Track patterns**: If many users need extensions, consider policy change
5. **Automate where possible**: Use bulk operations for efficiency

### User Communication

1. **Set expectations**: Clearly communicate payment schedule at enrollment
2. **Send reminders**: Enable automatic payment reminders
3. **Be proactive**: Contact users before payments fail
4. **Be flexible**: Work with users on reasonable requests
5. **Document interactions**: Keep notes on payment-related communications

### Financial Controls

1. **Daily reconciliation**: Run reconciliation report daily
2. **Monitor overdue**: Check overdue payments daily
3. **Review disputes**: Address disputes promptly
4. **Track refunds**: Monitor refund rate for abuse patterns
5. **Audit admin actions**: Regularly review adjustment history

### System Maintenance

1. **Webhook monitoring**: Check webhook health daily
2. **Failed payment review**: Process failed payments promptly
3. **Materialized views**: Refresh reporting views daily
4. **Backup data**: Regular backups of payment data
5. **Update documentation**: Keep this guide current

### Security

1. **Limit admin access**: Only grant payment admin to necessary staff
2. **Audit trail**: Review admin action logs monthly
3. **Secure webhooks**: Always verify Stripe signatures
4. **PCI compliance**: Never store full card numbers
5. **User verification**: Verify user identity for sensitive operations

### Customer Service

1. **Quick response**: Respond to payment issues within 24 hours
2. **Clear communication**: Explain payment processes in simple terms
3. **Flexible policies**: Within reason, accommodate user requests
4. **Track satisfaction**: Monitor payment-related support tickets
5. **Continuous improvement**: Update policies based on feedback

## Additional Resources

- [Payment System Architecture](./PAYMENT_SYSTEM.md)
- [API Reference](./PAYMENT_SYSTEM_API.md)
- [Reports Documentation](./PAYMENT_SYSTEM_REPORTS.md)
- [Stripe Documentation](https://stripe.com/docs)

## Support

For technical issues or questions:
- Email: support@ipsplatform.com
- Slack: #payment-system-support
- Emergency: Contact dev team lead
