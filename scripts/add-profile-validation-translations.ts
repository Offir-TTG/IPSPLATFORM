/**
 * Add Profile Validation Translations
 * Adds Hebrew translations for profile field validation errors
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // First Name validations
  {
    key: 'enrollment.wizard.profile.first_name.required',
    en: 'First name is required',
    he: 'שם פרטי הוא שדה חובה'
  },
  // Last Name validations
  {
    key: 'enrollment.wizard.profile.last_name.required',
    en: 'Last name is required',
    he: 'שם משפחה הוא שדה חובה'
  },
  // Email validations
  {
    key: 'enrollment.wizard.profile.email.required',
    en: 'Email is required',
    he: 'אימייל הוא שדה חובה'
  },
  {
    key: 'enrollment.wizard.profile.email.invalid',
    en: 'Please enter a valid email address',
    he: 'נא להזין כתובת אימייל תקינה'
  },
  // Phone validations
  {
    key: 'enrollment.wizard.profile.phone.required',
    en: 'Phone is required',
    he: 'מספר טלפון הוא שדה חובה'
  },
  {
    key: 'enrollment.wizard.profile.phone.invalid',
    en: 'Please enter a valid phone number with country code',
    he: 'נא להזין מספר טלפון תקין עם קוד מדינה'
  },
  // Address validations
  {
    key: 'enrollment.wizard.profile.address.required',
    en: 'Address is required',
    he: 'כתובת היא שדה חובה'
  }
];

async function addTranslations() {
  console.log('Adding profile validation translations...\n');

  for (const translation of translations) {
    console.log(`Adding: ${translation.key}`);

    // Check if English exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('language_code', 'en')
      .eq('translation_key', translation.key)
      .eq('context', 'user')
      .is('tenant_id', null)
      .single();

    if (existingEn) {
      // Update
      const { error: enError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.en,
          category: 'enrollment',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEn.id);

      if (enError) {
        console.error(`  ❌ Error updating English: ${enError.message}`);
      } else {
        console.log(`  ✅ English (updated): ${translation.en}`);
      }
    } else {
      // Insert
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          language_code: 'en',
          translation_key: translation.key,
          translation_value: translation.en,
          category: 'enrollment',
          context: 'user',
          tenant_id: null
        });

      if (enError) {
        console.error(`  ❌ Error adding English: ${enError.message}`);
      } else {
        console.log(`  ✅ English: ${translation.en}`);
      }
    }

    // Check if Hebrew exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('language_code', 'he')
      .eq('translation_key', translation.key)
      .eq('context', 'user')
      .is('tenant_id', null)
      .single();

    if (existingHe) {
      // Update
      const { error: heError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.he,
          category: 'enrollment',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHe.id);

      if (heError) {
        console.error(`  ❌ Error updating Hebrew: ${heError.message}`);
      } else {
        console.log(`  ✅ Hebrew (updated): ${translation.he}`);
      }
    } else {
      // Insert
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          language_code: 'he',
          translation_key: translation.key,
          translation_value: translation.he,
          category: 'enrollment',
          context: 'user',
          tenant_id: null
        });

      if (heError) {
        console.error(`  ❌ Error adding Hebrew: ${heError.message}`);
      } else {
        console.log(`  ✅ Hebrew: ${translation.he}`);
      }
    }

    console.log('');
  }

  console.log('✅ All profile validation translations added!');
}

addTranslations().catch(console.error);
