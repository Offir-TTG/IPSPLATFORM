import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  {
    key: 'products.payment_plans.available_plans',
    en: 'Available Payment Plans',
    he: 'תוכניות תשלום זמינות'
  },
  {
    key: 'products.payment_plans.available_plans_desc',
    en: 'Select which payment plans users can choose from for this product',
    he: 'בחר אילו תוכניות תשלום משתמשים יכולים לבחור עבור מוצר זה'
  },
  {
    key: 'products.payment_plans.default_badge',
    en: 'Default',
    he: 'ברירת מחדל'
  },
  {
    key: 'products.payment_plans.set_as_default',
    en: 'Set as default',
    he: 'הגדר כברירת מחדל'
  },
  {
    key: 'products.payment_plans.select_at_least_one',
    en: 'Please select at least one payment plan',
    he: 'אנא בחר לפחות תוכנית תשלום אחת'
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

    console.log('Adding plan selector translations...\n');

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
