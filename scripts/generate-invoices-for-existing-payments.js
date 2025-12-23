require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { getStripeClient } = require('./get-stripe-client');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateInvoicesForExistingPayments() {
  console.log('🔍 Finding existing payments without invoices...\n');

  try {
    // Get Stripe client from database credentials
    console.log('📡 Loading Stripe credentials from database...');
    const { stripe, config } = await getStripeClient();
    console.log(`✅ Stripe initialized for tenant: ${config.tenantId}\n`);

    // Get all successful payments with basic info
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, tenant_id, enrollment_id, amount, currency, payment_type, stripe_payment_intent_id, paid_at')
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

    console.log(`📊 Found ${payments.length} payments. Checking for existing invoices...\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const payment of payments) {
      // Get enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, user_id, product_id')
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
        .select('id, stripe_customer_id, first_name, last_name')
        .eq('id', enrollment.user_id)
        .single();

      if (userError || !user) {
        console.log(`⏭️  Skipping payment ${payment.id} - User not found`);
        skipped++;
        continue;
      }

      // Get product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title')
        .eq('id', enrollment.product_id)
        .single();

      if (productError || !product) {
        console.log(`⏭️  Skipping payment ${payment.id} - Product not found`);
        skipped++;
        continue;
      }

      // Skip if user doesn't have a Stripe customer ID
      if (!user?.stripe_customer_id) {
        console.log(`⏭️  Skipping payment ${payment.id} - No Stripe customer ID for user`);
        skipped++;
        continue;
      }

      try {
        // Check if an invoice already exists for this payment
        const existingInvoices = await stripe.invoices.list({
          customer: user.stripe_customer_id,
          limit: 100,
        });

        const hasInvoice = existingInvoices.data.some(inv =>
          inv.metadata.payment_intent_id === payment.stripe_payment_intent_id
        );

        if (hasInvoice) {
          console.log(`✓ Payment ${payment.id} already has an invoice`);
          skipped++;
          continue;
        }

        // Create invoice for this payment
        console.log(`📝 Creating invoice for payment ${payment.id} ($${payment.amount} ${payment.currency})...`);

        // Create invoice item
        const invoiceItem = await stripe.invoiceItems.create({
          customer: user.stripe_customer_id,
          amount: Math.round(payment.amount * 100),
          currency: payment.currency.toLowerCase(),
          description: `${product.title} - ${payment.payment_type}`,
          metadata: {
            tenant_id: payment.tenant_id,
            enrollment_id: payment.enrollment_id,
            payment_type: payment.payment_type,
            payment_intent_id: payment.stripe_payment_intent_id,
            payment_id: payment.id,
          },
        });

        // Create invoice
        const invoice = await stripe.invoices.create({
          customer: user.stripe_customer_id,
          collection_method: 'charge_automatically',
          auto_advance: false,
          metadata: {
            tenant_id: payment.tenant_id,
            enrollment_id: payment.enrollment_id,
            payment_type: payment.payment_type,
            payment_intent_id: payment.stripe_payment_intent_id,
            payment_id: payment.id,
          },
        });

        // Finalize the invoice
        await stripe.invoices.finalizeInvoice(invoice.id);

        // Mark as paid (since payment already happened)
        await stripe.invoices.pay(invoice.id, {
          paid_out_of_band: true,
        });

        console.log(`   ✅ Created invoice ${invoice.number} for payment ${payment.id}`);
        created++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`   ❌ Error creating invoice for payment ${payment.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} invoices`);
    console.log(`   ⏭️  Skipped: ${skipped} payments`);
    console.log(`   ❌ Errors: ${errors} failures`);
    console.log('='.repeat(60));

    if (created > 0) {
      console.log('\n🎉 Done! Users can now see their invoices in the billing tab.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
generateInvoicesForExistingPayments();
