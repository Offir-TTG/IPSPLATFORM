const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslation() {
  console.log('Checking for instructor translation...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'user.courses.instructor');

  if (error) {
    console.error('Error fetching translations:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ Translation NOT found in database');
    console.log('Please run the SQL script: 20250131_add_instructor_label_translation.sql');
  } else {
    console.log('✅ Translation found:');
    data.forEach(row => {
      console.log(`  - Language: ${row.language_code}, Value: "${row.translation_value}", Context: ${row.context}`);
    });
  }
}

checkTranslation().catch(console.error);
