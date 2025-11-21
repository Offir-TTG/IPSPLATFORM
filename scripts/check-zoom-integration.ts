/**
 * Script to check Zoom integration status
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkZoomIntegration() {
  console.log('Checking Zoom integration status...\n');

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'zoom')
    .single();

  if (error) {
    console.error('❌ Error fetching Zoom integration:', error);
    return;
  }

  if (!data) {
    console.log('❌ Zoom integration not found in database');
    return;
  }

  console.log('Integration found:');
  console.log('  Key:', data.integration_key);
  console.log('  Enabled:', data.is_enabled);
  console.log('  Credentials:', data.credentials ? 'Present' : 'Missing');

  if (data.credentials) {
    console.log('\n  Credential fields:');
    console.log('    - account_id:', data.credentials.account_id ? '✓ Set' : '✗ Missing');
    console.log('    - client_id:', data.credentials.client_id ? '✓ Set' : '✗ Missing');
    console.log('    - client_secret:', data.credentials.client_secret ? '✓ Set' : '✗ Missing');
  }

  console.log('\n  Settings:', data.settings ? JSON.stringify(data.settings, null, 2) : 'None');

  if (!data.is_enabled) {
    console.log('\n⚠ WARNING: Zoom integration is NOT enabled');
  } else if (!data.credentials || !data.credentials.account_id || !data.credentials.client_id || !data.credentials.client_secret) {
    console.log('\n⚠ WARNING: Zoom integration is enabled but credentials are incomplete');
  } else {
    console.log('\n✓ Zoom integration is properly configured');
  }
}

checkZoomIntegration();
