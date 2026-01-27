/**
 * Test what the enrollment payment API returns
 * Run: npx ts-node scripts/test-enrollment-api-response.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { getEnrollmentPaymentDetails } from '../src/lib/payments/enrollmentService';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testApiResponse() {
  try {
    console.log('🧪 Testing enrollment payment API response...\n');
    console.log('='.repeat(70));

    // Find enrollment with the refunded payment
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id, payment_schedule_id')
      .eq('id', '2f4e2318-0de5-44cd-ada0-6a1d53501bbd')
      .single();

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    console.log(`\nEnrollment ID: ${payment.enrollment_id}`);
    console.log(`Schedule ID: ${payment.payment_schedule_id}`);

    // Get tenant_id for this enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('tenant_id')
      .eq('id', payment.enrollment_id)
      .single();

    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    console.log(`Tenant ID: ${enrollment.tenant_id}`);

    // Call the same function that the API endpoint calls
    console.log('\n📡 Calling getEnrollmentPaymentDetails...');
    const result = await getEnrollmentPaymentDetails(
      payment.enrollment_id,
      enrollment.tenant_id,
      supabase
    );

    console.log('\n✅ API Response:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🔍 Checking schedules for refund data...');
    console.log('-'.repeat(70));

    const targetSchedule = result.schedules.find((s: any) => s.id === payment.payment_schedule_id);

    if (targetSchedule) {
      console.log(`\nSchedule ${payment.payment_schedule_id.substring(0, 8)}...`);
      console.log(`  status: ${targetSchedule.status}`);
      console.log(`  amount: ${targetSchedule.amount}`);
      console.log(`  refunded_amount: ${targetSchedule.refunded_amount || 'MISSING'}`);
      console.log(`  refunded_at: ${targetSchedule.refunded_at || 'MISSING'}`);
      console.log(`  refund_reason: ${targetSchedule.refund_reason || 'MISSING'}`);
      console.log(`  payment_status: ${targetSchedule.payment_status || 'MISSING'}`);

      if (targetSchedule.refunded_amount) {
        console.log('\n✅ Refund data IS present in API response!');
        console.log('   UI should display: Refunded: $' + targetSchedule.refunded_amount);
      } else {
        console.log('\n❌ Refund data is MISSING from API response!');
        console.log('   Need to debug enrichment logic in enrollmentService.ts');
      }
    } else {
      console.log('\n❌ Target schedule not found in response');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  }
}

testApiResponse();
