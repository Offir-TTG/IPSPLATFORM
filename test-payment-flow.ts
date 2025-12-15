/**
 * Test Payment Flow
 *
 * This script simulates the payment flow to verify each step works correctly.
 * Run this to test if payment intent creation works without the UI.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaymentFlow(enrollmentId?: string) {
  console.log('=== Payment Flow Test ===\n');

  // Step 1: Find enrollment
  let enrollment;
  if (enrollmentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, products(title)')
      .eq('id', enrollmentId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch enrollment:', error.message);
      return;
    }
    enrollment = data;
  } else {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, products(title)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Failed to fetch latest enrollment:', error.message);
      return;
    }
    enrollment = data;
  }

  console.log('1. Found Enrollment:');
  console.log(`   ID: ${enrollment.id}`);
  console.log(`   Product: ${(enrollment as any).products?.title || 'Unknown'}`);
  console.log(`   Token: ${enrollment.enrollment_token}`);
  console.log(`   Total: $${enrollment.total_amount}`);
  console.log(`   Paid: $${enrollment.paid_amount}`);
  console.log(`   Status: ${enrollment.payment_status}`);
  console.log('');

  // Step 2: Find payment schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('payment_number', { ascending: true });

  if (schedulesError) {
    console.error('❌ Failed to fetch schedules:', schedulesError.message);
    return;
  }

  console.log('2. Payment Schedules:');
  console.log(`   Total: ${schedules?.length || 0}`);

  const pendingSchedule = schedules?.find(s => s.status === 'pending');
  if (pendingSchedule) {
    console.log(`   Next pending: #${pendingSchedule.payment_number} - $${pendingSchedule.amount} (${pendingSchedule.payment_type})`);
    console.log(`   Schedule ID: ${pendingSchedule.id}`);
  } else {
    console.log('   ⚠️  No pending schedules found');
  }
  console.log('');

  // Step 3: Check Stripe integration
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', enrollment.tenant_id)
    .eq('integration_key', 'stripe')
    .single();

  if (integrationError) {
    console.error('❌ Failed to fetch Stripe integration:', integrationError.message);
    return;
  }

  console.log('3. Stripe Integration:');
  console.log(`   Enabled: ${integration.is_enabled ? '✅' : '❌'}`);
  console.log(`   Has Secret Key: ${integration.credentials?.secret_key ? '✅' : '❌'}`);
  console.log(`   Has Publishable Key: ${integration.credentials?.publishable_key ? '✅' : '❌'}`);
  console.log(`   Has Webhook Secret: ${integration.credentials?.webhook_secret ? '✅' : '❌'}`);

  if (integration.credentials?.webhook_secret) {
    const secret = integration.credentials.webhook_secret;
    console.log(`   Webhook Secret: ${secret.substring(0, 15)}...${secret.substring(secret.length - 10)}`);
  }
  console.log('');

  // Step 4: Test API endpoints (if there's a pending schedule)
  if (pendingSchedule && enrollment.enrollment_token) {
    console.log('4. Testing API Endpoints:');

    // Test payment info endpoint
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      console.log(`   Testing: GET ${baseUrl}/api/enrollments/token/${enrollment.enrollment_token}/payment`);

      const paymentInfoRes = await fetch(`${baseUrl}/api/enrollments/token/${enrollment.enrollment_token}/payment`);
      const paymentInfo = await paymentInfoRes.json();

      if (paymentInfoRes.ok) {
        console.log(`   ✅ Payment info endpoint working`);
        console.log(`      Schedules returned: ${paymentInfo.schedules?.length || 0}`);
        console.log(`      Product: ${paymentInfo.product?.title || 'Unknown'}`);
      } else {
        console.log(`   ❌ Payment info endpoint failed: ${paymentInfo.error || 'Unknown error'}`);
      }
      console.log('');

      // Test create-intent endpoint
      console.log(`   Testing: POST ${baseUrl}/api/enrollments/token/${enrollment.enrollment_token}/payment/create-intent`);

      const createIntentRes = await fetch(
        `${baseUrl}/api/enrollments/token/${enrollment.enrollment_token}/payment/create-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule_id: pendingSchedule.id }),
        }
      );
      const intentData = await createIntentRes.json();

      if (createIntentRes.ok) {
        console.log(`   ✅ Create payment intent endpoint working`);
        console.log(`      Payment Intent ID: ${intentData.payment_intent_id}`);
        console.log(`      Client Secret: ${intentData.clientSecret?.substring(0, 30)}...`);
        console.log(`      Publishable Key: ${intentData.publishableKey?.substring(0, 20)}...`);

        // Check if stored in schedule
        const { data: updatedSchedule } = await supabase
          .from('payment_schedules')
          .select('stripe_payment_intent_id')
          .eq('id', pendingSchedule.id)
          .single();

        if (updatedSchedule?.stripe_payment_intent_id) {
          console.log(`   ✅ Payment intent ID stored in schedule`);
        } else {
          console.log(`   ⚠️  Payment intent ID NOT stored in schedule`);
        }
      } else {
        console.log(`   ❌ Create payment intent failed: ${intentData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('   ❌ API test failed:', error.message);
    }
    console.log('');
  }

  // Step 5: Check recent webhook events
  const { data: webhooks } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'stripe')
    .order('processed_at', { ascending: false })
    .limit(3);

  console.log('5. Recent Webhook Events:');
  if (webhooks && webhooks.length > 0) {
    webhooks.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.event_type} - ${w.processed_at}`);
    });
  } else {
    console.log('   ⚠️  No webhook events found in database');
  }
  console.log('');

  // Summary
  console.log('=== Summary ===');
  const issues = [];

  if (!integration.is_enabled) issues.push('Stripe integration not enabled');
  if (!integration.credentials?.secret_key) issues.push('Missing Stripe secret key');
  if (!integration.credentials?.publishable_key) issues.push('Missing Stripe publishable key');
  if (!integration.credentials?.webhook_secret) issues.push('Missing webhook secret');
  if (!schedules || schedules.length === 0) issues.push('No payment schedules found');
  if (enrollment.payment_status === 'pending' && enrollment.paid_amount === 0) {
    issues.push('Enrollment unpaid');
  }

  if (issues.length === 0) {
    console.log('✅ All checks passed');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`   ❌ ${issue}`));
  }
}

// Get enrollment ID from command line or use latest
const enrollmentId = process.argv[2];

testPaymentFlow(enrollmentId).catch(console.error);
