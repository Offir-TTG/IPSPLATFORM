import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslations() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Adding payment schedules filter translations...\n');

  const translations = [
    // User search filter
    { key: 'admin.payments.schedules.searchUser', en: 'Search User', he: 'חיפוש משתמש' },
    { key: 'admin.payments.schedules.searchUserPlaceholder', en: 'Name or email...', he: 'שם או אימייל...' },

    // Product filter
    { key: 'admin.payments.schedules.product', en: 'Product', he: 'מוצר' },
    { key: 'common.allProducts', en: 'All Products', he: 'כל המוצרים' },

    // Amount filters
    { key: 'admin.payments.schedules.minAmount', en: 'Min Amount', he: 'סכום מינימלי' },
    { key: 'admin.payments.schedules.maxAmount', en: 'Max Amount', he: 'סכום מקסימלי' },
  ];

  for (const translation of translations) {
    // English
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error(`Error adding EN for ${translation.key}:`, enError);
    } else {
      console.log(`✓ Added EN: ${translation.key} = "${translation.en}"`);
    }

    // Hebrew
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error(`Error adding HE for ${translation.key}:`, heError);
    } else {
      console.log(`✓ Added HE: ${translation.key} = "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ All filter translations added successfully!');
}

addTranslations().catch(console.error);
