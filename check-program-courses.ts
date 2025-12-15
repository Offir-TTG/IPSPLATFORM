import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log('Checking programs and courses...\n');

  // Get programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .limit(5);

  console.log('Programs:', programs);

  if (programs && programs.length > 0) {
    console.log('\nChecking courses for first program:', programs[0].name);
    console.log('Program ID:', programs[0].id);
    
    // Get courses for first program
    const { data: courses, count } = await supabase
      .from('courses')
      .select('id, title, program_id', { count: 'exact' })
      .eq('program_id', programs[0].id);

    console.log('Courses with matching program_id:', courses);
    console.log('Count:', count);

    // Also check all courses to see their program_id values
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, title, program_id')
      .limit(10);

    console.log('\nAll courses (first 10):');
    allCourses?.forEach(c => {
      console.log(`  - ${c.title}: program_id = ${c.program_id}`);
    });
  }
}

checkData().catch(console.error);
