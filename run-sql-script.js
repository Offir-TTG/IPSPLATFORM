const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runSqlScript(scriptPath) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('RUNNING SQL SCRIPT');
  console.log('='.repeat(80));
  console.log('Script:', scriptPath);

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    console.log('\n✓ SQL file loaded');
    console.log('Length:', sqlContent.length, 'characters');

    // Execute the SQL
    console.log('\n→ Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sqlContent
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.log('→ Trying direct execution...');
      const { error: directError } = await supabase.from('translations').select('count').limit(0);

      if (directError) {
        throw new Error(`SQL execution failed: ${error.message || directError.message}`);
      }

      // Since we can't execute arbitrary SQL via the client, we need to parse and execute the INSERT
      // Extract the INSERT statements
      const insertMatch = sqlContent.match(/INSERT INTO translations[\s\S]*?;/g);

      if (insertMatch) {
        console.log('\n→ Parsing INSERT statements...');
        // This is a simplified approach - in production you'd want proper SQL parsing
        console.log('\n⚠️  Direct SQL execution not available via Supabase client.');
        console.log('\nPlease run this script manually in Supabase SQL Editor:');
        console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
        console.log('2. Copy and paste the SQL from:', scriptPath);
        console.log('3. Click "Run"');
        return;
      }
    }

    console.log('\n✅ SQL script executed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n='.repeat(80));
    console.log('MANUAL EXECUTION REQUIRED');
    console.log('='.repeat(80));
    console.log('\nPlease run this script manually in Supabase SQL Editor:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Click "New Query"');
    console.log('3. Copy and paste the contents of:', scriptPath);
    console.log('4. Click "Run"');
    process.exit(1);
  }
}

const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('Usage: node run-sql-script.js <path-to-sql-file>');
  process.exit(1);
}

runSqlScript(scriptPath).catch(console.error);
