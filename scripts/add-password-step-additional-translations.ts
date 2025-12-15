/**
 * Add Additional Password Step Translations for Enrollment Wizard
 *
 * This script adds missing Hebrew translations for hardcoded strings
 * in the password step (placeholders, validation messages, requirements)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const additionalTranslations = [
  // Placeholders
  {
    key: 'enrollment.wizard.password.placeholder',
    en: 'Enter a secure password (min. 8 characters)',
    he: 'הזן סיסמה מאובטחת (לפחות 8 תווים)'
  },
  {
    key: 'enrollment.wizard.password.confirm.placeholder',
    en: 'Re-enter your password',
    he: 'הזן שוב את הסיסמה שלך'
  },
  // Validation messages
  {
    key: 'enrollment.wizard.password.min_length',
    en: 'Password must be at least 8 characters long',
    he: 'הסיסמה חייבת להכיל לפחות 8 תווים'
  },
  {
    key: 'enrollment.wizard.password.mismatch',
    en: 'Passwords do not match',
    he: 'הסיסמאות אינן תואמות'
  },
  // Requirements section
  {
    key: 'enrollment.wizard.password.requirements.title',
    en: 'Password requirements:',
    he: 'דרישות סיסמה:'
  },
  {
    key: 'enrollment.wizard.password.requirements.min_chars',
    en: 'At least 8 characters long',
    he: 'לפחות 8 תווים'
  },
  {
    key: 'enrollment.wizard.password.requirements.mix',
    en: 'Mix of letters and numbers recommended',
    he: 'מומלץ שילוב של אותיות ומספרים'
  },
  {
    key: 'enrollment.wizard.password.requirements.avoid',
    en: 'Avoid common words or patterns',
    he: 'הימנע ממילים או תבניות נפוצות'
  }
];

async function addAdditionalTranslations() {
  console.log('🔐 Adding additional password step translations...\n');

  for (const translation of additionalTranslations) {
    console.log(`Adding: ${translation.key}`);

    // Check if translation already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', translation.key)
      .eq('tenant_id', null);

    if (existing && existing.length > 0) {
      console.log(`  ⚠️  Translation already exists, deleting old versions...`);
      await supabase
        .from('translations')
        .delete()
        .eq('translation_key', translation.key)
        .eq('tenant_id', null);
    }

    // Insert English version
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: 'user',
        tenant_id: null
      });

    if (enError) {
      console.error(`  ❌ Error adding English: ${enError.message}`);
    } else {
      console.log(`  ✅ English: "${translation.en}"`);
    }

    // Insert Hebrew version
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: 'user',
        tenant_id: null
      });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew: ${heError.message}`);
    } else {
      console.log(`  ✅ Hebrew: "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ Additional password step translations added successfully!');
}

addAdditionalTranslations().catch(console.error);
