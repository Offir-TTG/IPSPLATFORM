const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTranslation() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Checking for recording translation...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'user.courses.recordingHostedOnZoom')
    .order('language_code', { ascending: true });

  if (error) {
    console.error('Error fetching translation:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ Translation not found in database');
    console.log('\nThe SQL script may not have executed successfully.');
    console.log('Please verify in Supabase SQL Editor that the translations were inserted.');
    return;
  }

  console.log('✅ Translation found in database:\n');
  data.forEach(translation => {
    console.log(`Language: ${translation.language_code}`);
    console.log(`Value: ${translation.translation_value}`);
    console.log(`Context: ${translation.context}`);
    console.log('---');
  });
}

checkTranslation().catch(console.error);
