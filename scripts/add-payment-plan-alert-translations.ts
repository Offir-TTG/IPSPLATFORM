import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  {
    key: 'products.payment_plans.users_can_choose',
    en: 'Users will be able to choose from {count} payment plan(s) at checkout.',
    he: 'משתמשים יוכלו לבחור מתוך {count} תוכניות תשלום בעת התשלום.'
  },
  {
    key: 'products.payment_plans.auto_enrolled',
    en: 'Users will be automatically enrolled with the default payment plan.',
    he: 'משתמשים יירשמו אוטומטית עם תוכנית התשלום ברירת המחדל.'
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

    console.log('Adding payment plan alert translations...\n');

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
