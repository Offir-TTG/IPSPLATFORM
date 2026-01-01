const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .limit(1);
  
  console.log('Sample translation:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

checkStructure();
