# Complete Payment System Translations Migration Guide

## Overview
This guide explains how to apply **ALL** payment system translations (English & Hebrew) to your database. This includes comprehensive translations for all payment pages.

## Migration Files Created

All migrations are located in `supabase/migrations/`:

1. **20251127000001_allow_null_tenant_id_for_global_translations.sql** - Enable global translations
2. **20251127000002_products_page_translations.sql** - Products page (152 entries)
3. **20251127000003_payment_plans_page_translations.sql** - Payment Plans page (106 entries)
4. **20251127000004_schedules_page_translations.sql** - Schedules page (50+ entries)
5. **20251127000005_disputes_page_translations.sql** - Disputes page (100+ entries)
6. **20251127000006_transactions_page_translations.sql** - Transactions page (80+ entries)
7. **20251127000007_reports_page_translations.sql** - Reports page (150+ entries)

**Total**: ~740+ translation entries covering all payment system pages

## What's Included

### Products Page (`/admin/payments/products`)
- Page header & navigation
- Product type labels (Program, Course, Standalone)
- Payment model options (One-Time, Subscription, etc.)
- Form fields & validation messages
- CRUD operations & empty states

### Payment Plans Page (`/admin/payments/plans`)
- Plan types (One-Time, Deposit, Installments, Subscription)
- Plan configuration forms
- Deposit & installment settings
- Auto-detection alerts
- Form validation

### Schedules Page (`/admin/payments/schedules`)
- Schedule table headers
- Bulk actions (Delay, Pause, Cancel)
- Adjust date dialog
- Payment status labels
- Empty states

### Disputes Page (`/admin/payments/disputes`)
- Dispute status labels (Needs Response, Under Review, Won, Lost)
- Summary cards
- Evidence submission form
- Dispute details dialog
- Urgent alerts for overdue evidence

### Transactions Page (`/admin/payments/transactions`)
- Transaction status labels
- Refund dialog (Full & Partial)
- Transaction details
- Export functionality
- Search & filters

### Reports Page (`/admin/payments/reports`)
- 7 report tabs (Revenue, Status, Cash Flow, Products, Users, Plans, Operational)
- Chart labels & legends
- Date range options
- Revenue metrics (MRR, ARR, etc.)
- User segments
- System health metrics

## How to Run the Migrations

### IMPORTANT: Run in Correct Order

The migrations **MUST** be run in the following order:

```
1. 20251127000001 - Enable NULL tenant_id (REQUIRED FIRST!)
2. 20251127000002 - Products translations
3. 20251127000003 - Payment Plans translations
4. 20251127000004 - Schedules translations
5. 20251127000005 - Disputes translations
6. 20251127000006 - Transactions translations
7. 20251127000007 - Reports translations
```

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. For each migration file (in order):
   - Click **"New Query"**
   - Copy and paste the **entire content** of the migration file
   - Click **"Run"** to execute
   - Wait for success message before moving to next file

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd c:\Users\OffirOmer\Documents\IPSPlatform

# Apply all migrations
npx supabase db push

# Or apply specific migration
npx supabase migration up --file 20251127000001_allow_null_tenant_id_for_global_translations
```

### Option 3: Direct SQL Execution

```bash
# If you have psql installed
psql $DATABASE_URL < supabase/migrations/20251127000001_allow_null_tenant_id_for_global_translations.sql
# Repeat for each file in order
```

## After Migration

### 1. Clear Translation Cache

**CRITICAL**: After running all migrations:

1. Go to **Admin → Config → Settings**
2. Click the **"Clear Cache"** button
3. Page will reload with fresh translations

### 2. Verify Translations

Check all payment pages to verify translations are loaded:

- `/admin/payments` - Main dashboard
- `/admin/payments/products` - Products page
- `/admin/payments/plans` - Payment Plans
- `/admin/payments/schedules` - Schedules
- `/admin/payments/transactions` - Transactions
- `/admin/payments/disputes` - Disputes
- `/admin/payments/reports` - Reports

### 3. Test Both Languages

1. Use language switcher in admin panel
2. Switch between English and Hebrew
3. Hard refresh (Ctrl+F5) to test cache system
4. Verify all text appears correctly in both languages

## Translation Coverage Summary

### Products Page (152 translations)
- ✅ Main page translations (32 keys)
- ✅ Product types (8 keys)
- ✅ Payment models (4 keys)
- ✅ Form fields (18 keys)
- ✅ Validation messages (14 keys)

### Payment Plans Page (106 translations)
- ✅ Page header (6 keys)
- ✅ Plan types (8 keys)
- ✅ Form sections (40+ keys)
- ✅ Configuration options (30+ keys)
- ✅ Status badges (10 keys)

### Schedules Page (50+ translations)
- ✅ Table headers (8 keys)
- ✅ Bulk actions (6 keys)
- ✅ Dialogs (10 keys)
- ✅ Status labels (8 keys)

### Disputes Page (100+ translations)
- ✅ Summary cards (8 keys)
- ✅ Status labels (10 keys)
- ✅ Evidence form (20+ keys)
- ✅ Details dialog (15 keys)
- ✅ Alerts (5 keys)

### Transactions Page (80+ translations)
- ✅ Summary cards (8 keys)
- ✅ Refund dialog (15 keys)
- ✅ Details dialog (10 keys)
- ✅ Table headers (8 keys)
- ✅ Status labels (8 keys)

### Reports Page (150+ translations)
- ✅ 7 report tabs
- ✅ Date range options (6 keys)
- ✅ Chart labels (15 keys)
- ✅ Revenue metrics (20+ keys)
- ✅ User segments (6 keys)
- ✅ Operational metrics (20+ keys)

## Global Translation Keys

All translations use `tenant_id = NULL` for global availability:

```sql
-- Example structure
INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  ('admin.payments.products.title', 'en', 'Products', 'admin', NULL::uuid),
  ('admin.payments.products.title', 'he', 'מוצרים', 'admin', NULL::uuid);
