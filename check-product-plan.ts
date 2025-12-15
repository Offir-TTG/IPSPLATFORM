import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductPlan() {
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', '1c641cbf-9719-4204-9c6c-d82631aece04')
    .single();

  if (!product) {
    console.log('Product not found');
    return;
  }

  console.log('📦 Product:', product.title);
  console.log('   Price:', product.price);
  console.log('   Payment Model:', product.payment_model);
  console.log('\n💳 Payment Plan (embedded):');
  console.log(JSON.stringify(product.payment_plan, null, 2));
}

checkProductPlan().catch(console.error);
