// Direct test of email sending functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailDirectly() {
  console.log('Testing email sending directly...\n');

  // Import the sendEmail function
  const { sendEmail } = require('../src/lib/email/send.ts');

  try {
    // Get a tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      console.error('❌ No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`Using tenant ID: ${tenantId}\n`);

    // Send a simple test email
    console.log('Sending test email...');
    const result = await sendEmail({
      to: 'offir.omer@tenafly-tg.com',
      subject: '[DIRECT TEST] Test Email from IPS Platform',
      html: '<h1>Test Email</h1><p>This is a direct test email to verify SMTP configuration.</p>',
      text: 'Test Email\n\nThis is a direct test email to verify SMTP configuration.',
      tenantId: tenantId,
    });

    console.log('\n📧 Email send result:', result);

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('Check your inbox at: offir.omer@tenafly-tg.com');
    } else {
      console.log('\n❌ Email failed to send');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

testEmailDirectly()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
