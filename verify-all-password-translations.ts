import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All translation keys used in the password step
const requiredKeys = [
  'enrollment.wizard.password.title',
  'enrollment.wizard.password.description',
  'enrollment.wizard.password.info',
  'enrollment.wizard.password.label',
  'enrollment.wizard.password.confirm',
  'enrollment.wizard.password.creating',
  'enrollment.wizard.password.button',
  'enrollment.wizard.password.placeholder',
  'enrollment.wizard.password.confirm.placeholder',
  'enrollment.wizard.password.min_length',
  'enrollment.wizard.password.mismatch',
  'enrollment.wizard.password.requirements.title',
  'enrollment.wizard.password.requirements.min_chars',
  'enrollment.wizard.password.requirements.mix',
  'enrollment.wizard.password.requirements.avoid',
  'enrollment.wizard.steps.password'
];

async function verifyTranslations() {
  console.log('🔍 Verifying all password step translations...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .or('translation_key.like.enrollment.wizard.password%,translation_key.eq.enrollment.wizard.steps.password')
    .is('tenant_id', null)
    .order('translation_key')
    .order('language_code');

  if (error) {
    console.error('❌ Error fetching translations:', error);
    return;
  }

  // Group by key
  const byKey: Record<string, { en?: string, he?: string }> = {};
  for (const row of data) {
    if (!byKey[row.translation_key]) {
      byKey[row.translation_key] = {};
    }
    byKey[row.translation_key][row.language_code as 'en' | 'he'] = row.translation_value;
  }

  // Check for missing translations
  const missing: string[] = [];
  const incomplete: string[] = [];

  for (const key of requiredKeys) {
    if (!byKey[key]) {
      missing.push(key);
    } else if (!byKey[key].en || !byKey[key].he) {
      incomplete.push(key);
    }
  }

  if (missing.length > 0) {
    console.log('❌ Missing translation keys:');
    missing.forEach(k => console.log(`  - ${k}`));
    console.log('');
  }

  if (incomplete.length > 0) {
    console.log('⚠️  Incomplete translations (missing en or he):');
    incomplete.forEach(k => {
      const langs = byKey[k];
      console.log(`  - ${k}: ${langs.en ? '✓ en' : '✗ en'}, ${langs.he ? '✓ he' : '✗ he'}`);
    });
    console.log('');
  }

  if (missing.length === 0 && incomplete.length === 0) {
    console.log('✅ All password step translations are complete!\n');
    console.log(`Total: ${requiredKeys.length} keys × 2 languages = ${requiredKeys.length * 2} translations\n`);

    // Show summary
    console.log('📋 Summary:');
    requiredKeys.forEach(key => {
      console.log(`\n${key}:`);
      console.log(`  [en] ${byKey[key].en}`);
      console.log(`  [he] ${byKey[key].he}`);
    });
  } else {
    console.log(`❌ Found ${missing.length} missing keys and ${incomplete.length} incomplete keys`);
  }
}

verifyTranslations().catch(console.error);
