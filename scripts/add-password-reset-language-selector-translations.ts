/**
 * Add Password Reset Language Selector Translations
 * Adds translations for the language selector in password reset dialog
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'admin.users.passwordReset.emailLanguage',
    en: 'Email Language',
    he: 'שפת האימייל'
  },
  {
    key: 'admin.users.passwordReset.english',
    en: 'English',
    he: 'אנגלית'
  },
  {
    key: 'admin.users.passwordReset.hebrew',
    en: 'Hebrew',
    he: 'עברית'
  },
];

async function addTranslations() {
  console.log('🌐 Adding password reset language selector translations...\n');

  // Get all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name');

  if (tenantsError || !tenants || tenants.length === 0) {
    console.error('❌ Error fetching tenants:', tenantsError);
    return;
  }

  for (const tenant of tenants) {
    console.log(`📧 Processing tenant: ${tenant.name}`);

    // Delete existing translations to avoid duplicates
    const translationKeys = translations.map(t => t.key);
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', translationKeys)
      .eq('tenant_id', tenant.id);

    if (deleteError) {
      console.log(`   ⚠️  Warning: Error deleting old translations: ${deleteError.message}`);
    } else {
      console.log('   ✓ Cleaned up existing translations');
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenant.id,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'admin',
      },
      {
        tenant_id: tenant.id,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'admin',
      },
    ]);

    // Insert all translations at once
    const { error: insertError } = await supabase
      .from('translations')
      .insert(translationEntries);

    if (insertError) {
      console.error(`   ❌ Error inserting translations:`, insertError);
    } else {
      console.log(`   ✅ Added ${translationEntries.length} translation entries`);
      translations.forEach(t => {
        console.log(`      • ${t.key}`);
        console.log(`        EN: "${t.en}"`);
        console.log(`        HE: "${t.he}"`);
      });
    }

    console.log('');
  }

  console.log('✨ Translation seeding complete!');
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
