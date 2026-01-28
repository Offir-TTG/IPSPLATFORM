import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestDisputeInStripe() {
  console.log('🧪 Creating Test Dispute in Stripe\n');

  // Get Stripe credentials from database
  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('integration_key', 'stripe')
    .single();

  if (!integration?.credentials?.secret_key) {
    console.log('❌ Stripe not configured. Please add Stripe integration first.');
    return;
  }

  const stripe = new Stripe(integration.credentials.secret_key, {
    apiVersion: '2023-10-16',
  });

  try {
    // Step 1: Find a test payment
    console.log('1️⃣  Finding a test payment...');

    const { data: payments } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .not('stripe_payment_intent_id', 'is', null)
      .limit(1);

    if (!payments || payments.length === 0) {
      console.log('⚠️  No payments found. Creating a test charge first...\n');

      // Create a test charge
      console.log('2️⃣  Creating test charge...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 9999, // $99.99
        currency: 'usd',
        payment_method: 'pm_card_visa', // Test payment method
        confirm: true,
        description: 'Test charge for dispute testing',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          test: 'true',
          purpose: 'dispute-testing'
        }
      });

      console.log(`✅ Created charge: ${paymentIntent.latest_charge}`);

      // Step 3: Create dispute on this charge
      console.log('\n3️⃣  Creating dispute...');

      // Note: You can't directly create disputes via API
      // But you can use the Dashboard or CLI
      console.log('\n⚠️  Cannot create disputes directly via Stripe API.');
      console.log('\n📝 To create a dispute for this charge:');
      console.log(`   1. Go to: https://dashboard.stripe.com/test/payments/${paymentIntent.id}`);
      console.log(`   2. Scroll down to "Disputes" section`);
      console.log(`   3. Click "Create a test dispute"`);
      console.log(`   4. Select reason: "Fraudulent" (or any other)`);
      console.log(`   5. Click "Create dispute"`);
      console.log(`\n   OR use Stripe CLI:`);
      console.log(`   stripe trigger charge.dispute.created --override charge=${paymentIntent.latest_charge}`);

      return;
    }

    const paymentIntentId = payments[0].stripe_payment_intent_id;

    console.log(`✅ Found payment intent: ${paymentIntentId}`);

    // Get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge as string;

    console.log(`✅ Charge ID: ${chargeId}\n`);

    // Provide instructions
    console.log('📝 To create a dispute for this charge:');
    console.log(`\n   Option A - Stripe Dashboard:`);
    console.log(`   1. Go to: https://dashboard.stripe.com/test/payments/${paymentIntentId}`);
    console.log(`   2. Scroll down to "Disputes" section`);
    console.log(`   3. Click "Create a test dispute"`);
    console.log(`   4. Select reason and click "Create dispute"`);

    console.log(`\n   Option B - Stripe CLI:`);
    console.log(`   stripe trigger charge.dispute.created --override charge=${chargeId}`);

    console.log('\n✅ After creating the dispute:');
    console.log('   - Webhook will be sent to your endpoint');
    console.log('   - Check your webhook logs');
    console.log('   - Dispute will appear in /admin/payments/disputes');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

createTestDisputeInStripe().then(() => process.exit(0));
