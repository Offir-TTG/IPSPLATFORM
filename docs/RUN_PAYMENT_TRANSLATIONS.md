# Payment Translations Migration Guide

## Overview
This guide explains how to apply the complete payment system translations (English & Hebrew) to your database.

## IMPORTANT: Migration Updated
The migration file has been updated to use **NULL tenant_id** for global translations. This ensures translations work for all tenants without tenant-specific filtering issues.

## Migration File
Location: `supabase/migrations/20251127000000_payment_translations_complete.sql`

## What's Included

### 1. Main Payment Dashboard Translations
- `admin.payments.title` - "Payments" / "תשלומים"
- `admin.payments.description` - Description text
- `admin.payments.reports` - "Reports" / "דוחות"
- `admin.payments.paymentPlans` - "Payment Plans" / "תוכניות תשלום"
- `admin.payments.totalRevenue` - "Total Revenue" / "הכנסות כוללות"
- `admin.payments.fromLastMonth` - "from last month" / "מהחודש שעבר"
- `admin.payments.activeEnrollments` - "Active Enrollments" / "הרשמות פעילות"
- `admin.payments.withActivePayments` - "With active payments" / "עם תשלומים פעילים"
- `admin.payments.pendingPayments` - "Pending Payments" / "תשלומים ממתינים"
- `admin.payments.scheduledUpcoming` - "Scheduled upcoming" / "מתוכננים לעתיד"
- `admin.payments.overduePayments` - "Overdue Payments" / "תשלומים באיחור"
- `admin.payments.viewOverdue` - "View Overdue" / "הצג באיחור"
- `admin.payments.pendingAmount` - "Pending Amount" / "סכום ממתין"
- `admin.payments.pendingAmount.description` - Description text
- `admin.payments.pendingAmount.fromPayments` - "From {count} scheduled payments"

### 2. Quick Action Cards
All 7 navigation cards:
- Products / מוצרים
- Payment Plans / תוכניות תשלום
- Schedules / לוחות זמנים
- Transactions / עסקאות
- Disputes / מחלוקות
- Enrollments / הרשמות
- Reports / דוחות

### 3. Recent Activity Section
- Recent Activity translations
- Empty state messages

### 4. Coming Soon Section
- Title and description
- 5 feature bullets
- Documentation links (4 items)

### 5. Settings Page
- Clear Cache button translations
- Tooltip text

### 6. Common Translations
All shared terms used across payment pages:
- Back, Save, Cancel, Delete, Edit, Create
- Status, Actions, Filters, Search
- Date From, Date To, Amount, User, Product
- All status values (Pending, Paid, Overdue, Failed, Paused)
- Month names (Jan-Dec in English and Hebrew)

## Why NULL tenant_id?

The translation API filters translations using this logic:
```typescript
query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
```

This means it loads translations that either:
1. Match the user's specific tenant_id, OR
2. Have tenant_id = NULL (global translations)

By using NULL tenant_id, these payment translations become **global** and will work for all tenants automatically.

## How to Run the Migration

**IMPORTANT: You must run TWO migrations in order:**

### Step 1: Allow NULL tenant_id (Required First!)

The translations table currently has a NOT NULL constraint on tenant_id. We need to remove it first.

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **"New Query"**
5. Copy and paste the entire content of:
   `supabase/migrations/20251127000001_allow_null_tenant_id_for_global_translations.sql`
6. Click **"Run"** to execute
7. Wait for success message

### Step 2: Insert Payment Translations

Now we can insert the global translations:

1. In the same SQL Editor, click **"New Query"**
2. Copy and paste the entire content of:
   `supabase/migrations/20251127000000_payment_translations_complete.sql`
3. Click **"Run"** to execute
4. You should see: "Payment translations migration completed successfully - added 172 translations"

### Option 2: Using Supabase CLI

```bash
# Navigate to project directory
cd c:\Users\OffirOmer\Documents\IPSPlatform

# Apply the migration
npx supabase db push

# Or apply this specific migration
npx supabase migration up --file 20251127000000_payment_translations_complete
```

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to SQL Editor
4. Click "New Query"
5. Copy and paste the entire content of:
   `supabase/migrations/20251127000000_payment_translations_complete.sql`
