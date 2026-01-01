import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserData() {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, location')
      .eq('id', 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2')
      .single();

    console.log('\n=== User Data ===\n');
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserData();
