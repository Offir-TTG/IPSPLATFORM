const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTenantConfig() {
  console.log('Setting up app.current_tenant_id configuration parameter...\n');

  const sql = `
    -- Create the custom configuration parameter for tenant context
    DO $$
    BEGIN
      EXECUTE 'ALTER DATABASE ' || current_database() || ' SET app.current_tenant_id = ''''';
      RAISE NOTICE '✅ Created app.current_tenant_id configuration parameter';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not create parameter (may already exist): %', SQLERRM;
    END $$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('Note: exec_sql RPC not available, this SQL needs to be run manually in Supabase SQL Editor');
      console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log(sql);
      console.log('----------------------------------------\n');
      console.log('Or run: supabase/SQL Scripts/20250117_setup_tenant_config_parameter.sql');
    } else {
      console.log('✅ Configuration parameter setup complete!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('File: supabase/SQL Scripts/20250117_setup_tenant_config_parameter.sql');
  }
}

setupTenantConfig();
