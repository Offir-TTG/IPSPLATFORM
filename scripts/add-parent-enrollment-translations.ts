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
}

const translations: Translation[] = [
  // Saved Card Display translations (user context)
  {
    key: 'payments.savedCard.title',
    en: 'Payment Method',
    he: 'אמצעי תשלום',
    context: 'user'
  },
  {
    key: 'payments.savedCard.expires',
    en: 'Expires',
    he: 'תוקף',
    context: 'user'
  },
  {
    key: 'payments.savedCard.saved',
    en: 'Saved',
    he: 'שמור',
    context: 'user'
  },
  {
    key: 'payments.savedCard.autoChargeNotice',
    en: 'Your saved card will be charged automatically on payment due dates.',
    he: 'הכרטיס השמור שלך יחויב אוטומטית בתאריכי התשלום.',
    context: 'user'
  },
  {
    key: 'payments.savedCard.useCard',
    en: 'Use This Card',
    he: 'השתמש בכרטיס זה',
    context: 'user'
  },
  {
    key: 'payments.savedCard.updateCard',
    en: 'Update Payment Method',
    he: 'עדכן אמצעי תשלום',
    context: 'user'
  },

  // Payment page translations (user context)
  {
    key: 'user.payments.checkout.checkingCard',
    en: 'Checking payment method...',
    he: 'בודק אמצעי תשלום...',
    context: 'user'
  },
  {
    key: 'user.payments.checkout.parentSummary',
    en: 'Payment Information',
    he: 'מידע תשלום',
    context: 'user'
  },
  {
    key: 'user.payments.checkout.totalAmount',
    en: 'Total Amount',
    he: 'סכום כולל',
    context: 'user'
  },
  {
    key: 'user.payments.checkout.numberOfPayments',
    en: 'Number of Payments',
    he: 'מספר תשלומים',
    context: 'user'
  },

  // Admin - Create Enrollment Dialog translations (admin context)
  {
    key: 'admin.enrollments.create.isParent',
    en: 'Parent Enrollment',
    he: 'הרשמת הורה',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.create.isParentHelp',
    en: 'Check this if enrollment is for a parent (no dashboard access). User will only get dashboard access when they have at least one non-parent enrollment.',
    he: 'סמן זאת אם ההרשמה היא עבור הורה (ללא גישה לדשבורד). המשתמש יקבל גישה לדשבורד רק כאשר יש לו לפחות הרשמה אחת שאינה של הורה.',
    context: 'admin'
  }
];

async function addParentEnrollmentTranslations() {
  console.log('🌐 Adding Parent Enrollment Feature Translations\n');
  console.log('='.repeat(60));

  let successCount = 0;
  let failureCount = 0;

  for (const translation of translations) {
    console.log(`\n📝 ${translation.key}`);

    try {
      // Check if translation already exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (existing) {
        console.log(`   ⚠️  Already exists, skipping...`);
        continue;
      }

      // Insert English translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: translation.context
        });

      if (enError) {
        console.log(`   ❌ EN failed: ${enError.message}`);
        failureCount++;
        continue;
      }

      // Insert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: translation.context
        });

      if (heError) {
        console.log(`   ❌ HE failed: ${heError.message}`);
        failureCount++;
        continue;
      }

      console.log(`   ✅ EN: ${translation.en}`);
      console.log(`   ✅ HE: ${translation.he}`);
      successCount++;

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Total: ${translations.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Parent enrollment translations added successfully!');
    console.log('\n📝 Features covered:');
    console.log('   1. Saved Card Display - show/update saved payment methods');
    console.log('   2. Parent Payment Summary - simplified payment info');
    console.log('   3. Admin Parent Checkbox - mark enrollments as parent');
    console.log('\n💡 Usage:');
    console.log('   - Saved cards show in payment step with Hebrew text');
    console.log('   - Parent enrollments display simplified summary');
    console.log('   - Admin can mark enrollments as "הרשמת הורה"');
  }
}

addParentEnrollmentTranslations().then(() => process.exit(0));
