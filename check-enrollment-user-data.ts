import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  // Pick one enrollment from the API response
  const enrollmentId = '7051d98f-6709-403a-9fbd-b4a7dcaa6e73';

  console.log('Checking enrollment data...\n');

  // Get the enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, user_id, product_id')
    .eq('id', enrollmentId)
    .single();

  if (enrollError) {
    console.error('Error fetching enrollment:', enrollError);
    return;
  }

  console.log('Enrollment:', enrollment);
  console.log('');

  if (!enrollment) {
    console.log('❌ Enrollment not found!');
    return;
  }

  // Check if user_id exists
  if (!enrollment.user_id) {
    console.log('⚠️  Enrollment has NO user_id!');
  } else {
    console.log('✅ Enrollment has user_id:', enrollment.user_id);

    // Try to fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', enrollment.user_id)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
    } else if (!user) {
      console.log('❌ User not found for user_id:', enrollment.user_id);
    } else {
      console.log('✅ User found:', user);
    }
  }

  console.log('');

  // Check product
  if (!enrollment.product_id) {
    console.log('⚠️  Enrollment has NO product_id!');
  } else {
    console.log('✅ Enrollment has product_id:', enrollment.product_id);

    // Try to fetch the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name')
      .eq('id', enrollment.product_id)
      .single();

    if (productError) {
      console.error('❌ Error fetching product:', productError);
    } else if (!product) {
      console.log('❌ Product not found for product_id:', enrollment.product_id);
    } else {
      console.log('✅ Product found:', product);
    }
  }
}

checkData().catch(console.error);
