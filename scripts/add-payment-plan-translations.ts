import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Payment plan description translations
  {
    key: 'products.payment_plans.description.one_time',
    en: 'One-time payment',
    he: 'תשלום חד פעמי'
  },
  {
    key: 'products.payment_plans.description.deposit',
    en: '{percentage}% deposit',
    he: '{percentage}% מקדמה'
  },
  {
    key: 'products.payment_plans.description.installments',
    en: '{count} {frequency} installments',
    he: '{count} תשלומים {frequency}'
  },
  {
    key: 'products.payment_plans.description.subscription',
    en: 'Subscription',
    he: 'מנוי'
  },
  // Frequency translations for installments
  {
    key: 'products.payment_plans.frequency.monthly',
    en: 'monthly',
    he: 'חודשיים'
  },
  {
    key: 'products.payment_plans.frequency.weekly',
    en: 'weekly',
    he: 'שבועיים'
  },
  {
    key: 'products.payment_plans.frequency.yearly',
    en: 'yearly',
    he: 'שנתיים'
  },
  // Save button states
  {
    key: 'common.saving',
    en: 'Saving...',
    he: 'שומר...'
  },
  {
    key: 'common.creating',
    en: 'Creating...',
    he: 'יוצר...'
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

    console.log('Adding payment plan and save button translations...\n');

    for (const { key, en, he } of translations) {
      console.log(`Adding translation for: ${key}`);

      // Determine category and context from key
      const parts = key.split('.');
      const category = parts[0]; // e.g., 'products' or 'common'
      const context = 'admin'; // All these translations are for admin context

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
