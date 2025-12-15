import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslation() {
  // Get a sample translation
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample translations:');
    console.log(JSON.stringify(data, null, 2));

    // Check columns
    if (data && data.length > 0) {
      console.log('\nColumns:', Object.keys(data[0]));
    }
  }
}

checkTranslation();
