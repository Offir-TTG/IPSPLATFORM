import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateStripeCustomerIds() {
  console.log('Starting Stripe customer ID migration...');

  // Get all enrollments that have a stripe_customer_id and a user_id
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('id, user_id, stripe_customer_id')
    .not('stripe_customer_id', 'is', null)
    .not('user_id', 'is', null);

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError);
    return;
  }

  console.log(`Found ${enrollments?.length || 0} enrollments with Stripe customer IDs`);

  if (!enrollments || enrollments.length === 0) {
    console.log('No enrollments to migrate');
    return;
  }

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const enrollment of enrollments) {
    console.log(`Processing enrollment ${enrollment.id}...`);

    // Check if user already has a stripe_customer_id
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', enrollment.user_id)
      .single();

    if (user?.stripe_customer_id) {
      if (user.stripe_customer_id === enrollment.stripe_customer_id) {
        console.log(`  ✓ User ${enrollment.user_id} already has correct customer ID`);
        skippedCount++;
      } else {
        console.log(`  ⚠️ User ${enrollment.user_id} has different customer ID:`);
        console.log(`     User table: ${user.stripe_customer_id}`);
        console.log(`     Enrollment: ${enrollment.stripe_customer_id}`);
        console.log(`     Skipping to avoid overwrite`);
        skippedCount++;
      }
      continue;
    }

    // Update user with stripe_customer_id from enrollment
    const { error: updateError } = await supabase
      .from('users')
      .update({ stripe_customer_id: enrollment.stripe_customer_id })
      .eq('id', enrollment.user_id);

    if (updateError) {
      console.error(`  ✗ Error updating user ${enrollment.user_id}:`, updateError);
      errorCount++;
    } else {
      console.log(`  ✓ Migrated customer ID ${enrollment.stripe_customer_id} to user ${enrollment.user_id}`);
      migratedCount++;
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${enrollments.length}`);
}

migrateStripeCustomerIds()
  .then(() => {
    console.log('\nMigration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
