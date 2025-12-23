require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { getStripeClient } = require('./get-stripe-client');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillStripeCustomerIds() {
  console.log('🔍 Finding users with payments but no stripe_customer_id...\n');

  try {
    // Get Stripe client from database credentials
    console.log('📡 Loading Stripe credentials from database...');
    const { stripe, config } = await getStripeClient();
    console.log(`✅ Stripe initialized for tenant: ${config.tenantId}\n`);
    // Get all successful payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, enrollment_id, stripe_payment_intent_id')
      .eq('status', 'succeeded')
      .not('stripe_payment_intent_id', 'is', null)
      .order('paid_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
      return;
    }

    if (!payments || payments.length === 0) {
      console.log('✅ No payments found.');
      return;
    }

    console.log(`📊 Found ${payments.length} payments. Checking for missing customer IDs...\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Track users we've already processed
    const processedUsers = new Set();

    for (const payment of payments) {
      try {
        // Get enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, user_id')
          .eq('id', payment.enrollment_id)
          .single();

        if (enrollmentError || !enrollment) {
          console.log(`⏭️  Skipping payment ${payment.id} - Enrollment not found`);
          skipped++;
          continue;
        }

        // Get user
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, stripe_customer_id, email')
          .eq('id', enrollment.user_id)
          .single();

        if (userError || !user) {
          console.log(`⏭️  Skipping payment ${payment.id} - User not found`);
          skipped++;
          continue;
        }

        // Skip if already processed
        if (processedUsers.has(user.id)) {
          continue;
        }

        // Skip if user already has a customer ID
        if (user.stripe_customer_id) {
          console.log(`✓ User ${user.email} already has customer ID: ${user.stripe_customer_id}`);
          processedUsers.add(user.id);
          skipped++;
          continue;
        }

        // Fetch payment intent from Stripe to get or create customer ID
        console.log(`🔎 Fetching payment intent ${payment.stripe_payment_intent_id}...`);
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id
        );

        let customerId = paymentIntent.customer;

        // If payment has no customer, create one for this user
        if (!customerId) {
          console.log(`⚠️  Payment has no customer - creating new Stripe customer for ${user.email}...`);

          // Get tenant_id from enrollment or payment metadata
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('tenant_id')
            .eq('id', enrollment.id)
            .single();

          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: user.id,
              tenant_id: enrollmentData?.tenant_id || paymentIntent.metadata?.tenant_id || '',
            },
          });

          customerId = customer.id;
          console.log(`   ✅ Created Stripe customer: ${customerId}`);
        }

        // Update user with Stripe customer ID
        console.log(`📝 Updating user ${user.email} with customer ID: ${customerId}`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);

        if (updateError) {
          console.error(`   ❌ Error updating user ${user.email}:`, updateError);
          errors++;
        } else {
          console.log(`   ✅ Updated user ${user.email} with customer ID ${customerId}`);
          updated++;
        }

        processedUsers.add(user.id);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error processing payment ${payment.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users (already had customer ID or no data)`);
    console.log(`   ❌ Errors: ${errors} failures`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n🎉 Done! Now you can run the invoice generation script.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
backfillStripeCustomerIds();
