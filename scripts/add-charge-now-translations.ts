/**
 * Add Charge Now translations for payment schedules
 *
 * Adds Hebrew and English translations for the new "Charge Now" feature
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addChargeNowTranslations() {
  console.log('Starting to add Charge Now translations...\n');

  const translations = [
    {
      key: 'admin.payments.schedules.chargeNow',
      context: 'admin',
      en: 'Charge Now',
      he: 'חייב עכשיו'
    },
    {
      key: 'admin.payments.schedules.chargeNowSuccess',
      context: 'admin',
      en: 'Payment initiated successfully. Invoice will be charged automatically.',
      he: 'התשלום יזום בהצלחה. החשבונית תחויב באופן אוטומטי.'
    },
    {
      key: 'admin.payments.schedules.chargeNowError',
      context: 'admin',
      en: 'Failed to charge payment',
      he: 'נכשל בחיוב התשלום'
    }
  ];

  for (const translation of translations) {
    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      const { error: enError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.en,
          context: translation.context
        })
        .eq('translation_key', translation.key)
        .eq('language_code', 'en');

      if (enError) {
        console.error(`❌ Error updating English translation for ${translation.key}:`, enError.message);
      } else {
        console.log(`✓ Updated English: ${translation.key}`);
      }
    } else {
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: translation.context
        });

      if (enError) {
        console.error(`❌ Error adding English translation for ${translation.key}:`, enError.message);
      } else {
        console.log(`✓ Added English: ${translation.key}`);
      }
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      const { error: heError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.he,
          context: translation.context
        })
        .eq('translation_key', translation.key)
        .eq('language_code', 'he');

      if (heError) {
        console.error(`❌ Error updating Hebrew translation for ${translation.key}:`, heError.message);
      } else {
        console.log(`✓ Updated Hebrew: ${translation.key}`);
      }
    } else {
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: translation.context
        });

      if (heError) {
        console.error(`❌ Error adding Hebrew translation for ${translation.key}:`, heError.message);
      } else {
        console.log(`✓ Added Hebrew: ${translation.key}`);
      }
    }
  }

  console.log('\n✅ Charge Now translations added successfully!');
}

addChargeNowTranslations();
