require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContexts() {
  const { data } = await supabase
    .from('translations')
    .select('context')
    .limit(10);

  const contexts = [...new Set(data?.map(t => t.context))];
  console.log('Available contexts:', contexts);
  process.exit(0);
}

checkContexts();
