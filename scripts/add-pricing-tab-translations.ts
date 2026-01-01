import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  {
    key: 'products.pricing.configuration_title',
    en: 'Payment Configuration',
    he: 'הגדרות תשלום'
  },
  {
    key: 'products.pricing.create_custom',
    en: 'Create Custom Plan',
    he: 'צור תוכנית מותאמת אישית'
  },
  {
    key: 'products.pricing.create_custom_desc',
    en: 'Define payment terms directly for this product',
    he: 'הגדר תנאי תשלום ישירות עבור מוצר זה'
  },
  {
    key: 'products.pricing.use_template',
    en: 'Use Existing Payment Plan Template',
    he: 'השתמש בתבנית תוכנית תשלום קיימת'
  },
  {
    key: 'products.pricing.use_template_desc',
    en: 'Select from pre-configured payment plans',
    he: 'בחר מתוכניות תשלום מוגדרות מראש'
  },
  {
    key: 'products.pricing.payment_type',
    en: 'Payment Type',
    he: 'סוג תשלום'
  },
  {
    key: 'products.pricing.one_time',
    en: 'One-time Payment',
    he: 'תשלום חד פעמי'
  },
  {
    key: 'products.pricing.deposit_installments',
    en: 'Deposit + Installments',
    he: 'מקדמה + תשלומים'
  },
  {
    key: 'products.pricing.subscription',
    en: 'Subscription',
    he: 'מנוי'
  }
];

async function addTranslations() {
  try {
    // Get tenant ID
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('Adding pricing tab translations...\n');

    for (const { key, en, he } of translations) {
      console.log(`Adding translation for: ${key}`);

      const category = 'products';
      const context = 'admin';

      // Add English
      const { error: enError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'en',
        p_translation_key: key,
        p_translation_value: en,
        p_category: category,
        p_context: context,
        p_tenant_id: tenantId,
      });

      if (enError) {
        console.error(`Error adding English translation for ${key}:`, enError);
        continue;
      }

      // Add Hebrew
      const { error: heError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'he',
        p_translation_key: key,
        p_translation_value: he,
        p_category: category,
        p_context: context,
        p_tenant_id: tenantId,
      });

      if (heError) {
        console.error(`Error adding Hebrew translation for ${key}:`, heError);
        continue;
      }

      console.log(`✅ Added translations for ${key}`);
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
