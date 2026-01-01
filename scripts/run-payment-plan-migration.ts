import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPaymentPlanColumns() {
  try {
    console.log('Adding payment plan columns to products table...\n');

    // Note: Supabase JS client doesn't support DDL operations directly
    // You need to run this SQL in the Supabase SQL Editor:

    const sql = `
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
`;

    console.log('SQL to run in Supabase SQL Editor:\n');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\nInstructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('\nOr, run the migration file directly:');
    console.log('  supabase/SQL Scripts/20251126_add_product_payment_plans.sql');

  } catch (error) {
    console.error('Error:', error);
  }
}

addPaymentPlanColumns();
