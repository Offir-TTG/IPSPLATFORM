import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCheckoutTranslations() {
  console.log('Verifying checkout translations...\n');

  const { data: translations, error } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'user.payments.checkout.%')
    .order('translation_key', { ascending: true })
    .order('language_code', { ascending: true });

  if (error) {
    console.error('❌ Error fetching translations:', error);
    process.exit(1);
  }

  if (!translations || translations.length === 0) {
    console.log('❌ No checkout translations found!');
    process.exit(1);
  }

  console.log(`✅ Found ${translations.length} translations:\n`);

  const grouped: Record<string, Record<string, string>> = {};

  for (const t of translations) {
    if (!grouped[t.translation_key]) {
      grouped[t.translation_key] = {};
    }
    grouped[t.translation_key][t.language_code] = t.translation_value;
  }

  for (const [key, langs] of Object.entries(grouped)) {
    console.log(`📝 ${key}`);
    console.log(`   EN: ${langs.en || '(missing)'}`);
    console.log(`   HE: ${langs.he || '(missing)'}`);
    console.log('');
  }

  console.log('✨ Verification complete!');
}

verifyCheckoutTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
