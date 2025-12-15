import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkProgramCourses() {
  console.log('Checking program_courses table...\n');

  const { data, count, error } = await supabase
    .from('program_courses')
    .select('*, programs(name), courses(title)', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total entries:', count);
  if (data && data.length > 0) {
    console.log('\nEntries:');
    data.forEach((entry: any) => {
      console.log(`  - Program: ${entry.programs?.name}`);
      console.log(`    Course: ${entry.courses?.title}`);
      console.log(`    Order: ${entry.order}, Required: ${entry.is_required}\n`);
    });
  } else {
    console.log('⚠️  No program-course relationships found!');
    console.log('\nYou need to add courses to programs.');
    console.log('When creating/editing a course, make sure to select a program.');
  }
}

checkProgramCourses();
