import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLS() {
  console.log('Checking languages table configuration...\n');

  // Try a direct update using service role key (bypasses RLS)
  console.log('Attempting direct update with service role key...');
  const { data: updateResult, error: updateError } = await supabase
    .from('languages')
    .update({ is_active: false })
    .eq('code', 'es')
    .select();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Update result:', updateResult);
  }

  // Check current state
  const { data: currentLang } = await supabase
    .from('languages')
    .select('*')
    .eq('code', 'es')
    .single();

  console.log('\nCurrent language state:', currentLang);
}

checkRLS();