```

This ensures:
- Translations work for **all tenants**
- No tenant-specific filtering issues
- Easy maintenance and updates

## Troubleshooting

### Translations Not Showing

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Clear translation cache**: Use "Clear Cache" button in Settings
3. **Hard refresh**: Ctrl+F5
4. **Check console**: Look for translation cache logs

### Database Errors

If you get errors:
- Ensure migrations run in **correct order**
- Check that migration #1 (allow NULL tenant_id) ran successfully
- All migrations use proper UUID type casting: `NULL::uuid`
- Safe to run multiple times (uses DELETE + INSERT pattern)

### Cache Not Clearing

If clearing cache doesn't work:
1. Open browser DevTools → Application → Local Storage
2. Find keys starting with `translations_`
3. Delete them manually
4. Reload page

### Missing Translations

If specific translations are missing:
1. Check migration file ran successfully
2. Verify translation key matches code usage
3. Clear cache and refresh
4. Check browser console for errors

## Database Schema

### Translations Table Structure

```sql
-- tenant_id is now nullable (after migration #1)
ALTER TABLE translations
ALTER COLUMN tenant_id DROP NOT NULL;

-- Two partial unique indexes
CREATE UNIQUE INDEX translations_unique_with_tenant
ON translations (translation_key, language_code, context, tenant_id)
WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX translations_unique_global
ON translations (translation_key, language_code, context)
WHERE tenant_id IS NULL;
```

## Translation API Logic

The translation API loads translations using:

```typescript
query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
```

This means it loads:
1. Translations matching user's specific `tenant_id`, OR
2. Global translations with `tenant_id = NULL`

## Files Modified

1. **Migration Files** (7 files):
   - `supabase/migrations/20251127000001_allow_null_tenant_id_for_global_translations.sql`
   - `supabase/migrations/20251127000002_products_page_translations.sql`
   - `supabase/migrations/20251127000003_payment_plans_page_translations.sql`
   - `supabase/migrations/20251127000004_schedules_page_translations.sql`
   - `supabase/migrations/20251127000005_disputes_page_translations.sql`
   - `supabase/migrations/20251127000006_transactions_page_translations.sql`
   - `supabase/migrations/20251127000007_reports_page_translations.sql`

2. **Documentation** (this file):
   - `docs/RUN_ALL_PAYMENT_TRANSLATIONS.md`

## Validation Checklist

After running all migrations, verify:

- [ ] Migration #1 ran successfully (NULL tenant_id enabled)
- [ ] All 7 translation migrations completed without errors
- [ ] Translation cache cleared in Settings page
- [ ] Products page displays both English and Hebrew
- [ ] Payment Plans page displays both languages
- [ ] Schedules page displays both languages
- [ ] Disputes page displays both languages
- [ ] Transactions page displays both languages
- [ ] Reports page displays both languages
- [ ] Language switcher works correctly
- [ ] Hard refresh (Ctrl+F5) loads fresh translations
- [ ] No raw translation keys visible (e.g., `admin.payments.products.title`)

## Next Steps

After successfully running all migrations:

1. ✅ All payment page translations available
2. ✅ English and Hebrew fully supported
3. ✅ Cache system working with versioning
4. ✅ Hard refresh loads fresh translations
5. ✅ Ready for production use

## Related Documentation

- [Payment System Setup](./PAYMENT_SYSTEM_SETUP.md) - Payment system overview
- [Translation Cache System](./TRANSLATION_CACHE_SYSTEM.md) - How the cache works
- [Admin Guide](./PAYMENT_SYSTEM_ADMIN_GUIDE.md) - Using the payment system

---

**Last Updated**: 2025-11-27
**Migration Version**: 20251127000007
**Total Translations**: ~740+ entries across 7 pages
