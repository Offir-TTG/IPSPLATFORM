/**
 * Add "Payment Plan" translation for checkout page
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

async function addTranslation() {
  console.log('Adding payment plan checkout translations...\n');

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

  const translations = [
    {
      key: 'user.payments.checkout.paymentPlan',
      en: 'Payment Plan',
      he: 'תוכנית תשלום'
    },
    {
      key: 'user.payments.checkout.changePlan',
      en: 'Change Plan',
      he: 'שנה תוכנית'
    }
  ];

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: 'user',
      p_context: 'user',
      p_tenant_id: tenantId
    });

    if (enError) {
      console.error(`  ❌ Error adding English translation:`, enError.message);
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: 'user',
      p_context: 'user',
      p_tenant_id: tenantId
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew translation:`, heError.message);
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ All translations added successfully!');
}

addTranslation().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
