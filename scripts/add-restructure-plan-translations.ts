/**
 * Add Restructure Plan Translations
 * Adds translation keys for the payment plan restructuring feature
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Dialog titles and descriptions
  {
    key: 'admin.payments.schedules.restructurePlan',
    en: 'Restructure Plan',
    he: 'שינוי מבנה תוכנית',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.restructurePaymentPlan',
    en: 'Restructure Payment Plan',
    he: 'שינוי מבנה תוכנית תשלומים',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.restructureDescription',
    en: 'Change the number of installments for this enrollment',
    he: 'שינוי מספר התשלומים עבור רישום זה',
    category: 'admin',
    context: 'admin',
  },

  // Current status section
  {
    key: 'admin.payments.schedules.currentStatus',
    en: 'Current Status',
    he: 'מצב נוכחי',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.totalPayments',
    en: 'Total Payments',
    he: 'סה"כ תשלומים',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.paidPayments',
    en: 'Paid',
    he: 'שולם',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.pendingPayments',
    en: 'Pending',
    he: 'ממתין',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.remainingBalance',
    en: 'Remaining Balance',
    he: 'יתרה נותרת',
    category: 'admin',
    context: 'admin',
  },

  // Form fields
  {
    key: 'admin.payments.schedules.newNumberOfInstallments',
    en: 'New Number of Installments',
    he: 'מספר תשלומים חדש',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.currentInstallments',
    en: 'Current: {count} installments',
    he: 'נוכחי: {count} תשלומים',
    category: 'admin',
    context: 'admin',
  },

  // Preview section
  {
    key: 'admin.payments.schedules.whatWillHappen',
    en: 'What will happen:',
    he: 'מה יקרה:',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.newInstallmentAmount',
    en: 'Each new installment: {amount}',
    he: 'כל תשלום חדש: {amount}',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.willCancelSchedules',
    en: 'Will cancel {count} pending schedule(s)',
    he: 'יבוטלו {count} תשלומים ממתינים',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.willCreateSchedules',
    en: 'Will create {count} new schedule(s)',
    he: 'ייווצרו {count} תשלומים חדשים',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.paidPaymentsUntouched',
    en: 'Paid payments will not be affected',
    he: 'תשלומים ששולמו לא יושפעו',
    category: 'admin',
    context: 'admin',
  },

  // Reason field
  {
    key: 'admin.payments.schedules.restructureReasonPlaceholder',
    en: 'e.g., User requested payment plan adjustment',
    he: 'לדוגמה: משתמש ביקש התאמת תוכנית תשלומים',
    category: 'admin',
    context: 'admin',
  },

  // Buttons
  {
    key: 'admin.payments.schedules.applyRestructure',
    en: 'Apply Restructure',
    he: 'החל שינוי מבנה',
    category: 'admin',
    context: 'admin',
  },

  // Success/Error messages
  {
    key: 'admin.payments.schedules.restructureSuccess',
    en: 'Payment plan restructured successfully',
    he: 'תוכנית התשלומים שונתה בהצלחה',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.restructureError',
    en: 'Failed to restructure payment plan',
    he: 'שינוי מבנה תוכנית התשלומים נכשל',
    category: 'admin',
    context: 'admin',
  },
];

async function addTranslations() {
  console.log('Adding restructure plan translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;

  for (const trans of translations) {
    // Check if translation already exists for Hebrew
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('language_code', 'he')
      .eq('translation_key', trans.key)
      .maybeSingle();

    if (!existingHe) {
      // Hebrew
      const { error: heError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: trans.key,
        translation_value: trans.he,
        category: trans.category,
        context: trans.context,
      });

      if (!heError) {
        console.log(`✓ ${trans.key} (he): ${trans.he}`);
        added++;
      } else if (!heError.message.includes('duplicate')) {
        console.error(`✗ ${trans.key} (he):`, heError.message);
      }
    } else {
      skipped++;
    }

    // Check if translation already exists for English
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('language_code', 'en')
      .eq('translation_key', trans.key)
      .maybeSingle();

    if (!existingEn) {
      // English
      const { error: enError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: trans.key,
        translation_value: trans.en,
        category: trans.category,
        context: trans.context,
      });

      if (!enError) {
        console.log(`✓ ${trans.key} (en): ${trans.en}`);
        added++;
      } else if (!enError.message.includes('duplicate')) {
        console.error(`✗ ${trans.key} (en):`, enError.message);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Added ${added} new translations`);
  console.log(`⏭️  Skipped ${skipped} existing translations`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
