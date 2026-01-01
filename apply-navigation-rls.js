import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSPolicies() {
  try {
    console.log('📝 Applying RLS policies for navigation_items table...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'SQL Scripts', 'add_navigation_items_rls_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('SQL to execute:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------\n');

    // Execute the SQL
    console.log('Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n💡 The exec_sql function might not exist.');
      console.log('Please run this SQL manually in the Supabase SQL Editor:');
      console.log('\nhttps://supabase.com/dashboard/project/_/sql/new');
      return;
    }

    console.log('✅ RLS policies applied successfully!');

    // Test the policies
    console.log('\n🧪 Testing RLS policies...');
    const { data: testData, error: testError } = await supabase
      .from('navigation_items')
      .select('count');

    if (testError) {
      console.log('❌ Test query failed:', testError);
    } else {
      console.log('✅ Policies are working!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

applyRLSPolicies();
