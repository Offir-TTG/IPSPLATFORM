/**
 * Add Password Step Translations for Enrollment Wizard
 *
 * This script adds missing Hebrew translations for the password creation step
 * in the enrollment wizard.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const passwordTranslations = [
  // Password step - title and description
  {
    key: 'enrollment.wizard.password.title',
    en: 'Create Account',
    he: 'יצירת חשבון'
  },
  {
    key: 'enrollment.wizard.password.description',
    en: 'Create a password to secure your account',
    he: 'צור סיסמה לאבטחת החשבון שלך'
  },
  {
    key: 'enrollment.wizard.password.info',
    en: 'Create a secure password for your account. This will be used to log in to your dashboard.',
    he: 'צור סיסמה מאובטחת לחשבון שלך. זו תשמש להתחברות ללוח הבקרה שלך.'
  },
  {
    key: 'enrollment.wizard.password.label',
    en: 'Password',
    he: 'סיסמה'
  },
  {
    key: 'enrollment.wizard.password.confirm',
    en: 'Confirm Password',
    he: 'אמת סיסמה'
  },
  {
    key: 'enrollment.wizard.password.creating',
    en: 'Creating Account...',
    he: 'יוצר חשבון...'
  },
  {
    key: 'enrollment.wizard.password.button',
    en: 'Create Account',
    he: 'צור חשבון'
  },
  // Step indicator
  {
    key: 'enrollment.wizard.steps.password',
    en: 'Password',
    he: 'סיסמה'
  }
];

async function addPasswordTranslations() {
  console.log('🔐 Adding password step translations...\n');

  for (const translation of passwordTranslations) {
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

  console.log('✅ Password step translations added successfully!');
}

addPasswordTranslations().catch(console.error);
