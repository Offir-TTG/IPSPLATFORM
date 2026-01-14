// Check email_triggers table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  console.log('Checking email_triggers table schema...\n');

  // Check if table exists and get its structure
  const { data, error } = await supabase
    .from('email_triggers')
    .select('*')
    .limit(0);

  if (error) {
    console.error('❌ Error querying email_triggers table:', error.message);
    console.error('Details:', error);

    if (error.code === '42P01') {
      console.error('\n⚠️  Table does not exist! Run the migration:');
      console.error('   supabase/SQL Scripts/20251202_email_system_core.sql');
    } else if (error.code === '42703') {
      console.error('\n⚠️  Column missing! The table exists but schema is incomplete.');
      console.error('   Run the migration again to add missing columns.');
    }
    return;
  }

  console.log('✅ Table exists and is accessible\n');

  // Try to describe table structure via information_schema
  const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'email_triggers'
      ORDER BY ordinal_position;
    `
  });

  if (colError) {
    console.log('⚠️  Could not get detailed schema (RPC might not be enabled)');
    console.log('But table is accessible, which is good!');
  } else if (columns) {
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }

  // Count existing triggers
  const { count } = await supabase
    .from('email_triggers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Existing triggers: ${count || 0}`);
}

checkTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
