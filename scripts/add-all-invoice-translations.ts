/**
 * Add all Hebrew translations for invoice-related text
 * Run: npx ts-node scripts/add-all-invoice-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // Basic invoice terms
  {
    key: 'invoices.invoice_date',
    en: 'Invoice Date',
    he: 'תאריך חשבונית'
  },
  {
    key: 'invoices.paid_on',
    en: 'Paid on',
    he: 'שולם ב'
  },
  {
    key: 'invoices.due_date',
    en: 'Due Date',
    he: 'תאריך יעד'
  },
  {
    key: 'invoices.amount_due',
    en: 'Amount Due',
    he: 'סכום לתשלום'
  },
  // Status translations
  {
    key: 'invoices.status.paid',
    en: 'Paid',
    he: 'שולם'
  },
  {
    key: 'invoices.status.open',
    en: 'Open',
    he: 'פתוח'
  },
  {
    key: 'invoices.status.overdue',
    en: 'Overdue',
    he: 'באיחור'
  },
  {
    key: 'invoices.status.draft',
    en: 'Draft',
    he: 'טיוטה'
  },
  // Error and empty states
  {
    key: 'invoices.error_loading',
    en: 'Failed to load invoices',
    he: 'נכשל בטעינת חשבוניות'
  },
  {
    key: 'invoices.empty.title',
    en: 'No invoices yet',
    he: 'אין חשבוניות עדיין'
  },
  {
    key: 'invoices.empty.subtitle',
    en: 'Your invoices will appear here',
    he: 'החשבוניות שלך יופיעו כאן'
  },
  // Actions
  {
    key: 'invoices.actions.view',
    en: 'View',
    he: 'צפה'
  },
  {
    key: 'invoices.actions.download',
    en: 'PDF',
    he: 'הורד PDF'
  },
  {
    key: 'invoices.actions.pay_now',
    en: 'Pay Now',
    he: 'שלם עכשיו'
  },
  // Titles
  {
    key: 'user.invoices.title',
    en: 'My Invoices',
    he: 'החשבוניות שלי'
  },
  {
    key: 'invoices.filter.all',
    en: 'Invoices',
    he: 'חשבוניות'
  }
];

async function addTranslations() {
  try {
    console.log('🚀 Adding all invoice translations...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const trans of translations) {
      // Check if translation already exists (English)
      const { data: existingEn } = await supabase
        .from('translations')
        .select('translation_key')
        .eq('translation_key', trans.key)
        .eq('language_code', 'en')
        .eq('tenant_id', tenantId)
        .single();

      if (existingEn) {
        console.log(`⏭️  Skipped: ${trans.key} - already exists`);
        skippedCount += 2;
        continue;
      }

      // Insert English
      const { error: enError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (enError) {
        console.error(`❌ Error inserting ${trans.key} (en):`, enError);
      } else {
        console.log(`✓ Added: ${trans.key} (en) = "${trans.en}"`);
        addedCount++;
      }

      // Insert Hebrew
      const { error: heError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (heError) {
        console.error(`❌ Error inserting ${trans.key} (he):`, heError);
      } else {
        console.log(`✓ Added: ${trans.key} (he) = "${trans.he}"`);
        addedCount++;
      }
    }

    console.log(`\n✅ Translation import complete!`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTranslations()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
