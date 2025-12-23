const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProgramCourses() {
  const programId = 'f39a6602-45bb-4966-b0ba-b8ed927120e9';
  
  console.log('Checking program:', programId);
  
  // Get program courses
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select('course_id, courses(id, title, is_active, is_published)')
    .eq('program_id', programId);
  
  console.log('\nProgram courses:', programCourses?.length || 0);
  programCourses?.forEach(pc => {
    console.log('  -', pc.courses.title, 
      '| Active:', pc.courses.is_active, 
      '| Published:', pc.courses.is_published);
  });
  
  // Get lessons for each course
  for (const pc of programCourses || []) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, is_published, modules(id, is_published)')
      .eq('modules.course_id', pc.course_id);
    
    const publishedLessons = lessons?.filter(l => 
      l.is_published && l.modules?.is_published
    ) || [];
    
    console.log(`\nLessons in "${pc.courses.title}":`, publishedLessons.length);
  }
}

checkProgramCourses();
