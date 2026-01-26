import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .in('translation_key', ['api.languages.success.activated', 'api.languages.success.deactivated'])
    .order('translation_key')
    .order('language_code');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Translations in database:');
    data?.forEach(t => {
      console.log(`${t.translation_key} [${t.language_code}]: ${t.translation_value}`);
    });
  }
}

verify();
