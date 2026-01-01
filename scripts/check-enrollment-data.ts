import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollmentData() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, user_id, wizard_profile_data')
      .eq('tenant_id', tenantId)
      .not('user_id', 'is', null);

    console.log('\n=== Enrollment Data ===\n');
    enrollments?.forEach(enrollment => {
      console.log(`Enrollment ID: ${enrollment.id}`);
      console.log(`User ID: ${enrollment.user_id}`);
      console.log('wizard_profile_data:', JSON.stringify(enrollment.wizard_profile_data, null, 2));
      console.log('---\n');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnrollmentData();
