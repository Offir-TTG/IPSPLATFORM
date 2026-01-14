import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All translation keys used in the translations page
const requiredKeys = [
  'admin.translations.title',
  'admin.translations.subtitle',
  'admin.translations.totalKeys',
  'admin.translations.languages',
  'admin.translations.modules',
  'admin.translations.totalTranslations',
  'admin.translations.search',
  'admin.translations.allModules',
  'admin.translations.allLanguages',
  'admin.translations.showing',
  'admin.translations.of',
  'admin.translations.keys',
  'admin.translations.page',
  'admin.translations.key',
  'admin.translations.module',
  'admin.translations.actions',
  'admin.translations.missing',
  'admin.translations.noResults',
  'admin.translations.info.title',
  'admin.translations.info.message',
  'admin.translations.filterByCategory',
  'admin.translations.allCategories',
  'admin.translations.loadFailed',
  'admin.translations.saveFailed',
  'admin.translations.saveSuccess',
  'common.save',
  'common.cancel',
  'common.edit',
  'common.previous',
  'common.next',
  'common.error',
  'common.success',
];

async function verifyTranslations() {
  try {
    console.log('Verifying Hebrew translations for Translations Management Page...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    if (!tenantId) {
      console.error('No tenant found');
      process.exit(1);
    }

    const missingKeys: string[] = [];
    const presentKeys: string[] = [];

    for (const key of requiredKeys) {
      const { data } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (data) {
        presentKeys.push(key);
        console.log(`✓ ${key}: "${data.translation_value}"`);
      } else {
        missingKeys.push(key);
        console.log(`✗ ${key}: MISSING`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total keys checked: ${requiredKeys.length}`);
    console.log(`Present: ${presentKeys.length}`);
    console.log(`Missing: ${missingKeys.length}`);

    if (missingKeys.length > 0) {
      console.log('\nMissing keys:');
      missingKeys.forEach(key => console.log(`  - ${key}`));
      console.log('\n❌ Some Hebrew translations are missing!');
    } else {
      console.log('\n✅ All Hebrew translations are present!');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyTranslations();
