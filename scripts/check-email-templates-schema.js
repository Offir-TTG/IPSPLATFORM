// Check email_templates table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking email_templates table schema...\n');

  // Get one template to see what columns exist
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying table:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No templates found in table');
    return;
  }

  console.log('✅ Found template. Available columns:\n');
  const columns = Object.keys(data[0]);
  columns.forEach(col => {
    console.log(`  • ${col}: ${typeof data[0][col]}`);
  });

  console.log('\n📋 Sample template data:');
  console.log(JSON.stringify(data[0], null, 2));
}

checkSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
