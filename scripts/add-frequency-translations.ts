import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addFrequencyTranslations() {
  const translations = [
    {
      key: 'user.payments.frequency.monthly',
      en: 'monthly',
      he: 'חודשיים',
      context: 'user'
    },
    {
      key: 'user.payments.frequency.weekly',
      en: 'weekly',
      he: 'שבועיים',
      context: 'user'
    },
    {
      key: 'user.payments.frequency.yearly',
      en: 'yearly',
      he: 'שנתיים',
      context: 'user'
    },
    {
      key: 'user.payments.frequency.quarterly',
      en: 'quarterly',
      he: 'רבעוניים',
      context: 'user'
    }
  ];

  console.log('Adding payment frequency translations...');

  for (const translation of translations) {
    // Check if translation already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existing) {
      console.log(`⚠️  Translation key "${translation.key}" already exists, skipping...`);
      continue;
    }

    // Insert English translation
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: translation.context
      });

    if (enError) {
      console.error(`❌ Error inserting EN translation for ${translation.key}:`, enError);
      continue;
    }

    // Insert Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: translation.context
      });

    if (heError) {
      console.error(`❌ Error inserting HE translation for ${translation.key}:`, heError);
      continue;
    }

    console.log(`✅ Added translation: ${translation.key}`);
  }

  console.log('\n✨ Payment frequency translations added successfully!');
}

addFrequencyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
