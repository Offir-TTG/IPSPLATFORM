import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPayment() {
  try {
    // Get the paid payment we just created
    const { data: payment } = await supabase
      .from('payment_schedules')
      .select('id, enrollment_id, status, paid_date')
      .eq('status', 'paid')
      .limit(1)
      .single();

    console.log('\n=== Paid Payment ===');
    console.log('Payment ID:', payment?.id);
    console.log('Enrollment ID:', payment?.enrollment_id);
    console.log('Status:', payment?.status);
    console.log('Paid Date:', payment?.paid_date);

    if (payment?.enrollment_id) {
      // Check the enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, user_id')
        .eq('id', payment.enrollment_id)
        .single();

      console.log('\n=== Enrollment ===');
      console.log('Enrollment ID:', enrollment?.id);
      console.log('User ID:', enrollment?.user_id);

      if (enrollment?.user_id) {
        // Check the user
        const { data: user } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', enrollment.user_id)
          .single();

        console.log('\n=== User ===');
        console.log('User ID:', user?.id);
        console.log('Name:', `${user?.first_name} ${user?.last_name}`);
        console.log('Email:', user?.email);
      } else {
        console.log('\n⚠️  Enrollment has no user_id!');
      }
    }

    // Now test the actual query from the API
    console.log('\n=== Testing API Query ===');
    const { data: recentPayments, error } = await supabase
      .from('payment_schedules')
      .select(`
        id,
        amount,
        status,
        paid_date,
        enrollments!inner(
          users(first_name, last_name, email)
        )
      `)
      .eq('status', 'paid')
      .order('paid_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Query returned', recentPayments?.length, 'payments');
      console.log('Data:', JSON.stringify(recentPayments, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPayment();
