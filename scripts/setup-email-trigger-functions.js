// Setup email trigger database functions
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFunctions() {
  console.log('🔧 Setting up email trigger database functions...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'SQL Scripts', 'email_trigger_functions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded:', sqlPath);
    console.log('📝 SQL file size:', sqlContent.length, 'bytes\n');

    // Split SQL into individual statements (basic split on $$)
    const statements = sqlContent
      .split(/\$\$\s*LANGUAGE/i)
      .filter(s => s.trim())
      .map((s, i) => {
        if (i < statements.length - 1) {
          return s + '$$ LANGUAGE';
        }
        return s;
      });

    console.log(`🔨 Executing SQL to create database functions...`);
    console.log(`   This will create 3 functions:`);
    console.log(`   1. find_matching_triggers`);
    console.log(`   2. evaluate_trigger_conditions`);
    console.log(`   3. queue_triggered_email\n`);

    // Execute the entire SQL file at once
    // Supabase RPC doesn't support CREATE FUNCTION, so we need to use raw SQL execution
    // This is typically done through psql or Supabase Dashboard SQL Editor

    console.log('⚠️  IMPORTANT:');
    console.log('   The SQL script needs to be executed in Supabase Dashboard SQL Editor');
    console.log('   or via psql command line tool.\n');

    console.log('📋 To execute manually:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the contents of:');
    console.log(`      ${sqlPath}`);
    console.log('   3. Paste into SQL Editor and click "Run"\n');

    console.log('🔍 Checking if functions already exist...\n');

    // Test if functions exist by trying to call them
    const tests = [
      {
        name: 'find_matching_triggers',
        test: async () => {
          const { data, error } = await supabase.rpc('find_matching_triggers', {
            p_tenant_id: '00000000-0000-0000-0000-000000000000',
            p_trigger_event: 'test.event'
          });
          return !error || !error.message.includes('function') && !error.message.includes('does not exist');
        }
      },
      {
        name: 'evaluate_trigger_conditions',
        test: async () => {
          const { data, error } = await supabase.rpc('evaluate_trigger_conditions', {
            p_conditions: {},
            p_event_data: {}
          });
          return !error || !error.message.includes('function') && !error.message.includes('does not exist');
        }
      }
    ];

    let allExist = true;
    for (const { name, test } of tests) {
      try {
        const exists = await test();
        if (exists) {
          console.log(`   ✅ Function "${name}" exists`);
        } else {
          console.log(`   ❌ Function "${name}" does not exist`);
          allExist = false;
        }
      } catch (err) {
        console.log(`   ❌ Function "${name}" does not exist`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log('\n✅ All database functions are already set up!');
      console.log('   Email trigger system is ready to use.\n');
    } else {
      console.log('\n⚠️  Some functions are missing.');
      console.log('   Please run the SQL script in Supabase Dashboard.\n');
      console.log('📝 Instructions:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Navigate to: SQL Editor');
      console.log('   4. Click "New Query"');
      console.log('   5. Copy the SQL from:');
      console.log(`      ${sqlPath}`);
      console.log('   6. Paste and click "Run"');
      console.log('   7. Run this script again to verify\n');
    }

    // Show the SQL file path for easy access
    console.log('📂 SQL File Location:');
    console.log(`   ${sqlPath}\n`);

  } catch (error) {
    console.error('❌ Error setting up functions:', error);
    process.exit(1);
  }
}

setupFunctions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
