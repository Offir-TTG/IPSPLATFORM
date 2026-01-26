import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = 'c85f5987-8fc6-4315-8596-5c7521346ee0';

async function setLanguage() {
  // Update user's preferred_language in the users table
  const { data, error } = await supabase
    .from('users')
    .update({ preferred_language: 'he' })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error updating language preference:', error);
  } else {
    console.log('✓ Updated user language preference to Hebrew (he)');
    console.log('Updated user:', data);
  }
}

setLanguage();
