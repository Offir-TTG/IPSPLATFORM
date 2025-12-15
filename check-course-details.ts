import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCourse() {
  const { data } = await supabase
    .from('courses')
    .select('id, title, program_id, is_standalone')
    .limit(1)
    .single();

  console.log('Course details:', JSON.stringify(data, null, 2));

  // Also check if we need to update this course
  if (data && data.program_id === null && !data.is_standalone) {
    console.log('\n⚠️  This course has NULL program_id but is NOT marked as standalone!');
    console.log('This course should either:');
    console.log('  1. Have a program_id assigned, OR');
    console.log('  2. Be marked as is_standalone = true');
  }
}

checkCourse();
