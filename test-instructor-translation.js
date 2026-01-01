// Test script to check if the instructor translation exists in the database
// Run with: node test-instructor-translation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTranslation() {
  console.log('🔍 Checking for instructor translation in database...\n');

  // Check the translation
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'user.courses.instructor')
    .order('language_code');

  if (error) {
    console.error('❌ Error querying database:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ Translation NOT found in database!');
    console.log('Please run: 20250131_add_instructor_label_translation.sql');
    return;
  }

  console.log('✅ Translation found in database:\n');
  data.forEach(row => {
    console.log(`Language: ${row.language_code}`);
    console.log(`  Key: ${row.translation_key}`);
    console.log(`  Value: "${row.translation_value}"`);
    console.log(`  Context: ${row.context}`);
    console.log(`  Tenant ID: ${row.tenant_id}`);
    console.log('');
  });

  // Verify context is 'admin'
  const adminContextRows = data.filter(r => r.context === 'admin');
  const userContextRows = data.filter(r => r.context === 'user');

  if (adminContextRows.length > 0) {
    console.log(`✅ Found ${adminContextRows.length} row(s) with context='admin' (CORRECT)`);
  }
  if (userContextRows.length > 0) {
    console.log(`⚠️  Found ${userContextRows.length} row(s) with context='user' (INCORRECT - should be 'admin')`);
    console.log('   Please re-run the SQL script to update context to "admin"');
  }
}

testTranslation().catch(console.error).finally(() => process.exit(0));
