/**
 * Check Webhook Data
 *
 * This script checks:
 * 1. Recent webhook events
 * 2. Payment records for a specific enrollment
 * 3. Enrollment payment status
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWebhookData(enrollmentId: string) {
  console.log('=== Webhook & Payment Diagnostic ===\n');
  console.log('Enrollment ID:', enrollmentId);
  console.log('');

  // 1. Check enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError) {
    console.error('❌ Error fetching enrollment:', enrollmentError);
    return;
  }

  console.log('1. Enrollment Status:');
  console.log('   Payment Status:', enrollment.payment_status);
  console.log('   Status:', enrollment.status);
  console.log('   Total Amount:', enrollment.total_amount);
  console.log('   Paid Amount:', enrollment.paid_amount);
  console.log('   Deposit Paid:', enrollment.deposit_paid);
  console.log('');

  // 2. Check payment schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('payment_number', { ascending: true });

  console.log('2. Payment Schedules:');
  console.log(`   Total schedules: ${schedules?.length || 0}`);
  const paidSchedules = schedules?.filter(s => s.status === 'paid') || [];
  console.log(`   Paid schedules: ${paidSchedules.length}`);

  if (paidSchedules.length > 0) {
    console.log('   Paid:');
    paidSchedules.forEach(s => {
      console.log(`     - #${s.payment_number}: $${s.amount} (${s.payment_type}) - ${s.paid_date}`);
    });
  }
  console.log('');

  // 3. Check payment records
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false });

  console.log('3. Payment Records:');
  console.log(`   Total payments: ${payments?.length || 0}`);

  if (payments && payments.length > 0) {
    payments.forEach((p, idx) => {
      console.log(`   Payment ${idx + 1}:`);
      console.log(`     Amount: $${p.amount} ${p.currency}`);
      console.log(`     Status: ${p.status}`);
      console.log(`     Method: ${p.payment_method}`);
      console.log(`     Stripe Intent: ${p.stripe_payment_intent_id}`);
      console.log(`     Created: ${p.created_at}`);
    });
  } else {
    console.log('   ❌ No payment records found!');
  }
  console.log('');

  // 4. Check recent webhook events
  const { data: webhooks } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'stripe')
    .order('processed_at', { ascending: false })
    .limit(5);

  console.log('4. Recent Webhook Events:');
  console.log(`   Total recent events: ${webhooks?.length || 0}`);

  if (webhooks && webhooks.length > 0) {
    webhooks.forEach((w, idx) => {
      const payload = w.payload as any;
      console.log(`   Event ${idx + 1}:`);
      console.log(`     Type: ${w.event_type}`);
      console.log(`     Processed: ${w.processed_at}`);

      if (payload?.data?.object) {
        const obj = payload.data.object;
        console.log(`     Payment Intent ID: ${obj.id}`);
        console.log(`     Amount: $${obj.amount ? obj.amount / 100 : 'N/A'}`);
        console.log(`     Status: ${obj.status}`);

        if (obj.metadata) {
          console.log(`     Metadata:`);
          console.log(`       - tenant_id: ${obj.metadata.tenant_id || 'MISSING ❌'}`);
          console.log(`       - enrollment_id: ${obj.metadata.enrollment_id || 'MISSING ❌'}`);
          console.log(`       - payment_type: ${obj.metadata.payment_type || 'MISSING ❌'}`);
          console.log(`       - schedule_id: ${obj.metadata.schedule_id || 'MISSING ❌'}`);
        }
      }
    });
  } else {
    console.log('   ⚠️  No webhook events found');
  }
  console.log('');

  // 5. Summary
  console.log('=== Summary ===');
  const expectedPaid = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const actualPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  console.log(`Expected paid (from schedules): $${expectedPaid.toFixed(2)}`);
  console.log(`Actual paid (from payments): $${actualPaid.toFixed(2)}`);
  console.log(`Enrollment paid_amount: $${enrollment.paid_amount}`);
  console.log('');

  if (paidSchedules.length > 0 && payments?.length === 0) {
    console.log('🔴 ISSUE: Payment schedules marked as paid, but NO payment records!');
    console.log('   → Webhook likely failed to create payment record');
    console.log('   → Check webhook logs for errors');
  } else if (paidSchedules.length > 0 && enrollment.paid_amount === 0) {
    console.log('🔴 ISSUE: Payments recorded, but enrollment not updated!');
    console.log('   → Webhook failed to update enrollment table');
  } else if (paidSchedules.length > 0 && payments && payments.length > 0 && enrollment.paid_amount > 0) {
    console.log('✅ All systems working correctly!');
  }
}

// Get enrollment ID from command line or use default
const enrollmentId = process.argv[2] || 'fe8cc3d2-5e25-4752-8b2d-70dda4ad5855';

checkWebhookData(enrollmentId).catch(console.error);
