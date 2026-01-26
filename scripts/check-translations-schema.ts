import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  // Get distinct contexts
  const { data: contexts, error: contextsError } = await supabase
    .from('translations')
    .select('context')
    .limit(100);

  if (contextsError) {
    console.error('Error fetching contexts:', contextsError);
  } else {
    const uniqueContexts = [...new Set(contexts?.map(c => c.context))];
    console.log('Unique contexts in database:', uniqueContexts);
  }
}

checkSchema();
