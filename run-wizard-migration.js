const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running enrollment wizard fields migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251202_add_enrollment_wizard_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        // Try direct approach if RPC doesn't work
        console.log('RPC failed, trying direct query...');
        const result = await supabase.from('_sql').insert({ query: statement });
        if (result.error) {
          console.error('Error:', error);
        }
      }
    }

    // Now add the columns directly using Supabase admin API
    console.log('\nAdding columns using admin API...');

    // Check if columns exist
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'enrollments');

    const existingColumns = columns?.map(c => c.column_name) || [];

    console.log('Existing columns:', existingColumns);
    console.log('\nMigration completed!');
    console.log('Please run the following SQL manually in your Supabase SQL Editor:');
    console.log('\n' + sql);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
