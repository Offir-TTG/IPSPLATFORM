const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupDailyIntegration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          Daily.co Integration Setup                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Get API key from user
  const apiKey = await new Promise((resolve) => {
    rl.question('Enter your Daily.co API key: ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!apiKey) {
    console.error('\n❌ API key is required');
    rl.close();
    process.exit(1);
  }

  // Optional: Get subdomain
  const subdomain = await new Promise((resolve) => {
    rl.question('Enter your Daily.co subdomain (optional, press Enter to skip): ', (answer) => {
      resolve(answer.trim());
    });
  });

  rl.close();

  console.log('\n📡 Connecting to database...');

  try {
    // Check if integration exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'daily')
      .single();

    if (existing) {
      console.log('✓ Found existing Daily.co integration\n');
      console.log('🔄 Updating credentials...');

      const { error } = await supabase
        .from('integrations')
        .update({
          credentials: { api_key: apiKey },
          settings: {
            subdomain: subdomain || existing.settings?.subdomain || '',
            default_room_privacy: 'private',
            enable_recording: true,
            default_expiry_hours: 24
          },
          is_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('integration_key', 'daily');

      if (error) throw error;

      console.log('✅ Daily.co integration updated successfully!\n');
    } else {
      console.log('➕ Creating new Daily.co integration...\n');

      const { error } = await supabase
        .from('integrations')
        .insert({
          integration_key: 'daily',
          integration_name: 'Daily.co Video',
          credentials: { api_key: apiKey },
          settings: {
            subdomain: subdomain || '',
            default_room_privacy: 'private',
            enable_recording: true,
            default_expiry_hours: 24
          },
          webhook_url: '/api/webhooks/daily',
          is_enabled: true
        });

      if (error) throw error;

      console.log('✅ Daily.co integration created successfully!\n');
    }

    // Verify the integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'daily')
      .single();

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          Integration Summary                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`  Status: ${integration.is_enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  API Key: ${'*'.repeat(apiKey.length - 4)}${apiKey.slice(-4)}`);
    if (subdomain) {
      console.log(`  Subdomain: ${subdomain}.daily.co`);
    }
    console.log(`  Privacy: ${integration.settings.default_room_privacy}`);
    console.log(`  Recording: ${integration.settings.enable_recording ? 'Enabled' : 'Disabled'}`);
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          Next Steps                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('  1. Run the database migration:');
    console.log('     Open Supabase SQL Editor and run:');
    console.log('     supabase/SQL Scripts/20251219_add_daily_co_integration.sql');
    console.log('');
    console.log('  2. Restart your dev server:');
    console.log('     npm run dev');
    console.log('');
    console.log('  3. Test the integration:');
    console.log('     - Go to Admin → LMS → Courses');
    console.log('     - Select a lesson');
    console.log('     - Create a Daily.co room');
    console.log('     - Join as instructor (you\'ll be host automatically)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupDailyIntegration();
