require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumn() {
  console.log('Adding stripe_customer_id column to users table...\n');

  try {
    // Add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

        CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
        ON users(stripe_customer_id)
        WHERE stripe_customer_id IS NOT NULL;
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard:');
      console.log(`
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;
      `);
      process.exit(1);
    }

    console.log('✅ Column added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard:');
    console.log(`
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;
    `);
  }
}

addColumn();
