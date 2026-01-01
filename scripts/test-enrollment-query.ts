import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnrollmentQuery() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('\n=== Testing Enrollment Query ===\n');

    // First, get enrollments without join
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, product_id, payment_plan_id')
      .eq('tenant_id', tenantId);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return;
    }

    console.log(`Found ${enrollments?.length || 0} enrollments`);
    if (enrollments && enrollments.length > 0) {
      console.log('First enrollment:', enrollments[0]);

      // Now try to get payment schedules for this enrollment
      const enrollmentId = enrollments[0].id;
      const { data: schedules, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select('id, amount, status, payment_type')
        .eq('enrollment_id', enrollmentId);

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
      } else {
        console.log(`\nFound ${schedules?.length || 0} payment schedules for enrollment`);
        if (schedules && schedules.length > 0) {
          schedules.forEach(s => {
            console.log(`  - $${s.amount} (${s.status}) - ${s.payment_type}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testEnrollmentQuery();
