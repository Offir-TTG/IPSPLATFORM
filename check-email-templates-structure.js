const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  // Try to get one template to see the structure
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Sample template structure:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkStructure();
