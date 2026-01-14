// Check SMTP configuration in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSMTPConfig() {
  console.log('Checking SMTP configuration in database...\n');

  // Query integrations table for SMTP config
  const { data, error } = await supabase
    .from('integrations')
    .select('tenant_id, integration_key, is_enabled, credentials')
    .eq('integration_key', 'smtp');

  if (error) {
    console.error('❌ Error querying integrations:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No SMTP configuration found in database');
    console.log('\nTo configure SMTP:');
    console.log('1. Go to Admin → Settings → Integrations');
    console.log('2. Configure SMTP settings');
    console.log('OR uncomment SMTP settings in .env.local');
    return;
  }

  console.log(`✅ Found ${data.length} SMTP configuration(s):\n`);

  data.forEach((config, index) => {
    console.log(`Configuration ${index + 1}:`);
    console.log(`  Tenant ID: ${config.tenant_id || 'Global'}`);
    console.log(`  Enabled: ${config.is_enabled ? '✅ Yes' : '❌ No'}`);

    if (config.credentials) {
      console.log(`  Host: ${config.credentials.smtp_host || 'Not set'}`);
      console.log(`  Port: ${config.credentials.smtp_port || 'Not set'}`);
      console.log(`  Secure: ${config.credentials.smtp_secure || 'Not set'}`);
      console.log(`  Username: ${config.credentials.smtp_username || 'Not set'}`);
      console.log(`  Password: ${config.credentials.smtp_password ? '***SET***' : 'Not set'}`);
      console.log(`  From Email: ${config.credentials.from_email || 'Not set'}`);
      console.log(`  From Name: ${config.credentials.from_name || 'Not set'}`);
    } else {
      console.log('  ⚠️  No credentials configured');
    }
    console.log('');
  });

  // Check if any are enabled
  const enabledConfigs = data.filter(c => c.is_enabled);
  if (enabledConfigs.length === 0) {
    console.log('⚠️  Warning: All SMTP configurations are disabled');
  }
}

checkSMTPConfig()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
