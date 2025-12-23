const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkZoomConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('CHECKING ZOOM CONFIGURATION');
  console.log('='.repeat(80));

  // Get tenant
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);

  const tenant = tenants[0];
  console.log(`\nTenant: ${tenant.name} (${tenant.id})`);

  // Check Zoom integration
  const { data: zoomIntegration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'zoom')
    .eq('tenant_id', tenant.id)
    .single();

  if (integrationError) {
    console.log('\n❌ ZOOM INTEGRATION NOT FOUND');
    console.log('Error:', integrationError.message);
    console.log('\nTo fix: Add Zoom integration in admin settings');
    return;
  }

  console.log('\n✅ Zoom Integration Found');
  console.log(`   Enabled: ${zoomIntegration.is_enabled ? '✅ YES' : '❌ NO'}`);
  console.log(`   Created: ${zoomIntegration.created_at}`);

  // Check credentials
  const credentials = zoomIntegration.credentials || {};
  const sdkKey = credentials.sdk_key || credentials.client_id;
  const sdkSecret = credentials.sdk_secret || credentials.client_secret;

  console.log('\n📋 Credentials:');
  console.log(`   SDK Key: ${sdkKey ? '✅ Set (' + sdkKey.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`   SDK Secret: ${sdkSecret ? '✅ Set (' + sdkSecret.substring(0, 10) + '...)' : '❌ Missing'}`);

  // Check for lessons with Zoom meetings
  console.log('\n' + '='.repeat(80));
  console.log('LESSONS WITH ZOOM MEETINGS:');
  console.log('='.repeat(80));

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, zoom_meeting_id, zoom_join_url, zoom_passcode, status')
    .not('zoom_meeting_id', 'is', null)
    .limit(10);

  if (lessons && lessons.length > 0) {
    lessons.forEach((lesson, i) => {
      console.log(`\n${i + 1}. ${lesson.title}`);
      console.log(`   Meeting ID: ${lesson.zoom_meeting_id || '❌ Not set'}`);
      console.log(`   Join URL: ${lesson.zoom_join_url ? '✅ Set' : '❌ Not set'}`);
      console.log(`   Passcode: ${lesson.zoom_passcode || 'None'}`);
      console.log(`   Status: ${lesson.status || 'N/A'}`);
    });
  } else {
    console.log('\nNo lessons with Zoom meetings found.');
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(80));

  const issues = [];

  if (!zoomIntegration.is_enabled) {
    issues.push('❌ Zoom integration is disabled');
  }

  if (!sdkKey) {
    issues.push('❌ SDK Key is missing');
  }

  if (!sdkSecret) {
    issues.push('❌ SDK Secret is missing');
  }

  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n💡 TO FIX:');
    console.log('   1. Go to Admin > Settings > Integrations');
    console.log('   2. Enable Zoom integration');
    console.log('   3. Add SDK Key and SDK Secret from your Zoom app');
  } else {
    console.log('\n✅ All Zoom configuration looks good!');
    console.log('\nIf you\'re still getting errors, check:');
    console.log('   1. The meeting ID is correct');
    console.log('   2. The meeting has started (if required)');
    console.log('   3. The Zoom app credentials are valid');
    console.log('   4. Browser console for specific error messages');
  }

  console.log('\n' + '='.repeat(80));
}

checkZoomConfig().catch(console.error);
