import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollment() {
  try {
    const token = 'GDuS4RSt_F2vkBGSI6bMCYwTXJSvlmxIyHkeHWxyHoU';
    
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, user_id, status, payment_complete, wizard_profile_data')
      .eq('enrollment_token', token)
      .single();

    console.log('\n=== Enrollment by Token ===\n');
    console.log('Enrollment ID:', enrollment?.id);
    console.log('User ID:', enrollment?.user_id);
    console.log('Status:', enrollment?.status);
    console.log('Payment Complete:', enrollment?.payment_complete);
    console.log('\nuser_id type:', typeof enrollment?.user_id);
    console.log('!!user_id:', !!enrollment?.user_id);
    console.log('\nShould Skip Password Step:', !!enrollment?.user_id ? 'YES' : 'NO');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnrollment();
