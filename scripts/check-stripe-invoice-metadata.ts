/**
 * Check Stripe invoice metadata for payment schedule linking
 * Run: npx ts-node scripts/check-stripe-invoice-metadata.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

async function checkInvoiceMetadata() {
  try {
    console.log('🔍 Checking Stripe invoice metadata...\n');

    const invoiceId = 'in_1StvIFEMmMuRaOH0yrPvryt0';

    const invoice = await stripe.invoices.retrieve(invoiceId);

    console.log('📋 Stripe Invoice:', invoiceId);
    console.log('  Status:', invoice.status);
    console.log('  Amount Due:', `$${(invoice.amount_due / 100).toFixed(2)}`);
    console.log('  Customer:', invoice.customer);
    console.log('  Metadata:', invoice.metadata || {});
    console.log('');

    if (invoice.metadata?.payment_schedule_id) {
      console.log('✅ payment_schedule_id found in metadata:', invoice.metadata.payment_schedule_id);
      console.log('   This invoice should be matched with payment schedule');
    } else {
      console.log('❌ payment_schedule_id NOT found in metadata');
      console.log('   This invoice will NOT be matched with payment schedule');
      console.log('   Therefore, "Pay Now" button will show instead of "Payment is being processed"');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkInvoiceMetadata();
