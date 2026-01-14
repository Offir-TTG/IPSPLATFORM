require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function addFields() {
  console.log('Adding completion_benefit and access_duration fields to products table...\n');

  try {
    // First, let's check the current schema
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Error checking products table:', selectError);
      return;
    }

    console.log('Current product fields:', Object.keys(products[0] || {}));
    
    // Check if fields already exist
    if (products[0] && 'completion_benefit' in products[0]) {
      console.log('\n✓ completion_benefit field already exists');
    } else {
      console.log('\n✗ completion_benefit field does not exist - needs manual SQL migration');
    }

    if (products[0] && 'access_duration' in products[0]) {
      console.log('✓ access_duration field already exists');
    } else {
      console.log('✗ access_duration field does not exist - needs manual SQL migration');
    }

    console.log('\n📝 Please run this SQL manually in Supabase dashboard:');
    console.log('---');
    console.log(`
ALTER TABLE products
ADD COLUMN IF NOT EXISTS completion_benefit TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS access_duration TEXT DEFAULT 'lifetime';

UPDATE products
SET 
  completion_benefit = 'Certificate',
  access_duration = 'lifetime'
WHERE completion_benefit IS NULL OR access_duration IS NULL;
    `);
    console.log('---');

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

addFields();
