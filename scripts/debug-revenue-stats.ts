/**
 * Debug Revenue Stats
 * Check what data exists for revenue calculation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStats() {
  console.log('🔍 Debugging Revenue Stats...\n');

  // Get tenant
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant ID: ${tenantId}\n`);

  // Check enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('total_amount, paid_amount, payment_status')
    .eq('tenant_id', tenantId);

  console.log('📚 Enrollments:');
  console.log(`  Total: ${enrollments?.length || 0}`);

  if (enrollments && enrollments.length > 0) {
    enrollments.forEach((e, i) => {
      console.log(`  ${i + 1}. Total: $${e.total_amount}, Paid: $${e.paid_amount}, Status: ${e.payment_status}`);
    });

    const activeEnrollments = enrollments.filter(e => !['cancelled', 'refunded'].includes(e.payment_status));
    const totalRevenue = activeEnrollments.reduce((sum, e) => sum + parseFloat(e.total_amount?.toString() || '0'), 0);

    console.log(`  Active enrollments: ${activeEnrollments.length}`);
    console.log(`  Total Revenue (from enrollments): $${totalRevenue.toFixed(2)}`);
  }
  console.log('');

  // Check payment_schedules
  const { data: allSchedules } = await supabase
    .from('payment_schedules')
    .select('amount, status, paid_date')
    .eq('tenant_id', tenantId);

  console.log('📅 Payment Schedules:');
  console.log(`  Total: ${allSchedules?.length || 0}`);

  const paidSchedules = allSchedules?.filter(s => s.status === 'paid') || [];
  const totalFromSchedules = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);

  console.log(`  Paid: ${paidSchedules.length}`);
  console.log(`  Total amount from paid schedules: $${totalFromSchedules.toFixed(2)}`);
  console.log('');

  // Check payments table
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', tenantId);

  if (paymentsError) {
    console.log('❌ Error querying payments table:', paymentsError.message);
    console.log('   This table might not have tenant_id column\n');

    // Try without tenant_id filter
    const { data: allPayments } = await supabase
      .from('payments')
      .select('*');

    console.log('💳 Payments table (no tenant filter):');
    console.log(`  Total records: ${allPayments?.length || 0}`);

    if (allPayments && allPayments.length > 0) {
      console.log('  Sample record columns:', Object.keys(allPayments[0]));

      const withRefunds = allPayments.filter(p => p.refunded_amount && p.refunded_amount > 0);
      console.log(`  Records with refunds: ${withRefunds.length}`);

      if (withRefunds.length > 0) {
        const totalRefunds = withRefunds.reduce((sum, p) => sum + parseFloat(p.refunded_amount || 0), 0);
        console.log(`  Total refunded amount: $${totalRefunds.toFixed(2)}`);
      }
    }
  } else {
    console.log('💳 Payments table:');
    console.log(`  Total records: ${payments?.length || 0}`);

    if (payments && payments.length > 0) {
      console.log('  Sample record columns:', Object.keys(payments[0]));

      const withRefunds = payments.filter(p => p.refunded_amount && p.refunded_amount > 0);
      console.log(`  Records with refunds: ${withRefunds.length}`);

      if (withRefunds.length > 0) {
        const totalRefunds = withRefunds.reduce((sum, p) => sum + parseFloat(p.refunded_amount || 0), 0);
        console.log(`  Total refunded amount: $${totalRefunds.toFixed(2)}`);
      }
    }
  }

  console.log('');

  // Check new translations
  console.log('🌐 Checking translations:');
  const translationKeys = [
    'admin.payments.netRevenue',
    'admin.payments.grossRevenue',
    'admin.payments.refunds',
    'admin.payments.totalRefunded',
  ];

  for (const key of translationKeys) {
    const { data: trans } = await supabase
      .from('translations')
      .select('language_code, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key);

    if (trans && trans.length > 0) {
      console.log(`  ✓ ${key}:`);
      trans.forEach(t => console.log(`    ${t.language_code}: ${t.translation_value}`));
    } else {
      console.log(`  ✗ ${key}: NOT FOUND`);
    }
  }
}

debugStats()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
