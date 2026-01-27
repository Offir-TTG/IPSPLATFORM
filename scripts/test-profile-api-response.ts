/**
 * Test if profile page API returns refund data
 * Run: npx ts-node scripts/test-profile-api-response.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testProfileApi() {
  try {
    console.log('🧪 Testing profile page API response...\n');
    console.log('='.repeat(70));

    // Find the enrollment with the partial refund
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id, payment_schedule_id')
      .eq('id', '2f4e2318-0de5-44cd-ada0-6a1d53501bbd')
      .single();

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    console.log(`\n📋 Testing enrollment: ${payment.enrollment_id}`);
    console.log(`Schedule with refund: ${payment.payment_schedule_id}`);

    // Get tenant_id
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('tenant_id')
      .eq('id', payment.enrollment_id)
      .single();

    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    // Simulate what profile page API call does
    console.log('\n1️⃣  CALLING: /api/enrollments/' + payment.enrollment_id + '/payment');
    console.log('-'.repeat(70));

    // Get the actual schedule data
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', payment.enrollment_id)
      .order('payment_number', { ascending: true });

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return;
    }

    console.log(`Found ${scheduleData?.length} schedules for this enrollment`);

    // Get payments to enrich
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('enrollment_id', payment.enrollment_id)
      .order('created_at', { ascending: false });

    console.log(`Found ${payments?.length} payments for this enrollment`);

    // Simulate enrichment
    const paymentsBySchedule = new Map();
    payments?.forEach((p: any) => {
      if (p.payment_schedule_id) {
        paymentsBySchedule.set(p.payment_schedule_id, p);
      }
    });

    console.log('\n2️⃣  ENRICHED SCHEDULES');
    console.log('-'.repeat(70));

    const enrichedSchedules = scheduleData?.map((schedule: any) => {
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
    }) || [];

    // Find the schedule with refund
    const targetSchedule = enrichedSchedules.find((s: any) => s.id === payment.payment_schedule_id);

    if (targetSchedule) {
      console.log(`\nSchedule #${targetSchedule.payment_number}:`);
      console.log(`  ID: ${targetSchedule.id.substring(0, 8)}...`);
      console.log(`  Amount: $${targetSchedule.amount}`);
      console.log(`  Status: ${targetSchedule.status}`);
      console.log(`  Refunded Amount: ${targetSchedule.refunded_amount || 'MISSING'}`);
      console.log(`  Payment Status: ${targetSchedule.payment_status || 'MISSING'}`);

      if (targetSchedule.refunded_amount && targetSchedule.refunded_amount > 0) {
        console.log('\n✅ API WILL RETURN refund data!');
        console.log(`   Profile page should display: "Refunded: $${targetSchedule.refunded_amount}"`);
      } else {
        console.log('\n❌ API will NOT return refund data - enrichment failed!');
      }
    }

    console.log('\n3️⃣  WHAT BROWSER RECEIVES');
    console.log('-'.repeat(70));
    console.log('When browser calls /api/enrollments/' + payment.enrollment_id + '/payment');
    console.log('Response will have schedules array with:');
    console.log(JSON.stringify(enrichedSchedules.find((s: any) => s.id === payment.payment_schedule_id), null, 2));

    console.log('\n4️⃣  PROFILE PAGE DISPLAY CODE');
    console.log('-'.repeat(70));
    console.log('The code checks for:');
    console.log('  if (schedule.refunded_amount && schedule.refunded_amount > 0) {');
    console.log('    // Show: Refunded: $200.00');
    console.log('  }');

    if (targetSchedule?.refunded_amount && targetSchedule.refunded_amount > 0) {
      console.log('\n✅ Condition WILL BE TRUE - refund will display');
    } else {
      console.log('\n❌ Condition WILL BE FALSE - refund will NOT display');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 DEBUGGING STEPS:');
    console.log('='.repeat(70));
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Refresh the profile page');
    console.log('4. Look for: /api/enrollments/' + payment.enrollment_id + '/payment');
    console.log('5. Check the Response tab - search for "refunded_amount"');
    console.log('6. If missing, the API endpoint needs to be fixed');
    console.log('7. If present, check Console tab for JavaScript errors');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

testProfileApi();
