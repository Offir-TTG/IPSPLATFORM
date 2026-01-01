import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🔧 Running migration to add payment plan fields to products table...\n');

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        -- Add new columns to products table
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS default_payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS alternative_payment_plan_ids UUID[] DEFAULT '{}';

        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_products_default_payment_plan
        ON products(default_payment_plan_id)
        WHERE default_payment_plan_id IS NOT NULL;

        -- Add comments
        COMMENT ON COLUMN products.default_payment_plan_id IS 'Default/recommended payment plan for this product';
        COMMENT ON COLUMN products.alternative_payment_plan_ids IS 'Array of alternative payment plan IDs that users can choose from';
      `
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n⚠️  The "exec" RPC function might not exist.');
      console.log('Please run the SQL manually in Supabase SQL Editor:\n');
      console.log('=' .repeat(70));
      console.log(`
-- Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS default_payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS alternative_payment_plan_ids UUID[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_default_payment_plan
ON products(default_payment_plan_id)
WHERE default_payment_plan_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN products.default_payment_plan_id IS 'Default/recommended payment plan for this product';
COMMENT ON COLUMN products.alternative_payment_plan_ids IS 'Array of alternative payment plan IDs that users can choose from';
      `);
      console.log('=' .repeat(70));
      return;
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  ✓ default_payment_plan_id (UUID)');
    console.log('  ✓ alternative_payment_plan_ids (UUID[])');
    console.log('\nYou can now use payment plan templates in products.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

runMigration();
