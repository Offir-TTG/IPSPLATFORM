/**
 * Check which enrollment the current user should see with the refund
 * Run: npx ts-node scripts/check-which-enrollment-has-refund.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEnrollment() {
  try {
    console.log('🔍 Checking which enrollment has the refund\n');
    console.log('='.repeat(70));

    // Find the payment with refund
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id, payment_schedule_id, refunded_amount')
      .eq('id', '2f4e2318-0de5-44cd-ada0-6a1d53501bbd')
      .single();

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    console.log(`\n📋 Payment with refund:`);
    console.log(`   Enrollment ID: ${payment.enrollment_id}`);
    console.log(`   Refunded Amount: $${payment.refunded_amount}`);

    // Get enrollment details
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('user_id, status, tenant_id')
      .eq('id', payment.enrollment_id)
      .single();

    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    console.log(`   User ID: ${enrollment.user_id}`);
    console.log(`   Status: ${enrollment.status}`);

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', enrollment.user_id)
      .single();

    if (user) {
      console.log(`   User: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    // Get product details
    const { data: product } = await supabase
      .from('enrollments')
      .select('products(title)')
      .eq('id', payment.enrollment_id)
      .single();

    if (product) {
      console.log(`   Product: ${(product as any).products?.title || 'Unknown'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 TO SEE THE REFUND IN THE UI:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Login as the user shown above');
    console.log('2. Go to: http://localhost:3000/profile?tab=billing');
    console.log('3. Look for the enrollment with the product shown above');
    console.log('4. Expand the payment history for that enrollment');
    console.log('5. Find Payment #5 (Due: June 24, 2026)');
    console.log('6. You should see "Refunded: $200.00" in purple text');
    console.log('');

    // Check what enrollment the currently viewed user is seeing
    console.log('\n🔍 CHECKING WHAT ENROLLMENT IS BEING VIEWED:');
    console.log('='.repeat(70));
    console.log('');
    console.log('The server logs show you accessed:');
    console.log('   /api/enrollments/ee34039c-ce0b-4f37-9bd0-b8b9e9a11055/payment');
    console.log('');
    console.log('But the enrollment with the refund is:');
    console.log('   /api/enrollments/d352121d-df2e-454c-bb3e-83a82ab82e25/payment');
    console.log('');

    // Check if both enrollments belong to the same user
    const { data: viewedEnrollment } = await supabase
      .from('enrollments')
      .select('user_id, products(title)')
      .eq('id', 'ee34039c-ce0b-4f37-9bd0-b8b9e9a11055')
      .single();

    if (viewedEnrollment && viewedEnrollment.user_id === enrollment.user_id) {
      console.log('✅ Both enrollments belong to the SAME user');
      console.log('   You need to look at the OTHER enrollment card on the page');
      console.log(`   Look for: ${(product as any).products?.title || 'the correct product'}`);
    } else if (viewedEnrollment) {
      console.log('❌ These enrollments belong to DIFFERENT users');
      console.log('   You are logged in as the wrong user');
      console.log(`   Switch to: ${user?.email}`);
    } else {
      console.log('❌ Could not find the viewed enrollment');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnrollment();
