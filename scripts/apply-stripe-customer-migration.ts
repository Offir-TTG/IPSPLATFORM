/**
 * Apply migration: Add stripe_customer_id to enrollments table
 *
 * Run: npx ts-node scripts/apply-stripe-customer-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🔄 Applying migration: Add stripe_customer_id to enrollments table\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260123_add_stripe_customer_id_to_enrollments.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(migrationSql);
    console.log('\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the column was added
    const { data: columns, error: verifyError } = await supabase
      .from('enrollments')
      .select('stripe_customer_id')
      .limit(0);

    if (verifyError) {
      console.error('⚠️  Warning: Could not verify column (this might be normal):', verifyError.message);
    } else {
      console.log('✅ Verified: stripe_customer_id column exists in enrollments table\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
