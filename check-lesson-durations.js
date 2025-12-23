const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDurations() {
  const programId = 'f39a6602-45bb-4966-b0ba-b8ed927120e9';

  console.log('Checking lesson durations for program courses...\n');

  // Get program courses
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select('course_id, courses(id, title)')
    .eq('program_id', programId);

  let totalMinutes = 0;

  for (const pc of programCourses || []) {
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, is_published')
      .eq('course_id', pc.course_id)
      .eq('is_published', true);

    const moduleIds = modules?.map(m => m.id) || [];

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, duration')
      .in('module_id', moduleIds)
      .eq('is_published', true);

    const courseMinutes = lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0;

    console.log(`Course: ${pc.courses.title}`);
    console.log(`  Lessons: ${lessons?.length || 0}`);
    console.log(`  Total duration: ${courseMinutes} minutes (${(courseMinutes / 60).toFixed(1)} hours)`);
    console.log('');

    totalMinutes += courseMinutes;
  }

  console.log(`Total program duration: ${totalMinutes} minutes (${(totalMinutes / 60).toFixed(1)} hours)`);
}

checkDurations();
