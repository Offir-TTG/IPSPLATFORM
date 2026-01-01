import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    // Get a payment schedule with all its fields
    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .limit(1)
      .single();

    console.log('=== Payment Schedule Structure ===');
    console.log(JSON.stringify(schedule, null, 2));

    // Try to get enrollment separately
    if (schedule && schedule.enrollment_id) {
      console.log('\n=== Fetching Related Enrollment ===');
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*, users(*)')
        .eq('id', schedule.enrollment_id)
        .single();

      console.log(JSON.stringify(enrollment, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();
