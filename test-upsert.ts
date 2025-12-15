import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  const upsertData = {
    language_code: 'he',
    translation_key: 'lms.courses.view_grid',
    translation_value: 'תצוגת כרטיסים - TEST',
    category: 'lms',
    context: 'admin',
    tenant_id: '70d86807-7e7c-49cd-8601-98235444e2ac',
    updated_at: new Date().toISOString(),
  };

  console.log('Testing upsert with data:', upsertData);

  // Test with standard upsert (should use the unique constraint automatically)
  const { data, error} = await supabase
    .from('translations')
    .upsert(upsertData)
    .select()
    .single();

  if (error) {
    console.error('Upsert error:', error);
  } else {
    console.log('Upsert successful!');
    console.log('Result:', data);
  }
}

testUpsert();
