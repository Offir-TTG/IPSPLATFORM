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
  {
    key: 'payments.savedCard.title',
    en: 'Payment Method',
    he: 'אמצעי תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'payments.savedCard.expires',
    en: 'Expires',
    he: 'תוקף',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'payments.savedCard.saved',
    en: 'Saved',
    he: 'שמור',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'payments.savedCard.autoChargeNotice',
    en: 'Your saved card will be charged automatically on payment due dates.',
    he: 'הכרטיס השמור שלך יחויב אוטומטית בתאריכי התשלום.',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'payments.savedCard.useCard',
    en: 'Use This Card',
    he: 'השתמש בכרטיס זה',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'payments.savedCard.updateCard',
    en: 'Update Payment Method',
    he: 'עדכן אמצעי תשלום',
    context: 'user',
    category: 'payments',
  },
  {
    key: 'user.payments.checkout.checkingCard',
    en: 'Checking payment method...',
    he: 'בודק אמצעי תשלום...',
    context: 'user',
    category: 'payments',
  },
];

async function addTranslations() {
  console.log('🌐 Adding saved card UI Hebrew translations\n');
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
      } else {
        console.log(`  ✅ Added Hebrew: "${translation.he}"`);
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ All saved card UI translations added successfully!');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations().then(() => process.exit(0));
