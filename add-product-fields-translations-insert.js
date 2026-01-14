require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  { key: 'products.completion_benefit', en: 'Completion Benefit', he: 'מה מקבלים בסיום' },
  { key: 'products.completion_benefit_placeholder', en: 'e.g., Certificate, Digital Badge', he: 'למשל: תעודה, תג דיגיטלי' },
  { key: 'products.completion_benefit_desc', en: 'What users receive upon completing the product', he: 'מה המשתמשים מקבלים בסיום המוצר' },
  { key: 'products.access_duration', en: 'Access Duration', he: 'משך זמן הגישה' },
  { key: 'products.access_duration_placeholder', en: 'e.g., Lifetime access, 1 year', he: 'למשל: גישה לכל החיים, שנה אחת' },
  { key: 'products.access_duration_desc', en: 'How long users have access to the content', he: 'כמה זמן למשתמשים יש גישה לתוכן' },
];

async function addTranslations() {
  console.log('Adding product field translations...\n');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    // Insert English
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: 'admin',
      });

    if (enError && !enError.message.includes('duplicate')) {
      console.error(`Error EN ${translation.key}:`, enError.message);
    } else {
      console.log(`✓ EN: ${translation.key}`);
    }

    // Insert Hebrew
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: 'admin',
      });

    if (heError && !heError.message.includes('duplicate')) {
      console.error(`Error HE ${translation.key}:`, heError.message);
    } else {
      console.log(`✓ HE: ${translation.key}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

addTranslations();
