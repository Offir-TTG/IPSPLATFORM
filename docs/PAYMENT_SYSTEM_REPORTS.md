# Payment System Reports Documentation

## Table of Contents

- [Overview](#overview)
- [Report Types](#report-types)
- [Chart Components](#chart-components)
- [Materialized Views](#materialized-views)
- [Report Generation](#report-generation)
- [Export Functionality](#export-functionality)
- [Scheduling Reports](#scheduling-reports)
- [Custom Reports](#custom-reports)

## Overview

The payment system includes 7 comprehensive report types with interactive charts and graphs. All reports support:

- Real-time data visualization
- Interactive charts with drill-down
- Export to CSV/Excel/PDF
- Email scheduling
- Date range filtering
- Multi-tenant isolation

## Report Types

### 1. Revenue Dashboard

**Purpose**: Track total revenue, trends, and recurring revenue metrics

**Path**: `/admin/payments/reports/revenue`

**Metrics**:
- Total Revenue (selected period)
- Revenue Change % (vs previous period)
- Average Transaction Value
- Total Transactions
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Revenue Growth Rate

**Charts**:

#### Revenue Over Time (Line Chart)
Shows daily/weekly/monthly revenue trends

```typescript
{
  date: string; // "2025-01-01"
  revenue: number; // 15420.50
  transactions: number; // 45
}
```

#### Revenue by Payment Type (Pie Chart)
Distribution of revenue by payment type

```typescript
{
  payment_type: 'one_time' | 'deposit' | 'installment' | 'subscription';
  revenue: number;
  percentage: number; // 35.5
  transactions: number;
}
```

#### Revenue by Product (Bar Chart)
Top products by revenue

```typescript
{
  product_id: string;
  product_name: string;
  product_type: string;
  revenue: number;
  transactions: number;
  avg_transaction_value: number;
}
```

#### MRR Trend (Area Chart)
Monthly recurring revenue over time

```typescript
{
  month: string; // "2025-01"
  mrr: number;
  new_mrr: number; // From new subscriptions
  expansion_mrr: number; // From upgrades
  churn_mrr: number; // Lost subscriptions
  net_mrr_growth: number;
}
```

**Filters**:
- Date Range: From/To dates
- Product Type: Filter by product type
- Payment Type: Filter by payment type
- Granularity: Day/Week/Month
- Currency: Filter by currency

**SQL Query**:
```sql
SELECT
  DATE_TRUNC('day', p.created_at) as date,
  SUM(p.amount) as revenue,
  COUNT(*) as transactions,
  AVG(p.amount) as avg_transaction_value
FROM payments p
JOIN enrollments e ON p.enrollment_id = e.id
WHERE p.status = 'succeeded'
  AND p.created_at BETWEEN $1 AND $2
  AND e.tenant_id = $3
GROUP BY DATE_TRUNC('day', p.created_at)
ORDER BY date;
```

### 2. Payment Status Report

**Purpose**: Monitor payment status distribution and identify issues

**Path**: `/admin/payments/reports/status`

**Metrics**:
- Total Enrollments
- Fully Paid Count
- Partially Paid Count
- Pending Count
- Overdue Count
- Total Amount Pending
- Total Amount Overdue

**Charts**:

#### Status Distribution (Pie Chart)
Breakdown of payment statuses

```typescript
{
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  count: number;
  percentage: number;
  total_amount: number;
}
```

#### Payment Completion Rate (Gauge Chart)
Percentage of payments completed on time

```typescript
{
  on_time_percentage: number; // 87.5
  late_percentage: number; // 10.2
  default_percentage: number; // 2.3
}
```

#### Overdue Aging (Bar Chart)
Breakdown of overdue payments by age

```typescript
{
  age_bucket: '0-7 days' | '8-30 days' | '31-60 days' | '60+ days';
  count: number;
  total_amount: number;
}
```

**Tables**:

#### Overdue Details Table
List of all overdue payments

| User | Product | Amount | Days Overdue | Last Contact | Action |
|------|---------|--------|--------------|--------------|--------|
| John Doe | Advanced React | $299 | 15 | 2025-01-10 | Contact |

**Filters**:
- Status: Filter by payment status
- Days Overdue: Filter by overdue range
- Product: Filter by product
- Amount Range: Filter by payment amount

**SQL Query**:
```sql
SELECT
  e.payment_status as status,
  COUNT(*) as count,
  SUM(e.total_amount) as total_amount,
  (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enrollments WHERE tenant_id = $1)) as percentage
FROM enrollments e
WHERE e.tenant_id = $1
GROUP BY e.payment_status;
```

### 3. Cash Flow Report

**Purpose**: Forecast expected revenue and plan for future cash flow

**Path**: `/admin/payments/reports/cash-flow`

**Metrics**:
- Current Month Expected Revenue
- Current Month Received Revenue
- Current Month Pending Revenue
- Next 6 Months Forecast
- Confidence Score

**Charts**:

#### Cash Flow Forecast (Area Chart)
Projected revenue for upcoming months

```typescript
{
  month: string; // "2025-02"
  expected_revenue: number; // From scheduled payments
  scheduled_payments: number; // Count of scheduled payments
  subscription_revenue: number; // Recurring subscription revenue
  confidence: 'high' | 'medium' | 'low'; // Based on historical data
  lower_bound: number; // Pessimistic projection
  upper_bound: number; // Optimistic projection
}
```

#### Expected vs Actual (Combo Chart)
Compare projected vs actual revenue

```typescript
{
  month: string;
  expected: number;
  actual: number;
  variance: number;
  variance_percentage: number;
}
```

#### Revenue by Week (Bar Chart)
Weekly breakdown for current month

```typescript
{
  week: string; // "Week 1"
  scheduled: number;
  received: number;
  pending: number;
}
```

**Seasonal Patterns**:
Identifies recurring patterns in revenue

```typescript
{
  pattern_type: 'monthly' | 'quarterly' | 'yearly';
  peak_months: string[]; // ["September", "January"]
  low_months: string[]; // ["July", "August"]
  seasonal_factor: number; // 1.25 = 25% above average
}
```

**Filters**:
- Forecast Horizon: 3/6/12 months
- Include Subscriptions: Yes/No
- Confidence Level: All/High Only

**SQL Query**:
```sql
WITH scheduled_revenue AS (
  SELECT
    DATE_TRUNC('month', ps.scheduled_date) as month,
    SUM(ps.amount) as expected_revenue,
    COUNT(*) as scheduled_count
  FROM payment_schedules ps
  JOIN enrollments e ON ps.enrollment_id = e.id
  WHERE ps.status IN ('pending', 'processing')
    AND ps.scheduled_date >= CURRENT_DATE
    AND ps.scheduled_date < CURRENT_DATE + INTERVAL '6 months'
    AND e.tenant_id = $1
  GROUP BY DATE_TRUNC('month', ps.scheduled_date)
),
subscription_revenue AS (
  SELECT
    DATE_TRUNC('month', generate_series) as month,
    SUM(s.amount) as subscription_revenue
  FROM subscriptions s
  CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', '1 month'::interval)
  WHERE s.status = 'active'
    AND s.tenant_id = $1
  GROUP BY DATE_TRUNC('month', generate_series)
)
SELECT
  sr.month,
  COALESCE(sr.expected_revenue, 0) as expected_revenue,
  COALESCE(sr.scheduled_count, 0) as scheduled_count,
  COALESCE(subr.subscription_revenue, 0) as subscription_revenue,
  COALESCE(sr.expected_revenue, 0) + COALESCE(subr.subscription_revenue, 0) as total_expected
FROM scheduled_revenue sr
FULL OUTER JOIN subscription_revenue subr ON sr.month = subr.month
ORDER BY month;
```

### 4. Product Performance Report

**Purpose**: Compare revenue and performance across products

**Path**: `/admin/payments/reports/products`

**Metrics**:
- Total Products
- Top Revenue Product
- Highest Enrollment Count
- Average Revenue per Product
- Best Payment Completion Rate

**Charts**:

#### Revenue by Product (Bar Chart)
Compare total revenue across products

```typescript
{
  product_id: string;
  product_name: string;
  product_type: string;
  total_revenue: number;
  enrollment_count: number;
  avg_revenue_per_enrollment: number;
}
```

#### Payment Completion Rate (Bar Chart)
Compare payment completion across products

```typescript
{
  product_name: string;
  completion_rate: number; // 92.5%
  on_time_rate: number; // 85.0%
  default_rate: number; // 2.5%
}
```

#### Preferred Payment Plans (Stacked Bar Chart)
Show payment plan distribution by product

```typescript
{
  product_name: string;
  payment_plans: {
    one_time: number; // 45%
    deposit: number; // 30%
    installments: number; // 20%
    subscription: number; // 5%
  }
}
```

#### Product Revenue Trend (Line Chart)
Revenue trend for top products

```typescript
{
  date: string;
  products: {
    [product_name: string]: number;
  }
}
```

**Table**: Product Performance Details

| Product | Type | Revenue | Enrollments | Avg Revenue | Completion % | Preferred Plan |
|---------|------|---------|-------------|-------------|--------------|----------------|
| Advanced React | Course | $45,280 | 152 | $298 | 94% | One-time |

**Filters**:
- Product Type: Filter by type
- Date Range: Revenue period
- Min Revenue: Filter low performers
- Sort By: Revenue/Enrollments/Completion Rate

**SQL Query**:
```sql
SELECT
  prod.id as product_id,
  prod.product_name,
  prod.product_type,
  COUNT(DISTINCT e.id) as enrollment_count,
  SUM(e.paid_amount) as total_revenue,
  AVG(e.paid_amount) as avg_revenue_per_enrollment,
  (COUNT(DISTINCT CASE WHEN e.payment_status = 'paid' THEN e.id END) * 100.0 /
   COUNT(DISTINCT e.id)) as payment_completion_rate,
  MODE() WITHIN GROUP (ORDER BY pp.plan_name) as preferred_payment_plan
FROM products prod
LEFT JOIN enrollments e ON e.product_id = prod.id
LEFT JOIN payment_plans pp ON e.payment_plan_id = pp.id
WHERE prod.tenant_id = $1
  AND e.created_at BETWEEN $2 AND $3
GROUP BY prod.id, prod.product_name, prod.product_type
ORDER BY total_revenue DESC;
```

### 5. User Payment Analysis

**Purpose**: Understand user payment behavior and segment analysis

**Path**: `/admin/payments/reports/users`

**Metrics**:
- Total Users
- Paying Users
- Average Lifetime Value (LTV)
- Churn Rate
- On-Time Payment Rate

**Charts**:

#### User Segmentation (Pie Chart)
Breakdown of users by segment

```typescript
{
  segment: 'student' | 'parent' | 'instructor' | 'enterprise';
  user_count: number;
  percentage: number;
  total_revenue: number;
  avg_revenue_per_user: number;
}
```

#### LTV Distribution (Histogram)
Distribution of user lifetime values

```typescript
{
  ltv_bucket: '$0-$500' | '$500-$1000' | '$1000-$2500' | '$2500+';
  user_count: number;
  percentage: number;
}
```

#### Payment Behavior (Bar Chart)
Payment behavior metrics

```typescript
{
  behavior: 'on_time' | 'late' | 'default';
  percentage: number;
  user_count: number;
  avg_days_late?: number;
}
```

#### Cohort Analysis (Heatmap)
Revenue retention by enrollment cohort

```typescript
{
  cohort_month: string; // "2024-01"
  month_0: number; // 100%
  month_1: number; // 95%
  month_2: number; // 92%
  month_3: number; // 88%
  // ... up to month_12
}
```

**Top Spenders Table**:

| User | Enrollments | Total Paid | Avg Payment | Payment Status | LTV |
|------|-------------|------------|-------------|----------------|-----|
| John Doe | 5 | $2,450 | $490 | Good | $3,500 |

**Filters**:
- User Segment: Filter by role
- LTV Range: Filter by lifetime value
- Payment Behavior: Filter by behavior
- Date Range: Enrollment period

**SQL Query**:
```sql
WITH user_stats AS (
  SELECT
    u.id as user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.role as user_segment,
    COUNT(DISTINCT e.id) as enrollment_count,
    SUM(e.paid_amount) as total_paid,
    SUM(e.total_amount) as total_ltv,
    AVG(e.paid_amount) as avg_payment,
    (COUNT(DISTINCT ps.id) FILTER (WHERE ps.paid_date <= ps.scheduled_date) * 100.0 /
     NULLIF(COUNT(DISTINCT ps.id) FILTER (WHERE ps.status = 'paid'), 0)) as on_time_rate
  FROM users u
  LEFT JOIN enrollments e ON e.user_id = u.id
  LEFT JOIN payment_schedules ps ON ps.enrollment_id = e.id
  WHERE u.tenant_id = $1
  GROUP BY u.id, u.first_name, u.last_name, u.role
)
SELECT
  user_segment,
  COUNT(*) as user_count,
  SUM(total_paid) as total_revenue,
  AVG(total_paid) as avg_revenue_per_user,
  AVG(on_time_rate) as avg_on_time_rate
FROM user_stats
WHERE enrollment_count > 0
GROUP BY user_segment;
```

### 6. Operational Report

**Purpose**: Monitor day-to-day payment operations and admin actions

**Path**: `/admin/payments/reports/operational`

**Metrics**:
- Overdue Payments (requires action)
- Failed Payments to Retry
- Paused Schedules
- Ending Subscriptions (this month)
- Recent Adjustments (last 7 days)

**Sections**:

#### Pending Actions Dashboard

**Overdue Payments**:
```typescript
{
  count: number;
  total_amount: number;
  avg_days_overdue: number;
  list: Array<{
    enrollment_id: string;
    user_name: string;
    product_name: string;
    amount: number;
    days_overdue: number;
    last_contact_date: string;
  }>;
}
```

**Failed Payments to Retry**:
```typescript
{
  count: number;
  scheduled_retries: number;
  list: Array<{
    payment_schedule_id: string;
    user_name: string;
    amount: number;
    failure_reason: string;
    retry_count: number;
    next_retry_date: string;
  }>;
}
```

#### Recent Admin Actions Table

| Timestamp | Admin | Action | Enrollment | User | Reason |
|-----------|-------|--------|------------|------|--------|
| 2025-01-15 10:30 | Admin User | Adjust Date | #1234 | John Doe | User requested extension |
| 2025-01-15 09:15 | Finance Manager | Pause Payments | #1235 | Jane Smith | Medical leave |

**SQL Query**:
```sql
-- Recent adjustments
SELECT
  ps.updated_at as timestamp,
  u_admin.first_name || ' ' || u_admin.last_name as admin_name,
  jsonb_array_elements(ps.adjustment_history)->>'action' as action_type,
  e.id as enrollment_id,
  u.first_name || ' ' || u.last_name as user_name,
  jsonb_array_elements(ps.adjustment_history)->>'reason' as reason
FROM payment_schedules ps
JOIN enrollments e ON ps.enrollment_id = e.id
JOIN users u ON e.user_id = u.id
JOIN users u_admin ON (jsonb_array_elements(ps.adjustment_history)->>'admin_id')::uuid = u_admin.id
WHERE ps.tenant_id = $1
  AND ps.updated_at >= NOW() - INTERVAL '7 days'
  AND jsonb_array_length(ps.adjustment_history) > 0
ORDER BY ps.updated_at DESC
LIMIT 50;
```

#### Reminder Statistics

**Chart**: Reminders Sent Over Time

```typescript
{
  period: 'today' | 'this_week' | 'this_month';
  payment_reminders: number;
  overdue_notices: number;
  subscription_renewals: number;
}
```

#### System Health Metrics

```typescript
{
  webhook_success_rate: number; // 99.5%
  avg_payment_processing_time: number; // Seconds
  failed_webhook_count: number;
  retry_queue_length: number;
  last_reconciliation: string; // ISO date
}
```

**Filters**:
- Date Range: Action period
- Admin User: Filter by admin
- Action Type: Filter by action type

### 7. Financial Reconciliation

**Purpose**: Ensure database and Stripe records match

**Path**: `/admin/payments/reports/reconciliation`

**Metrics**:
- Database Total
- Stripe Total
- Difference
- Matched Transactions
- Unmatched Transactions
- Discrepancy Count

**Charts**:

#### Reconciliation Status (Gauge Chart)
```typescript
{
  match_rate: number; // 99.2%
  total_transactions: number;
  matched: number;
  unmatched: number;
}
```

#### Daily Reconciliation Trend (Line Chart)
```typescript
{
  date: string;
  database_total: number;
  stripe_total: number;
  difference: number;
  discrepancy_count: number;
}
```

**Discrepancies Table**:

| Payment ID | Database Amount | Stripe Amount | Difference | Status | Action |
|------------|-----------------|---------------|------------|--------|--------|
| pay_123 | $299.00 | $299.00 | $0.00 | Matched | - |
| pay_124 | $500.00 | $490.00 | $10.00 | Mismatch | Investigate |

**SQL Query**:
```sql
WITH database_payments AS (
  SELECT
    p.stripe_payment_intent_id,
    p.amount as db_amount,
    p.currency,
    p.created_at
  FROM payments p
  WHERE p.tenant_id = $1
    AND p.created_at BETWEEN $2 AND $3
    AND p.status = 'succeeded'
),
stripe_payments AS (
  -- This would come from Stripe API sync
  SELECT * FROM stripe_payment_sync
  WHERE tenant_id = $1
    AND created_at BETWEEN $2 AND $3
)
SELECT
  COALESCE(dp.stripe_payment_intent_id, sp.payment_intent_id) as payment_id,
  dp.db_amount,
  sp.stripe_amount,
  (dp.db_amount - sp.stripe_amount) as difference,
  CASE
    WHEN dp.db_amount = sp.stripe_amount THEN 'matched'
    WHEN dp.db_amount IS NULL THEN 'missing_in_database'
    WHEN sp.stripe_amount IS NULL THEN 'missing_in_stripe'
    ELSE 'amount_mismatch'
  END as status
FROM database_payments dp
FULL OUTER JOIN stripe_payments sp
  ON dp.stripe_payment_intent_id = sp.payment_intent_id
WHERE dp.db_amount != sp.stripe_amount
   OR dp.db_amount IS NULL
   OR sp.stripe_amount IS NULL;
```

**Actions**:
- Sync Missing Payments
- Resolve Discrepancies
- Export for Review
- Run Full Reconciliation

**Filters**:
- Date Range: Reconciliation period
- Status: Matched/Unmatched/Discrepancies Only
- Min Difference: Filter small differences

## Chart Components

### Implementing Charts with Recharts

All charts use the `recharts` library for React. Here are implementations:

#### Line Chart Example

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function RevenueLineChart({ data }: { data: RevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### Pie Chart Example

```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function StatusPieChart({ data }: { data: StatusData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.status}: ${entry.percentage}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

#### Bar Chart Example

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ProductBarChart({ data }: { data: ProductData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="revenue" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### Area Chart Example

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CashFlowAreaChart({ data }: { data: CashFlowData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Area
          type="monotone"
          dataKey="expected_revenue"
          stackId="1"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="subscription_revenue"
          stackId="1"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

## Materialized Views

To improve report performance, create materialized views that pre-calculate aggregations:

### Revenue Summary View

```sql
CREATE MATERIALIZED VIEW mv_revenue_summary AS
SELECT
  e.tenant_id,
  DATE_TRUNC('day', p.created_at) as date,
  prod.product_type,
  p.payment_type,
  COUNT(p.id) as transaction_count,
  SUM(p.amount) as total_revenue,
  AVG(p.amount) as avg_transaction_value
FROM payments p
JOIN enrollments e ON p.enrollment_id = e.id
JOIN products prod ON e.product_id = prod.id
WHERE p.status = 'succeeded'
GROUP BY e.tenant_id, DATE_TRUNC('day', p.created_at), prod.product_type, p.payment_type;

CREATE INDEX idx_mv_revenue_tenant_date ON mv_revenue_summary(tenant_id, date);
```

### Payment Status View

```sql
CREATE MATERIALIZED VIEW mv_payment_status AS
SELECT
  e.tenant_id,
  e.payment_status,
  COUNT(*) as enrollment_count,
  SUM(e.total_amount) as total_amount,
  SUM(e.paid_amount) as paid_amount,
  SUM(e.remaining_amount) as remaining_amount
FROM enrollments e
GROUP BY e.tenant_id, e.payment_status;

CREATE INDEX idx_mv_payment_status_tenant ON mv_payment_status(tenant_id);
```

### Refresh Strategy

```sql
-- Refresh all views daily
CREATE OR REPLACE FUNCTION refresh_payment_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_status;
  -- Add other views
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (use pg_cron or external scheduler)
SELECT cron.schedule('refresh-payment-views', '0 2 * * *', 'SELECT refresh_payment_views()');
```

## Report Generation

### Server-Side Generation

```typescript
// src/lib/payments/reportGenerator.ts
import { supabase } from '@/lib/supabase/client';

export class ReportGenerator {
  async generateRevenueReport(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    options: ReportOptions = {}
  ): Promise<RevenueReport> {
    // Use materialized view for performance
    const { data: revenueData } = await supabase
      .from('mv_revenue_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', fromDate.toISOString())
      .lte('date', toDate.toISOString());

    // Calculate metrics
    const totalRevenue = revenueData?.reduce((sum, row) => sum + row.total_revenue, 0) || 0;
    const totalTransactions = revenueData?.reduce((sum, row) => sum + row.transaction_count, 0) || 0;
    const avgTransactionValue = totalRevenue / totalTransactions;

    // Get MRR/ARR
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('amount, billing_frequency')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    const mrr = this.calculateMRR(subscriptionData);
    const arr = mrr * 12;

    return {
      summary: {
        total_revenue: totalRevenue,
        revenue_change_percent: await this.calculateRevenueChange(tenantId, fromDate),
        avg_transaction_value: avgTransactionValue,
        total_transactions: totalTransactions,
        mrr,
        arr
      },
      revenue_over_time: this.groupByGranularity(revenueData, options.granularity),
      revenue_by_type: this.groupByType(revenueData),
      revenue_by_product: await this.getRevenueByProduct(tenantId, fromDate, toDate)
    };
  }

  private calculateMRR(subscriptions: Subscription[]): number {
    return subscriptions.reduce((sum, sub) => {
      const monthlyAmount = this.normalizeToMonthly(sub.amount, sub.billing_frequency);
      return sum + monthlyAmount;
    }, 0);
  }

  private normalizeToMonthly(amount: number, frequency: string): number {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'annually': return amount / 12;
      default: return amount;
    }
  }
}
```

## Export Functionality

### CSV Export

```typescript
// src/lib/payments/exporters/csvExporter.ts
import { parse } from 'json2csv';

export class CSVExporter {
  async exportReport(reportData: any[], filename: string): Promise<Blob> {
    const csv = parse(reportData, {
      fields: Object.keys(reportData[0])
    });

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }
}
```

### Excel Export

```typescript
// src/lib/payments/exporters/excelExporter.ts
import * as XLSX from 'xlsx';

export class ExcelExporter {
  async exportReport(reportData: any[], filename: string): Promise<Blob> {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
```

### Client-Side Download

```typescript
// components/reports/ExportButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ExportButton({ reportType, filters }: ExportButtonProps) {
  const handleExport = async (format: 'csv' | 'excel') => {
    const response = await fetch(
      `/api/admin/payments/reports/${reportType}/export?format=${format}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-${new Date().toISOString()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
  };

  return (
    <div className="flex gap-2">
      <Button onClick={() => handleExport('csv')} variant="outline">
        <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button onClick={() => handleExport('excel')} variant="outline">
        <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
        Export Excel
      </Button>
    </div>
  );
}
```

## Scheduling Reports

### Email Report Scheduler

```typescript
// src/lib/payments/reportScheduler.ts
import { sendEmail } from '@/lib/email';
import { ReportGenerator } from './reportGenerator';

export class ReportScheduler {
  async scheduleReport(config: ScheduleConfig): Promise<void> {
    // Store schedule in database
    await supabase.from('report_schedules').insert({
      tenant_id: config.tenantId,
      report_type: config.reportType,
      frequency: config.frequency, // daily, weekly, monthly
      recipients: config.recipients,
      filters: config.filters,
      format: config.format
    });
  }

  async executeScheduledReport(scheduleId: string): Promise<void> {
    const { data: schedule } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    // Generate report
    const generator = new ReportGenerator();
    const report = await generator.generate(
      schedule.report_type,
      schedule.tenant_id,
      schedule.filters
    );

    // Export to file
    const exporter = schedule.format === 'csv' ? new CSVExporter() : new ExcelExporter();
    const file = await exporter.exportReport(report.data, `report-${Date.now()}`);

    // Email to recipients
    for (const recipient of schedule.recipients) {
      await sendEmail({
        to: recipient,
        subject: `Scheduled Report: ${schedule.report_type}`,
        body: this.generateEmailBody(report),
        attachments: [{
          filename: `report.${schedule.format}`,
          content: file
        }]
      });
    }

    // Update last run
    await supabase
      .from('report_schedules')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', scheduleId);
  }
}
```

## Custom Reports

Admins can create custom reports using the query builder:

```typescript
// components/reports/CustomReportBuilder.tsx
export function CustomReportBuilder() {
  const [fields, setFields] = useState<Field[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);

  return (
    <div>
      <h2>Custom Report Builder</h2>

      <FieldSelector
        availableFields={AVAILABLE_FIELDS}
        selected={fields}
        onChange={setFields}
      />

      <FilterBuilder
        fields={fields}
        filters={filters}
        onChange={setFilters}
      />

      <GroupBySelector
        fields={fields}
        groupBy={groupBy}
        onChange={setGroupBy}
      />

      <Button onClick={handleGenerateReport}>
        Generate Report
      </Button>
    </div>
  );
}
```

This allows building queries like:
- "Show me revenue by instructor for Q4 2024"
- "List all users who have failed payments in January"
- "Compare payment plan preferences by user segment"

## Performance Considerations

1. **Use materialized views** for expensive aggregations
2. **Index heavily queried fields** (tenant_id, dates, statuses)
3. **Implement pagination** for large result sets
4. **Cache report results** for 5-10 minutes
5. **Use background jobs** for large exports
6. **Limit date ranges** to prevent performance issues
7. **Aggregate at query time** only for real-time metrics

## Conclusion

The reporting system provides comprehensive visibility into payment operations with:
- 7 specialized report types
- Interactive charts and visualizations
- Export and scheduling capabilities
- Performance-optimized queries
- Customization options

For API details, see [PAYMENT_SYSTEM_API.md](./PAYMENT_SYSTEM_API.md)
For admin operations, see [PAYMENT_SYSTEM_ADMIN_GUIDE.md](./PAYMENT_SYSTEM_ADMIN_GUIDE.md)
