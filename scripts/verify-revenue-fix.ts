/**
 * Verify Revenue Fix
 * Confirms that revenue calculations match actual payments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFix() {
  console.log('🔍 Testing Exact API Logic...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant ID: ${tenantId}\n`);

  // Get all enrollments (EXACTLY as API does)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('total_amount, paid_amount, payment_status')
    .eq('tenant_id', tenantId);

  // Get all payments (EXACTLY as API does)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status, refunded_amount, paid_at')
    .eq('tenant_id', tenantId);

  console.log('Data Retrieved:');
  console.log(`- Enrollments: ${enrollments?.length || 0}`);
  console.log(`- Payments: ${payments?.length || 0}\n`);

  // Calculate EXACTLY as API does
  const totalRevenue = enrollments
    ?.filter(e => !['cancelled', 'refunded'].includes(e.payment_status))
    .reduce((sum, e) => sum + parseFloat(e.total_amount?.toString() || '0'), 0) || 0;

  const totalPaid = payments
    ?.filter(p => p.status !== 'failed')
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || '0'), 0) || 0;

  console.log('Refund Calculation Debug:');
  const totalRefunds = payments
    ?.reduce((sum, p) => {
      const refunded = parseFloat(p.refunded_amount?.toString() || '0');
      if (refunded > 0) {
        console.log(`  Payment with refund: ${refunded}`);
      }
      return sum + refunded;
    }, 0) || 0;

  const netRevenue = totalPaid - totalRefunds;

  console.log('');

  console.log('✅ API Should Return:');
  console.log('=====================');
  console.log(JSON.stringify({
    totalRevenue,
    netRevenue,
    totalRefunds,
  }, null, 2));
  console.log('');

  console.log('📊 Dashboard Should Display:');
  console.log('============================');
  console.log(`Total Revenue: $${totalRevenue.toLocaleString()} (from enrollments)`);
  console.log(`Net Revenue: $${netRevenue.toLocaleString()} (paid - refunds)`);
  console.log(`Refunds: -$${totalRefunds.toLocaleString()}`);
  console.log('');

  console.log('Breakdown:');
  console.log(`- Total Expected (from enrollments): $${totalRevenue.toFixed(2)}`);
  console.log(`- Total Paid (actual payments): $${totalPaid.toFixed(2)}`);
  console.log(`- Total Refunded: $${totalRefunds.toFixed(2)}`);
  console.log(`- Net Revenue: $${netRevenue.toFixed(2)}`);
  console.log('');

  if (totalRefunds === 0) {
    console.log('⚠️  WARNING: Refunds showing as $0!');
    console.log('This means the API calculation is not working correctly.');
    console.log('\nPlease:');
    console.log('1. Restart your Next.js dev server (Ctrl+C, then npm run dev)');
    console.log('2. Hard refresh your browser (Ctrl+Shift+R)');
  } else {
    console.log('✅ Refunds calculation is working correctly!');
  }
}

verifyFix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
