import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const productId = '1c641cbf-9719-4204-9c6c-d82631aece04';

  console.log('Fetching product to see available columns...\n');

  // Fetch product with all columns
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('Product columns:');
    Object.keys(data).forEach(key => {
      console.log(`  - ${key}: ${typeof data[key]} ${data[key] === null ? '(null)' : ''}`);
    });

    console.log('\nProduct name/title field:');
    if ('name' in data) {
      console.log('  ✅ Has "name":', data.name);
    }
    if ('title' in data) {
      console.log('  ✅ Has "title":', data.title);
    }
  }
}

checkSchema().catch(console.error);
