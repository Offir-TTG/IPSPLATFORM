/**
 * Fix Stripe Customer ID for user
 *
 * Updates the user's stripe_customer_id to use the correct customer
 * that has the saved payment method from the deposit payment.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStripeCustomerId() {
  const userEmail = 'offir.omer@gmail.com';
  const correctCustomerId = 'gcus_1SsV60EMmMuRaOH05TNFmsNQ'; // The customer with payment method

  console.log(`Fixing Stripe customer ID for ${userEmail}...\n`);

  // Get current user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('email', userEmail)
    .single();

  if (userError || !user) {
    console.error('❌ User not found:', userError);
    process.exit(1);
  }

  console.log('Current user data:');
  console.log(`  User ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Current Stripe Customer ID: ${user.stripe_customer_id || 'NULL'}`);
  console.log('');

  // Update to correct customer ID
  const { error: updateError } = await supabase
    .from('users')
    .update({ stripe_customer_id: correctCustomerId })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating user:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully updated user:');
  console.log(`  New Stripe Customer ID: ${correctCustomerId}`);
  console.log('');
  console.log('This customer has the saved payment method •••• 4242');
  console.log('Future installments will now charge this payment method automatically.');
}

fixStripeCustomerId();
