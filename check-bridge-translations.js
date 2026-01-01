import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBridgeTranslations() {
  console.log('Checking bridge translations in database...\n');

  // Check all bridge-related translation keys
  const bridgeKeys = [
    'bridge.loading',
    'bridge.checking_session',
    'bridge.session_found',
    'bridge.redirecting',
    'bridge.no_active_session',
    'bridge.no_active_session_message',
    'bridge.use_same_link',
    'bridge.bookmark_page',
    'bridge.next_session'
  ];

  for (const key of bridgeKeys) {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', key)
      .in('language_code', ['en', 'he'])
      .order('language_code');

    if (error) {
      console.error(`Error checking ${key}:`, error);
      continue;
    }

    console.log(`\n${key}:`);
    if (data && data.length > 0) {
      data.forEach(t => {
        console.log(`  [${t.language_code}] context=${t.context}: "${t.translation_value}"`);
      });
    } else {
      console.log('  ❌ NOT FOUND');
    }
  }
}

checkBridgeTranslations();
