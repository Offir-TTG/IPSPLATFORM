/**
 * Add Hebrew translations for refund functionality
 * Run: npx ts-node scripts/add-refund-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // Refund Dialog
  {
    key: 'admin.payments.transactions.refund.title',
    en: 'Process Refund',
    he: 'עיבוד החזר כספי'
  },
  {
    key: 'admin.payments.transactions.refund.description',
    en: 'Refund transaction for',
    he: 'החזר כספי עבור עסקה של'
  },
  {
    key: 'admin.payments.transactions.refund.type',
    en: 'Refund Type',
    he: 'סוג החזר'
  },
  {
    key: 'admin.payments.transactions.refund.fullRefund',
    en: 'Full Refund',
    he: 'החזר מלא'
  },
  {
    key: 'admin.payments.transactions.refund.partialRefund',
    en: 'Partial Refund',
    he: 'החזר חלקי'
  },
  {
    key: 'admin.payments.transactions.refund.amount',
    en: 'Refund Amount',
    he: 'סכום להחזר'
  },
  {
    key: 'admin.payments.transactions.refund.maximum',
    en: 'Maximum',
    he: 'מקסימום'
  },
  {
    key: 'admin.payments.transactions.refund.reasonPlaceholder',
    en: 'Enter reason for refund...',
    he: 'הזן סיבה להחזר...'
  },
  {
    key: 'admin.payments.transactions.refund.fullAlert',
    en: 'This will refund the full amount to the customer',
    he: 'פעולה זו תחזיר את הסכום המלא ללקוח'
  },
  {
    key: 'admin.payments.transactions.refund.partialAlert',
    en: 'This will refund the specified amount to the customer',
    he: 'פעולה זו תחזיר את הסכום המצוין ללקוח'
  },
  {
    key: 'admin.payments.transactions.refund.processButton',
    en: 'Process Refund',
    he: 'בצע החזר'
  },
  {
    key: 'admin.payments.transactions.refund.success',
    en: 'Refund processed successfully',
    he: 'ההחזר בוצע בהצלחה'
  },
  {
    key: 'admin.payments.transactions.refund.error',
    en: 'Failed to process refund',
    he: 'נכשל בעיבוד ההחזר'
  },
  {
    key: 'admin.payments.transactions.refundedAmount',
    en: 'Refunded',
    he: 'הוחזר'
  },
  // Status translations
  {
    key: 'admin.payments.transactions.status.completed',
    en: 'Completed',
    he: 'הושלם'
  },
  {
    key: 'admin.payments.transactions.status.pending',
    en: 'Pending',
    he: 'ממתין'
  },
  {
    key: 'admin.payments.transactions.status.failed',
    en: 'Failed',
    he: 'נכשל'
  },
  {
    key: 'admin.payments.transactions.status.refunded',
    en: 'Refunded',
    he: 'הוחזר'
  },
  {
    key: 'admin.payments.transactions.status.partiallyRefunded',
    en: 'Partially Refunded',
    he: 'הוחזר חלקית'
  },
  // Transaction details
  {
    key: 'admin.payments.transactions.details.title',
    en: 'Transaction Details',
    he: 'פרטי עסקה'
  },
  {
    key: 'admin.payments.transactions.details.transactionId',
    en: 'Transaction ID',
    he: 'מזהה עסקה'
  },
  {
    key: 'admin.payments.transactions.details.stripePaymentIntent',
    en: 'Stripe Payment Intent',
    he: 'כוונת תשלום Stripe'
  },
  {
    key: 'admin.payments.transactions.details.failureReason',
    en: 'Failure Reason',
    he: 'סיבת כישלון'
  },
  {
    key: 'admin.payments.transactions.details.metadata',
    en: 'Metadata',
    he: 'מטא-דאטה'
  },
  {
    key: 'admin.payments.transactions.details.close',
    en: 'Close',
    he: 'סגור'
  },
  {
    key: 'admin.payments.transactions.details.metadata.paymentNumber',
    en: 'Payment Number',
    he: 'מספר תשלום'
  },
  {
    key: 'admin.payments.transactions.details.metadata.paymentType',
    en: 'Payment Type',
    he: 'סוג תשלום'
  },
  {
    key: 'admin.payments.transactions.details.metadata.paidDate',
    en: 'Paid Date',
    he: 'תאריך תשלום'
  },
  {
    key: 'admin.payments.transactions.details.metadata.scheduledDate',
    en: 'Scheduled Date',
    he: 'תאריך מתוכנן'
  },
  {
    key: 'admin.payments.transactions.details.metadata.enrollmentId',
    en: 'Enrollment ID',
    he: 'מזהה הרשמה'
  },
  {
    key: 'admin.payments.transactions.details.metadata.scheduleId',
    en: 'Schedule ID',
    he: 'מזהה לוח זמנים'
  }
];

async function addTranslations() {
  try {
    console.log('🚀 Adding refund translations...\n');

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
        context: 'admin',
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
        context: 'admin',
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
