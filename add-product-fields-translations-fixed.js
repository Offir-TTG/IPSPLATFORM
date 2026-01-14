require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Product form fields
  { key: 'products.completion_benefit', en: 'Completion Benefit', he: 'מה מקבלים בסיום' },
  { key: 'products.completion_benefit_placeholder', en: 'e.g., Certificate, Digital Badge', he: 'למשל: תעודה, תג דיגיטלי' },
  { key: 'products.completion_benefit_desc', en: 'What users receive upon completing the product', he: 'מה המשתמשים מקבלים בסיום המוצר' },
  
  { key: 'products.access_duration', en: 'Access Duration', he: 'משך זמן הגישה' },
  { key: 'products.access_duration_placeholder', en: 'e.g., Lifetime access, 1 year', he: 'למשל: גישה לכל החיים, שנה אחת' },
  { key: 'products.access_duration_desc', en: 'How long users have access to the content', he: 'כמה זמן למשתמשים יש גישה לתוכן' },
];

async function addTranslations() {
  console.log('Adding product field translations...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    // Add English translation
    const { error: enError } = await supabase
      .from('translations')
      .upsert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: 'admin',
      }, {
        onConflict: 'tenant_id,translation_key,language_code,context'
      });

    if (enError) {
      console.error(`Error adding EN translation for ${translation.key}:`, enError);
    } else {
      console.log(`✓ Added EN: ${translation.key} = "${translation.en}"`);
    }

    // Add Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .upsert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: 'admin',
      }, {
        onConflict: 'tenant_id,translation_key,language_code,context'
      });

    if (heError) {
      console.error(`Error adding HE translation for ${translation.key}:`, heError);
    } else {
      console.log(`✓ Added HE: ${translation.key} = "${translation.he}"`);
    }
  }

  console.log('\n✅ All translations added successfully!');
  process.exit(0);
}

addTranslations();
