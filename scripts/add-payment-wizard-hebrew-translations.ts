import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Translation {
  key: string;
  en: string;
  he: string;
  context: string;
  category: string;
}

const translations: Translation[] = [
  // Payment Summary Section
  {
    key: 'user.payments.checkout.summary',
    en: 'Payment Summary',
    he: 'סיכום תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.saveCard',
    en: 'Save Payment Method',
    he: 'שמירת אמצעי תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.reviewDetails',
    en: 'Review your payment details',
    he: 'עיין בפרטי התשלום שלך',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.saveCardDescription',
    en: 'Save your payment method for future automatic payments',
    he: 'שמור את אמצעי התשלום שלך לתשלומים אוטומטיים עתידיים',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.course',
    en: 'Course',
    he: 'קורס',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.paymentPlan',
    en: 'Payment Plan',
    he: 'תוכנית תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.changePlan',
    en: 'Change Plan',
    he: 'שנה תוכנית',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.parentSummary',
    en: 'Payment Information',
    he: 'מידע על התשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.totalAmount',
    en: 'Total Amount',
    he: 'סכום כולל',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.numberOfPayments',
    en: 'Number of Payments',
    he: 'מספר תשלומים',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.paymentType',
    en: 'Payment Type',
    he: 'סוג תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.paymentNumber',
    en: 'Payment Number',
    he: 'מספר תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.paymentBreakdown',
    en: 'Payment Breakdown',
    he: 'פירוט תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.dueToday',
    en: 'Due Today (Deposit)',
    he: 'לתשלום היום (מקדמה)',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.totalProgramCost',
    en: 'Total Program Cost',
    he: 'עלות התוכנית הכוללת',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.remainingBalance',
    en: 'Remaining Balance',
    he: 'יתרה נותרת',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.monthlyPayment',
    en: 'Monthly Payment',
    he: 'תשלום חודשי',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.installmentInfo',
    en: '{{count}} {{frequency}} payments of {{amount}} each',
    he: '{{count}} תשלומים {{frequency}} של {{amount}} כל אחד',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.noChargeNow',
    en: 'No charge will be made now. Your card will be saved for future scheduled payments.',
    he: 'לא יתבצע חיוב כעת. הכרטיס שלך יישמר לתשלומים מתוזמנים עתידיים.',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.amountDue',
    en: 'Amount Due Now',
    he: 'סכום לתשלום כעת',
    context: 'user',
    category: 'payments',
  },

  // Payment Form Section
  {
    key: 'user.payments.checkout.cardDetails',
    en: 'Card Details',
    he: 'פרטי כרטיס',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.paymentMethod',
    en: 'Payment Method',
    he: 'אמצעי תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.securePayment',
    en: 'Secure payment powered by Stripe',
    he: 'תשלום מאובטח באמצעות Stripe',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.preparingForm',
    en: 'Preparing form...',
    he: 'מכין טופס...',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.preparingPayment',
    en: 'Preparing payment...',
    he: 'מכין תשלום...',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.securityNotice',
    en: 'Secured by Stripe • PCI-DSS Compliant',
    he: 'מאובטח על ידי Stripe • תואם PCI-DSS',
    context: 'user',
    category: 'payments',
  },

  // Success Messages
  {
    key: 'user.payments.checkout.cardSaved',
    en: 'Card Saved Successfully!',
    he: 'הכרטיס נשמר בהצלחה!',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.success',
    en: 'Payment Successful!',
    he: 'התשלום בוצע בהצלחה!',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.cardSavedDesc',
    en: 'Your payment method has been saved for future payments.',
    he: 'אמצעי התשלום שלך נשמר לתשלומים עתידיים.',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.successDesc',
    en: 'Your payment has been processed successfully.',
    he: 'התשלום שלך עובד בהצלחה.',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.redirecting',
    en: 'Redirecting...',
    he: 'מעביר...',
    context: 'user',
    category: 'payments',
  },

  // Navigation
  {
    key: 'user.payments.checkout.back',
    en: 'Back',
    he: 'חזרה',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'wizard.backToWizard',
    en: 'Back to Enrollment Wizard',
    he: 'חזרה לאשף ההרשמה',
    context: 'user',
    category: 'enrollment',
  },

  // Loading States
  {
    key: 'user.payments.checkout.processingParentEnrollment',
    en: 'Processing enrollment...',
    he: 'מעבד הרשמה...',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.loading',
    en: 'Loading payment information...',
    he: 'טוען מידע תשלום...',
    context: 'user',
    category: 'payments',
  },

  // Error Messages
  {
    key: 'user.payments.checkout.infoNotFound',
    en: 'Payment information not found',
    he: 'מידע תשלום לא נמצא',
    context: 'user',
    category: 'payments',
  },

  // Payment Types
  {
    key: 'user.payments.paymentType.deposit',
    en: 'Deposit',
    he: 'מקדמה',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.paymentType.installment',
    en: 'Installment',
    he: 'תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.paymentType.subscription',
    en: 'Subscription',
    he: 'מנוי',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.paymentType.full',
    en: 'Full Payment',
    he: 'תשלום מלא',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.paymentType.oneTime',
    en: 'One-Time Payment',
    he: 'תשלום חד פעמי',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.paymentType.unknown',
    en: 'Unknown',
    he: 'לא ידוע',
    context: 'user',
    category: 'payments',
  },

  // Frequency Types (for installment info)
  {
    key: 'user.payments.frequency.monthly',
    en: 'monthly',
    he: 'חודשיים',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.frequency.weekly',
    en: 'weekly',
    he: 'שבועיים',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.frequency.yearly',
    en: 'yearly',
    he: 'שנתיים',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.frequency.quarterly',
    en: 'quarterly',
    he: 'רבעוניים',
    context: 'user',
    category: 'payments',
  },

  // Charging Messages (for saved card charging)
  {
    key: 'user.payments.checkout.chargingCard',
    en: 'Charging your card...',
    he: 'מחייב את הכרטיס שלך...',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.cardCharged',
    en: 'Card charged successfully',
    he: 'הכרטיס חויב בהצלחה',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.chargeFailed',
    en: 'Failed to charge card',
    he: 'נכשל בחיוב הכרטיס',
    context: 'user',
    category: 'payments',
  },
];

async function addTranslations() {
  console.log('🌐 Adding Payment Wizard Hebrew Translations\n');
  console.log('='.repeat(60));

  try {
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
        console.error(`  ❌ Error adding English:`, enError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Added English: "${translation.en}"`);
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
        console.error(`  ❌ Error adding Hebrew:`, heError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Added Hebrew: "${translation.he}"`);
        successCount++;
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ Translation process completed!`);
    console.log(`   Total translations: ${translations.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('');

    if (errorCount === 0) {
      console.log('🎉 All payment wizard translations added successfully!');
    } else {
      console.warn(`⚠️  ${errorCount} translations had errors. Please review above.`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations().then(() => process.exit(0));
