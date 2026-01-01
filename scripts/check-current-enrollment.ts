import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollment() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, user_id, status, wizard_profile_data')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\n=== Recent Enrollments ===\n');
    enrollments?.forEach(enrollment => {
      console.log(`Enrollment ID: ${enrollment.id}`);
      console.log(`User ID: ${enrollment.user_id || 'NULL (new user)'}`);
      console.log(`Status: ${enrollment.status}`);
      console.log(`Has wizard_profile_data: ${!!enrollment.wizard_profile_data}`);
      const profileData = enrollment.wizard_profile_data || {};
      const isComplete = profileData.email && profileData.first_name && profileData.last_name && profileData.phone && profileData.address;
      console.log(`Profile complete: ${isComplete ? 'YES' : 'NO'}`);
      console.log('---\n');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnrollment();
