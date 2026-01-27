/**
 * Add translation for Type column header
 * Run: npx ts-node scripts/add-type-column-translation.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTranslation() {
  try {
    console.log('🌐 Adding Type column translation...\n');

    const translationKey = 'user.profile.billing.type';

    // Check if exists
    const { data: existing } = await supabase
      .from('translations')
      .select('translation_key')
      .eq('translation_key', translationKey)
      .eq('language_code', 'en')
      .single();

    if (existing) {
      console.log('✅ Translation already exists');
      return;
    }

    console.log(`Adding translation key: ${translationKey}`);

    // Insert English
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        translation_key: translationKey,
        language_code: 'en',
        translation_value: 'Type',
        context: 'user'
      });

    if (enError) {
      console.error('❌ Error inserting EN:', enError);
      return;
    }

    console.log('✅ Added English translation');

    // Insert Hebrew
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        translation_key: translationKey,
        language_code: 'he',
        translation_value: 'סוג',
        context: 'user'
      });

    if (heError) {
      console.error('❌ Error inserting HE:', heError);
      return;
    }

    console.log('✅ Added Hebrew translation');
    console.log('\n✅ Translation added successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslation();
