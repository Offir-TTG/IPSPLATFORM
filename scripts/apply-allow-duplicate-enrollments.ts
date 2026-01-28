import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('🔧 Applying migration: Allow Duplicate Enrollments\n');
  console.log('='.repeat(60));

  try {
    console.log('Step 1: Dropping unique constraint...');

    // Drop the unique constraint using raw SQL query
    // We need to use the postgres client or raw query capability
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE enrollments
        DROP CONSTRAINT IF EXISTS enrollments_user_id_product_id_tenant_id_key;

        CREATE INDEX IF NOT EXISTS idx_enrollments_user_product_tenant
        ON enrollments(user_id, product_id, tenant_id)
        WHERE user_id IS NOT NULL;
      `
    });

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      console.log('\n⚠️  If exec_sql function does not exist, you need to run this SQL manually:');
      console.log('\n--- Copy and paste this into Supabase SQL Editor ---\n');
      console.log(`
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_user_id_product_id_tenant_id_key;

CREATE INDEX IF NOT EXISTS idx_enrollments_user_product_tenant
ON enrollments(user_id, product_id, tenant_id)
WHERE user_id IS NOT NULL;
      `);
      console.log('\n--- End of SQL ---\n');
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📝 Changes:');
    console.log('   - Dropped unique constraint: enrollments_user_id_product_id_tenant_id_key');
    console.log('   - Created non-unique index: idx_enrollments_user_product_tenant');
    console.log('   - Users can now have multiple enrollments for the same product');
    console.log('\n💡 Use cases now supported:');
    console.log('   - Parents enrolling multiple children');
    console.log('   - Re-enrollment after course completion');
    console.log('   - Multiple enrollments for different sessions');
    console.log('   - Group registrations');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  You need to run this SQL manually in Supabase SQL Editor:');
    console.log('\n--- Copy and paste this into Supabase SQL Editor ---\n');
    console.log(`
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_user_id_product_id_tenant_id_key;

CREATE INDEX IF NOT EXISTS idx_enrollments_user_product_tenant
ON enrollments(user_id, product_id, tenant_id)
WHERE user_id IS NOT NULL;
    `);
    console.log('\n--- End of SQL ---\n');
    process.exit(1);
  }
}

applyMigration().then(() => process.exit(0));
