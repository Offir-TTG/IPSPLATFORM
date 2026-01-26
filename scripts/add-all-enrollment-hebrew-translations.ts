/**
 * Add all Hebrew translations for enrollment system
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
  context: string;
}

const translations: Translation[] = [
  // Enrollment preview page translations
  {
    key: 'enrollment.paymentPlan.multiplePlans',
    en: 'Multiple payment plans available',
    he: 'תוכניות תשלום מרובות זמינות',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.oneTime',
    en: 'One-time payment',
    he: 'תשלום חד פעמי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.free',
    en: 'Free',
    he: 'חינם',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.deposit',
    en: 'Deposit',
    he: 'מקדמה',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.installmentsOf',
    en: 'installments of',
    he: 'תשלומים של',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.subscriptionText',
    en: 'Subscription',
    he: 'מנוי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.frequency.weekly',
    en: 'Weekly',
    he: 'שבועי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.frequency.biweekly',
    en: 'Bi-weekly',
    he: 'דו-שבועי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.frequency.monthly',
    en: 'Monthly',
    he: 'חודשי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.interval.weekly',
    en: 'Weekly',
    he: 'שבועי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.interval.monthly',
    en: 'Monthly',
    he: 'חודשי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.paymentPlan.interval.yearly',
    en: 'Yearly',
    he: 'שנתי',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.pricing.totalAmount',
    en: 'Total Amount',
    he: 'סכום כולל',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.pricing.paymentPlan',
    en: 'Payment Plan',
    he: 'תוכנית תשלום',
    category: 'enrollment',
    context: 'admin'
  },
  {
    key: 'enrollment.pricing.free',
    en: '🎉 This enrollment is completely free!',
    he: '🎉 ההרשמה הזו חינמית לחלוטין!',
    category: 'enrollment',
    context: 'admin'
  },
  // Admin payment plan details translations
  {
    key: 'admin.enrollments.paymentPlanDetails.multiplePlans',
    en: 'Multiple payment plans available',
    he: 'תוכניות תשלום מרובות זמינות',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.availablePlans',
    en: 'Available Payment Plans',
    he: 'תוכניות תשלום זמינות',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.selected',
    en: 'Selected',
    he: 'נבחר',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.depositLabel',
    en: 'Deposit',
    he: 'מקדמה',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.installments',
    en: 'installments',
    he: 'תשלומים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.subscription',
    en: 'Subscription',
    he: 'מנוי',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.paymentModel',
    en: 'Payment Model',
    he: 'מודל תשלום',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.depositThenPlan',
    en: 'Deposit + Installments',
    he: 'מקדמה + תשלומים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.recurring',
    en: 'Recurring Payments',
    he: 'תשלומים חוזרים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.numberOfInstallments',
    en: 'Number of Installments',
    he: 'מספר תשלומים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.fullPayment',
    en: 'Full Payment',
    he: 'תשלום מלא',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.depositPayment',
    en: 'Deposit',
    he: 'מקדמה',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.installment',
    en: 'Installment',
    he: 'תשלום',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.payment',
    en: 'Payment',
    he: 'תשלום',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.paymentSchedule',
    en: 'Payment Schedule',
    he: 'לוח תשלומים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.noScheduleInfo',
    en: 'Payment schedule information not available.',
    he: 'מידע על לוח התשלומים אינו זמין.',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.status.paid',
    en: 'Paid',
    he: 'שולם',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.status.pending',
    en: 'Pending',
    he: 'ממתין',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.status.overdue',
    en: 'Overdue',
    he: 'באיחור',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlanDetails.status.cancelled',
    en: 'Cancelled',
    he: 'בוטל',
    category: 'admin',
    context: 'admin'
  },
  // Payment plan frequency translations
  {
    key: 'admin.enrollments.paymentPlan.frequency.weekly',
    en: 'Weekly Installments',
    he: 'תשלומים שבועיים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlan.frequency.biweekly',
    en: 'Bi-weekly Installments',
    he: 'תשלומים דו-שבועיים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlan.frequency.monthly',
    en: 'Monthly Installments',
    he: 'תשלומים חודשיים',
    category: 'admin',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.paymentPlan.frequency.custom',
    en: 'Custom Frequency',
    he: 'תדירות מותאמת אישית',
    category: 'admin',
    context: 'admin'
  },
  // Common translations
  {
    key: 'common.close',
    en: 'Close',
    he: 'סגור',
    category: 'common',
    context: 'admin'
  }
];

async function addTranslations() {
  console.log('Adding all enrollment Hebrew translations...\n');

  // Get the default tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError?.message);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: translation.category,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (enError) {
      console.error(`  ❌ Error adding English translation:`, enError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
      successCount++;
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: translation.category,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew translation:`, heError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
      successCount++;
    }

    console.log('');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Translation process complete!`);
  console.log(`   Success: ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} translations`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

addTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
