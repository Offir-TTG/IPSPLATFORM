import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCashFlowAPI() {
  try {
    // Get tenant and admin user
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    const { data: admins } = await supabase
      .from('users')
      .select('id, email')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')
      .limit(1);

    if (!admins || admins.length === 0) {
      console.error('No admin user found');
      return;
    }

    console.log('Testing Cash Flow API\n');
    console.log('Tenant ID:', tenantId);
    console.log('Admin User:', admins[0].email);

    // Create a session for the admin user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: admins[0].email,
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return;
    }

    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/payments/reports/cashflow', {
      headers: {
        'Cookie': `sb-access-token=${sessionData.properties.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const error = await response.text();
      console.error('Error details:', error);
      return;
    }

    const data = await response.json();

    console.log('\n=== API Response ===');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n=== Cash Flow Cards (What UI will show) ===');
    console.log('Expected This Month:', `$${data.currentMonth.expected.toFixed(2)}`);
    console.log('  Description: "Not yet paid"');
    console.log('');
    console.log('Received:', `$${data.currentMonth.received.toFixed(2)}`);
    console.log('  Description: "Already collected"');
    if (data.currentMonth.refunds > 0) {
      console.log(`  Refunds: -$${data.currentMonth.refunds.toFixed(2)}`);
    }
    console.log('');
    console.log('Pending:', `$${data.currentMonth.pending.toFixed(2)}`);
    console.log('  Description: "Remaining"');

    console.log('\n=== Verification ===');
    if (data.currentMonth.expected === data.currentMonth.pending) {
      console.log('✅ Expected equals Pending (both show unpaid amounts)');
    } else {
      console.log('❌ Expected does not equal Pending');
      console.log('   Expected:', data.currentMonth.expected);
      console.log('   Pending:', data.currentMonth.pending);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCashFlowAPI().then(() => process.exit(0));
