const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUpsertFunction() {
  console.log('Creating upsert_translation function...');

  const sqlPath = path.join(__dirname, 'supabase', 'SQL Scripts', 'create_upsert_translation_function.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('exec_sql not available, trying direct approach...');
      const { error: directError } = await supabase.from('_').select('*').limit(0);

      console.error('Error creating function:', error);
      console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
      console.log('===================================================');
      console.log(sql);
      console.log('===================================================\n');
      return;
    }

    console.log('✅ Function created successfully!');
    console.log('You can now save translations in the admin panel.');
  } catch (err) {
    console.error('Error:', err);
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
    console.log('===================================================');
    console.log(sql);
    console.log('===================================================\n');
  }
}

createUpsertFunction();
