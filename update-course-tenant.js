// Script to update existing course with tenant_id
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCourseTenant() {
  const courseId = '0bc6f75f-2c03-4c2e-927f-f8fce73dfa62';
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Updating course:', courseId);
  console.log('Setting tenant_id to:', tenantId);

  const { data, error } = await supabase
    .from('courses')
    .update({ tenant_id: tenantId })
    .eq('id', courseId)
    .select();

  if (error) {
    console.error('Error updating course:', error);
  } else {
    console.log('Course updated successfully:', data);
  }
}

updateCourseTenant();
