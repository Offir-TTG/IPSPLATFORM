import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  console.log('Adding Payment Methods tab translation...\n');

  const translationPairs = [
    {
      key: 'user.profile.billing.paymentMethodsTab',
      context: 'user',
      en: 'Payment Methods',
      he: 'אמצעי תשלום',
    },
  ];

  for (const translation of translationPairs) {
    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      if (existingEn.translation_value !== translation.en) {
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
        console.log(`✓ English already up to date: ${translation.key}`);
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
      .select('id, translation_value')
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      if (existingHe.translation_value !== translation.he) {
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
        console.log(`✓ Hebrew already up to date: ${translation.key}`);
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

  console.log('\n✅ Payment Methods tab translation added successfully!');
}

addTranslations().catch(console.error);
