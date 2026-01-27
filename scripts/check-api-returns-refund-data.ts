/**
 * Check if API returns refund data in schedule
 * Run: npx ts-node scripts/check-api-returns-refund-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkApiRefundData() {
  try {
    console.log('🔍 Checking if API returns refund data in schedules...\n');
    console.log('='.repeat(70));

    // Step 1: Find the payment and enrollment
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id, payment_schedule_id, refunded_amount')
      .eq('id', '2f4e2318-0de5-44cd-ada0-6a1d53501bbd')
      .single();

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    console.log(`\n📋 Test Data:`);
    console.log(`  Enrollment ID: ${payment.enrollment_id}`);
    console.log(`  Schedule ID: ${payment.payment_schedule_id}`);
    console.log(`  Refunded Amount: $${payment.refunded_amount}`);

    // Step 2: Query enrollment payment endpoint directly
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('tenant_id')
      .eq('id', payment.enrollment_id)
      .single();

    console.log(`  Tenant ID: ${enrollment?.tenant_id}`);

    // Step 3: Get schedule directly (without enrichment)
    console.log('\n1️⃣  SCHEDULE TABLE (Direct Query)');
    console.log('-'.repeat(70));

    const { data: scheduleRaw } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, payment_number')
      .eq('id', payment.payment_schedule_id)
      .single();

    if (scheduleRaw) {
      console.log(`Schedule ID: ${scheduleRaw.id.substring(0, 8)}...`);
      console.log(`  status: ${scheduleRaw.status}`);
      console.log(`  amount: ${scheduleRaw.amount}`);
      console.log(`  refunded_amount: NOT IN TABLE (needs enrichment)`);
    }

    // Step 4: Get payment record
    console.log('\n2️⃣  PAYMENT TABLE');
    console.log('-'.repeat(70));

    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('id, status, refunded_amount, refunded_at')
      .eq('payment_schedule_id', payment.payment_schedule_id)
      .single();

    if (paymentRecord) {
      console.log(`Payment ID: ${paymentRecord.id.substring(0, 8)}...`);
      console.log(`  status: ${paymentRecord.status}`);
      console.log(`  refunded_amount: ${paymentRecord.refunded_amount || 'NULL'}`);
      console.log(`  refunded_at: ${paymentRecord.refunded_at || 'NULL'}`);
    }

    // Step 5: Simulate enrichment logic
    console.log('\n3️⃣  ENRICHMENT LOGIC TEST');
    console.log('-'.repeat(70));

    const schedules = [scheduleRaw];
    const payments = [paymentRecord];

    const paymentsBySchedule = new Map();
    payments?.forEach((p: any) => {
      if (p && payment.payment_schedule_id) {
        paymentsBySchedule.set(payment.payment_schedule_id, p);
      }
    });

    const enrichedSchedules = schedules?.map((schedule: any) => {
      const p = paymentsBySchedule.get(schedule.id);

      if (p && (p.refunded_amount || p.status === 'refunded' || p.status === 'partially_refunded')) {
        return {
          ...schedule,
          refunded_amount: p.refunded_amount ? parseFloat(p.refunded_amount) : 0,
          refunded_at: p.refunded_at,
          refund_reason: p.refund_reason,
          payment_status: p.status,
        };
      }

      return schedule;
    });

    console.log('Enriched Schedule:');
    console.log(JSON.stringify(enrichedSchedules[0], null, 2));

    if (enrichedSchedules[0].refunded_amount) {
      console.log('\n✅ Enrichment WORKS! Schedule now has refunded_amount');
      console.log(`   Value: $${enrichedSchedules[0].refunded_amount}`);
    } else {
      console.log('\n❌ Enrichment FAILED! Schedule still missing refunded_amount');
    }

    // Step 6: Check what browser would receive
    console.log('\n4️⃣  WHAT BROWSER RECEIVES');
    console.log('-'.repeat(70));
    console.log('When profile page calls: /api/enrollments/' + payment.enrollment_id + '/payment');
    console.log('It should receive schedules with:');
    console.log('  - schedule.refunded_amount = ' + enrichedSchedules[0].refunded_amount);
    console.log('  - schedule.refunded_at = ' + enrichedSchedules[0].refunded_at);
    console.log('  - schedule.payment_status = ' + enrichedSchedules[0].payment_status);

    console.log('\n📱 UI DISPLAY:');
    console.log('  Payment #' + enrichedSchedules[0].payment_number);
    console.log('  $' + enrichedSchedules[0].amount);
    if (enrichedSchedules[0].refunded_amount && enrichedSchedules[0].refunded_amount > 0) {
      console.log('  Refunded: $' + enrichedSchedules[0].refunded_amount + ' (purple text)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 ACTION: Hard refresh browser (Ctrl+Shift+R)');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkApiRefundData();
