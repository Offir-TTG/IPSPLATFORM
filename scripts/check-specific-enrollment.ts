import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollment() {
  try {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, user_id, status, payment_complete, wizard_profile_data')
      .eq('id', '08fbe506-4b1c-4053-9d83-523357bf8cc2')
      .single();

    console.log('\n=== Enrollment Details ===\n');
    console.log('Enrollment ID:', enrollment?.id);
    console.log('User ID:', enrollment?.user_id || 'NULL');
    console.log('Status:', enrollment?.status);
    console.log('Payment Complete:', enrollment?.payment_complete);
    console.log('Has wizard_profile_data:', !!enrollment?.wizard_profile_data);
    console.log('\nIs Existing User (!!user_id):', !!enrollment?.user_id);
    console.log('Should Skip Password:', !!enrollment?.user_id ? 'YES' : 'NO');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnrollment();
