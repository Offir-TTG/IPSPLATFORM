const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'emails.settings.description',
    context: 'admin',
    en: 'Configure email template categories and badge colors',
    he: 'הגדר קטגוריות של תבניות דוא"ל וצבעי תגים'
  },
  {
    key: 'emails.settings.preview.title',
    context: 'admin',
    en: 'Category Preview',
    he: 'תצוגה מקדימה של קטגוריות'
  },
  {
    key: 'emails.settings.preview.description',
    context: 'admin',
    en: 'Preview how your category badges will appear',
    he: 'צפה כיצד יופיעו תגי הקטגוריות שלך'
  },
  {
    key: 'emails.settings.categories.title',
    context: 'admin',
    en: 'Template Categories',
    he: 'קטגוריות תבניות'
  },
  {
    key: 'emails.settings.categories.description',
    context: 'admin',
    en: 'Define categories for organizing email templates with custom labels and colors',
    he: 'הגדר קטגוריות לארגון תבניות דוא"ל עם תוויות וצבעים מותאמים אישית'
  },
  {
    key: 'emails.settings.categories.value',
    context: 'admin',
    en: 'Category Key',
    he: 'מפתח קטגוריה'
  },
  {
    key: 'emails.settings.categories.label_en',
    context: 'admin',
    en: 'English Label',
    he: 'תווית באנגלית'
  },
  {
    key: 'emails.settings.categories.label_he',
    context: 'admin',
    en: 'Hebrew Label',
    he: 'תווית בעברית'
  },
  {
    key: 'emails.settings.categories.color',
    context: 'admin',
    en: 'Badge Color',
    he: 'צבע תג'
  }
];

async function addTranslations() {
  console.log('🔍 Finding tenant...');

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Error finding tenant:', tenantError);
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);
  console.log(`📝 Adding ${translations.length} email settings translations...\n`);

  let added = 0;
  let skipped = 0;

  for (const translation of translations) {
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .eq('context', translation.context);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping existing: ${translation.key}`);
      skipped++;
      continue;
    }

    const { error: enError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: translation.context,
      });

    if (enError) {
      console.error(`❌ Error adding EN translation for ${translation.key}:`, enError);
      continue;
    }

    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: translation.context,
      });

    if (heError) {
      console.error(`❌ Error adding HE translation for ${translation.key}:`, heError);
      continue;
    }

    console.log(`✅ Added: ${translation.key}`);
    console.log(`   EN: ${translation.en}`);
    console.log(`   HE: ${translation.he}\n`);
    added += 2;
  }

  console.log(`\n✨ Done!`);
  console.log(`📊 Added: ${added} translations`);
  console.log(`⏭️  Skipped: ${skipped} existing translations`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
