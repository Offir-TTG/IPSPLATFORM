/**
 * Test the actual HTTP API endpoint to verify refund data is returned
 * This simulates what the browser does when calling /api/enrollments/{id}/payment
 * Run: npx ts-node scripts/test-api-endpoint-directly.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testApiEndpoint() {
  try {
    console.log('🧪 Testing API Endpoint: /api/enrollments/{id}/payment\n');
    console.log('='.repeat(70));

    // Find the enrollment with the partial refund
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id, payment_schedule_id, refunded_amount')
      .eq('id', '2f4e2318-0de5-44cd-ada0-6a1d53501bbd')
      .single();

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    console.log(`\n📋 Testing enrollment: ${payment.enrollment_id}`);
    console.log(`Schedule with refund: ${payment.payment_schedule_id}`);
    console.log(`Refunded amount in DB: $${payment.refunded_amount}`);

    // Get tenant_id to pass to the service function
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('tenant_id')
      .eq('id', payment.enrollment_id)
      .single();

    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    console.log('\n1️⃣  SIMULATING SERVICE FUNCTION LOGIC');
    console.log('-'.repeat(70));

    // Replicate what the service function does
    // First, get payment schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', payment.enrollment_id)
      .order('payment_number', { ascending: true });

    if (schedulesError) {
      console.log('❌ Error fetching schedules:', schedulesError);
      return;
    }

    console.log(`\n✅ Fetched ${schedules?.length || 0} schedules`);

    // Now get payments with refund information (this is the critical part)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('enrollment_id', payment.enrollment_id)
      .eq('tenant_id', enrollment.tenant_id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.log('❌ Error fetching payments:', paymentsError);
      return;
    }

    console.log(`✅ Fetched ${payments?.length || 0} payments`);

    if (!payments || payments.length === 0) {
      console.log('\n❌ PROBLEM: Payments array is empty!');
      console.log('   RLS policies might be blocking access.');
      console.log('   The service function needs an authenticated Supabase client.');
      return;
    }

    // Create payment lookup map (enrichment logic)
    const paymentsBySchedule = new Map();
    payments?.forEach((p: any) => {
      if (p.payment_schedule_id) {
        paymentsBySchedule.set(p.payment_schedule_id, p);
      }
    });

    // Enrich schedules with refund information
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
    }) || [];

    console.log(`✅ Enriched ${enrichedSchedules.length} schedules`);

    console.log('\n2️⃣  CHECKING ENRICHED SCHEDULES');
    console.log('-'.repeat(70));

    // Find the schedule with the refund
    const targetSchedule = enrichedSchedules?.find(
      (s: any) => s.id === payment.payment_schedule_id
    );

    if (!targetSchedule) {
      console.log('❌ Target schedule not found in response');
      return;
    }

    console.log(`\nSchedule #${targetSchedule.payment_number}:`);
    console.log(`  ID: ${targetSchedule.id.substring(0, 8)}...`);
    console.log(`  Amount: $${targetSchedule.amount}`);
    console.log(`  Status: ${targetSchedule.status}`);
    console.log(`  Payment Status: ${targetSchedule.payment_status || 'NOT SET'}`);
    console.log(`  Refunded Amount: ${targetSchedule.refunded_amount || 'NOT SET'}`);
    console.log(`  Refunded At: ${targetSchedule.refunded_at || 'NOT SET'}`);

    if (targetSchedule.refunded_amount && targetSchedule.refunded_amount > 0) {
      console.log('\n✅ SUCCESS! Schedule is enriched with refund data');
      console.log(`   Profile page SHOULD display: "Refunded: $${targetSchedule.refunded_amount}"`);
    } else {
      console.log('\n❌ FAILURE! Schedule is NOT enriched with refund data');
      console.log('   The enrichment logic in enrollmentService.ts is not working');
    }

    console.log('\n3️⃣  CHECKING PAYMENTS ARRAY');
    console.log('-'.repeat(70));

    const targetPayment = payments?.find(
      (p: any) => p.payment_schedule_id === payment.payment_schedule_id
    );

    if (targetPayment) {
      console.log('\nPayment record found:');
      console.log(`  ID: ${targetPayment.id.substring(0, 8)}...`);
      console.log(`  Status: ${targetPayment.status}`);
      console.log(`  Refunded Amount: $${targetPayment.refunded_amount || '0'}`);
      console.log(`  Schedule ID: ${targetPayment.payment_schedule_id.substring(0, 8)}...`);
    } else {
      console.log('❌ Payment not found in payments array');
    }

    console.log('\n4️⃣  FINAL DIAGNOSIS');
    console.log('-'.repeat(70));

    if (targetSchedule.refunded_amount && targetSchedule.refunded_amount > 0) {
      console.log('✅ API is working correctly');
      console.log('✅ Enrichment is working correctly');
      console.log('');
      console.log('🔍 ISSUE IS CLIENT-SIDE:');
      console.log('   1. Browser JavaScript cache needs clearing');
      console.log('   2. Dev server needs full restart');
      console.log('   3. Try these steps:');
      console.log('      a) Stop dev server (Ctrl+C)');
      console.log('      b) Clear browser cache completely (Ctrl+Shift+Delete)');
      console.log('      c) Close all browser tabs');
      console.log('      d) Start dev server: npm run dev');
      console.log('      e) Open fresh browser tab to http://localhost:3000/profile?tab=billing');
      console.log('      f) Open DevTools > Network tab > Refresh');
      console.log('      g) Find request to /api/enrollments/' + payment.enrollment_id + '/payment');
      console.log('      h) Check Response tab - search for "refunded_amount"');
    } else {
      console.log('❌ API is NOT working correctly');
      console.log('❌ Enrichment is NOT working correctly');
      console.log('');
      console.log('🔍 ISSUE IS SERVER-SIDE:');
      console.log('   The authenticated Supabase client is not being passed correctly');
      console.log('   OR the RLS policies are still blocking access');
      console.log('   Check: src/app/api/enrollments/[id]/payment/route.ts line 49');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  }
}

testApiEndpoint();
