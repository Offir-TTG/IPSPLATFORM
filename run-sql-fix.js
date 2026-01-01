const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    const sql = fs.readFileSync('supabase/SQL Scripts/fix-tenant-rpc-add-admin-email.sql', 'utf8');
    
    console.log('Running SQL migration...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error:', error);
      
      // Try running each function separately
      console.log('\nTrying direct approach...');
      
      const functions = sql.split('CREATE OR REPLACE FUNCTION').slice(1);
      for (const func of functions) {
        const fullFunc = 'CREATE OR REPLACE FUNCTION' + func.split('COMMENT ON FUNCTION')[0];
        try {
          await supabase.rpc('query', { query_text: fullFunc });
          console.log('✅ Function created');
        } catch (err) {
          console.error('Error creating function:', err);
        }
      }
    } else {
      console.log('✅ SQL migration completed successfully');
    }
    
    // Test the updated function
    console.log('\nTesting updated function...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_tenant_by_slug', { p_slug: 'default' })
      .single();
    
    if (testError) {
      console.error('Test error:', testError);
    } else {
      console.log('\nUpdated function returns:');
      console.log('Fields:', Object.keys(testData));
      console.log('Admin Email:', testData.admin_email);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

runSQL();