6. Click "Run" to execute

### Option 3: Direct SQL Execution

```bash
# If you have psql installed and configured
psql $DATABASE_URL < supabase/migrations/20251127000000_payment_translations_complete.sql
```

## After Migration

### 1. Clear Translation Cache
After running the migration:
1. Go to Admin → Config → Settings
2. Click the "Clear Cache" button
3. Page will reload with fresh translations

### 2. Verify Translations
Check these pages to verify translations are loaded:
- `/admin/payments` - Main dashboard
- `/admin/payments/products` - Products page
- `/admin/payments/plans` - Payment Plans
- `/admin/payments/schedules` - Schedules
- `/admin/payments/transactions` - Transactions
- `/admin/payments/reports` - Reports
- `/admin/payments/disputes` - Disputes

### 3. Test Both Languages
Switch between English and Hebrew to verify all translations:
1. Use language switcher in admin panel
2. Hard refresh (Ctrl+F5) to test cache system
3. Check that all text appears correctly in both languages

## Translation Keys Reference

### Main Dashboard Keys
```
admin.payments.title
admin.payments.description
admin.payments.reports
admin.payments.paymentPlans
admin.payments.totalRevenue
admin.payments.fromLastMonth
admin.payments.activeEnrollments
admin.payments.withActivePayments
admin.payments.pendingPayments
admin.payments.scheduledUpcoming
admin.payments.overduePayments
admin.payments.viewOverdue
admin.payments.pendingAmount
admin.payments.pendingAmount.description
admin.payments.pendingAmount.fromPayments
```

### Card Keys
```
admin.payments.cards.products.title
admin.payments.cards.products.description
admin.payments.cards.paymentPlans.title
admin.payments.cards.paymentPlans.description
admin.payments.cards.schedules.title
admin.payments.cards.schedules.description
admin.payments.cards.transactions.title
admin.payments.cards.transactions.description
admin.payments.cards.disputes.title
admin.payments.cards.disputes.description
admin.payments.cards.enrollments.title
admin.payments.cards.enrollments.description
admin.payments.cards.reports.title
admin.payments.cards.reports.description
```

### Common Keys
```
common.back
common.save
common.cancel
common.delete
common.edit
common.create
common.status
common.actions
common.filters
common.search
common.dateFrom
common.dateTo
common.amount
common.user
common.product
common.date
common.reason
common.error
common.success
common.pending
common.paid
common.overdue
common.failed
common.paused
common.allStatuses
common.clearFilters
common.refresh
common.clear
common.saving
common.saveAll
```

### Month Keys
```
common.months.jan through common.months.dec
```

## Troubleshooting

### Translations Not Showing
1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Clear translation cache**: Use the "Clear Cache" button in Settings
3. **Hard refresh**: Ctrl+F5
4. **Check console**: Look for translation cache logs

### Database Errors
If you get constraint errors:
- The migration uses `ON CONFLICT ... DO UPDATE`
- It will update existing translations instead of failing
- Safe to run multiple times

### Cache Not Clearing
If clearing cache doesn't work:
1. Open browser DevTools → Application → Local Storage
2. Find keys starting with `translations_`
3. Delete them manually
4. Reload page

## Files Modified

1. **Migration File**: `supabase/migrations/20251127000000_payment_translations_complete.sql`
2. **Documentation**: `docs/RUN_PAYMENT_TRANSLATIONS.md` (this file)

## Next Steps

After successfully running this migration:
1. ✅ All payment page translations will be available
2. ✅ English and Hebrew fully supported
3. ✅ Cache system will work properly with versioning
4. ✅ Hard refresh will load fresh translations

## Related Documentation

- [Translation Cache System](./TRANSLATION_CACHE_SYSTEM.md) - How the cache works
- [Payment System Setup](./PAYMENT_SYSTEM_SETUP.md) - Payment system overview
- [Admin Guide](./PAYMENT_SYSTEM_ADMIN_GUIDE.md) - Using the payment system

---

**Last Updated**: 2025-11-27
**Migration Version**: 20251127000000
