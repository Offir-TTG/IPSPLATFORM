import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translationKeys = [
  // Navigation Sections
  { translation_key: 'admin.nav.overview', context: 'admin', description: 'Overview section title in navigation', category: 'admin' },
  { translation_key: 'admin.nav.configuration', context: 'admin', description: 'Configuration section title in navigation', category: 'admin' },
  { translation_key: 'admin.nav.content', context: 'admin', description: 'Content section title in navigation', category: 'admin' },
  { translation_key: 'admin.nav.business', context: 'admin', description: 'Business section title in navigation', category: 'admin' },

  // Navigation Items
  { translation_key: 'admin.nav.dashboard', context: 'admin', description: 'Dashboard navigation link', category: 'admin' },
  { translation_key: 'admin.nav.languages', context: 'admin', description: 'Languages navigation link', category: 'admin' },
  { translation_key: 'admin.nav.translations', context: 'admin', description: 'Translations navigation link', category: 'admin' },
  { translation_key: 'admin.nav.settings', context: 'admin', description: 'Settings navigation link', category: 'admin' },
  { translation_key: 'admin.nav.theme', context: 'admin', description: 'Theme navigation link', category: 'admin' },
  { translation_key: 'admin.nav.features', context: 'admin', description: 'Features navigation link', category: 'admin' },
  { translation_key: 'admin.nav.integrations', context: 'admin', description: 'Integrations navigation link', category: 'admin' },
  { translation_key: 'admin.nav.navigation', context: 'admin', description: 'Navigation navigation link', category: 'admin' },
  { translation_key: 'admin.nav.programs', context: 'admin', description: 'Programs navigation link', category: 'admin' },
  { translation_key: 'admin.nav.courses', context: 'admin', description: 'Courses navigation link', category: 'admin' },
  { translation_key: 'admin.nav.users', context: 'admin', description: 'Users navigation link', category: 'admin' },
  { translation_key: 'admin.nav.payments', context: 'admin', description: 'Payments navigation link', category: 'admin' },
  { translation_key: 'admin.nav.emails', context: 'admin', description: 'Emails navigation link', category: 'admin' },
];

const hebrewTranslations = [
  // Navigation Sections
  { language_code: 'he', translation_key: 'admin.nav.overview', translation_value: 'סקירה כללית', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.configuration', translation_value: 'תצורה', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.content', translation_value: 'תוכן', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.business', translation_value: 'עסקים', context: 'admin', category: 'admin' },

  // Navigation Items
  { language_code: 'he', translation_key: 'admin.nav.dashboard', translation_value: 'לוח בקרה', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.languages', translation_value: 'שפות', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.translations', translation_value: 'תרגומים', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.settings', translation_value: 'הגדרות', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.theme', translation_value: 'ערכת נושא ועיצוב', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.features', translation_value: 'תכונות', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.integrations', translation_value: 'אינטגרציות', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.navigation', translation_value: 'ניווט', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.programs', translation_value: 'תוכניות', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.courses', translation_value: 'קורסים', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.users', translation_value: 'משתמשים', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.payments', translation_value: 'תשלומים', context: 'admin', category: 'admin' },
  { language_code: 'he', translation_key: 'admin.nav.emails', translation_value: 'מיילים', context: 'admin', category: 'admin' },
];

const englishTranslations = [
  // Navigation Sections
  { language_code: 'en', translation_key: 'admin.nav.overview', translation_value: 'Overview', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.configuration', translation_value: 'Configuration', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.content', translation_value: 'Content', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.business', translation_value: 'Business', context: 'admin', category: 'admin' },

  // Navigation Items
  { language_code: 'en', translation_key: 'admin.nav.dashboard', translation_value: 'Dashboard', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.languages', translation_value: 'Languages', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.translations', translation_value: 'Translations', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.settings', translation_value: 'Settings', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.theme', translation_value: 'Theme & Design', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.features', translation_value: 'Features', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.integrations', translation_value: 'Integrations', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.navigation', translation_value: 'Navigation', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.programs', translation_value: 'Programs', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.courses', translation_value: 'Courses', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.users', translation_value: 'Users', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.payments', translation_value: 'Payments', context: 'admin', category: 'admin' },
  { language_code: 'en', translation_key: 'admin.nav.emails', translation_value: 'Emails', context: 'admin', category: 'admin' },
];

async function main() {
  console.log('Adding navigation translation keys and translations...\n');

  // Step 1: Add translation keys
  console.log('Step 1: Adding translation keys...');
  const { data: keysData, error: keysError } = await supabase
    .from('translation_keys')
    .upsert(translationKeys, { onConflict: 'translation_key', ignoreDuplicates: false });

  if (keysError) {
    console.error('Error adding translation keys:', keysError);
    process.exit(1);
  }
  console.log(`✓ Added/updated ${translationKeys.length} translation keys\n`);

  // Step 2: Add Hebrew translations
  console.log('Step 2: Adding Hebrew translations...');
  const { data: heData, error: heError } = await supabase
    .from('translations')
    .upsert(hebrewTranslations, { onConflict: 'language_code,translation_key', ignoreDuplicates: false });

  if (heError) {
    console.error('Error adding Hebrew translations:', heError);
    process.exit(1);
  }
  console.log(`✓ Added/updated ${hebrewTranslations.length} Hebrew translations\n`);

  // Step 3: Add English translations
  console.log('Step 3: Adding English translations...');
  const { data: enData, error: enError } = await supabase
    .from('translations')
    .upsert(englishTranslations, { onConflict: 'language_code,translation_key', ignoreDuplicates: false });

  if (enError) {
    console.error('Error adding English translations:', enError);
    process.exit(1);
  }
  console.log(`✓ Added/updated ${englishTranslations.length} English translations\n`);

  // Step 4: Verify
  console.log('Step 4: Verifying translations...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'admin.nav.%')
    .order('translation_key, language_code');

  if (verifyError) {
    console.error('Error verifying:', verifyError);
    process.exit(1);
  }

  console.log('\nAll navigation translations:');
  console.table(verifyData);

  console.log('\n✓ All done! Navigation translations have been added successfully.');
  process.exit(0);
}

main();
