// Quick script to check what sessions exist in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSessions() {
  console.log('Checking for lessons with meetings...\n');

  // Check lessons with zoom meetings
  const { data: zoomLessons, error: zoomError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      start_time,
      zoom_meeting_id,
      is_published,
      duration,
      modules!inner(
        id,
        title,
        is_published,
        courses!inner(
          id,
          title,
          is_active
        )
      )
    `)
    .not('zoom_meeting_id', 'is', null)
    .not('start_time', 'is', null)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (zoomError) {
    console.error('Error fetching Zoom lessons:', zoomError);
  } else {
    console.log(`Found ${zoomLessons?.length || 0} Zoom lessons with future start times:\n`);
    zoomLessons?.forEach(lesson => {
      console.log(`- ${lesson.title}`);
      console.log(`  Start: ${lesson.start_time}`);
      console.log(`  Zoom ID: ${lesson.zoom_meeting_id}`);
      console.log(`  Published: ${lesson.is_published}`);
      console.log(`  Module Published: ${lesson.modules.is_published}`);
      console.log(`  Course Active: ${lesson.modules.courses.is_active}`);
      console.log(`  Course: ${lesson.modules.courses.title}`);
      console.log('');
    });
  }

  // Check zoom_sessions table for Daily.co rooms
  const { data: dailySessions, error: dailyError } = await supabase
    .from('zoom_sessions')
    .select(`
      id,
      daily_room_name,
      daily_room_url,
      lesson_id,
      lessons!inner(
        id,
        title,
        start_time,
        is_published,
        modules!inner(
          id,
          is_published,
          courses!inner(
            id,
            title,
            is_active
          )
        )
      )
    `)
    .not('daily_room_name', 'is', null)
    .not('lessons.start_time', 'is', null);

  if (dailyError) {
    console.error('Error fetching Daily.co sessions:', dailyError);
  } else {
    console.log(`\nFound ${dailySessions?.length || 0} Daily.co sessions:\n`);
    dailySessions?.forEach(session => {
      const lesson = session.lessons;
      const isFuture = new Date(lesson.start_time) > new Date();
      console.log(`- ${lesson.title}`);
      console.log(`  Start: ${lesson.start_time} ${isFuture ? '(FUTURE)' : '(PAST)'}`);
      console.log(`  Daily Room: ${session.daily_room_name}`);
      console.log(`  Daily URL: ${session.daily_room_url}`);
      console.log(`  Published: ${lesson.is_published}`);
      console.log(`  Module Published: ${lesson.modules.is_published}`);
      console.log(`  Course Active: ${lesson.modules.courses.is_active}`);
      console.log('');
    });
  }

  // Check enrollments to see if user has any active enrollments
  console.log('\n--- Checking User Enrollments ---\n');
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      status,
      users!inner(email),
      courses!inner(title, is_active)
    `)
    .eq('status', 'active');

  if (enrollError) {
    console.error('Error fetching enrollments:', enrollError);
  } else {
    console.log(`Found ${enrollments?.length || 0} active enrollments:\n`);
    enrollments?.forEach(e => {
      console.log(`- User: ${e.users.email}`);
      console.log(`  Course: ${e.courses.title}`);
      console.log(`  Course Active: ${e.courses.is_active}`);
      console.log('');
    });
  }
}

checkSessions().catch(console.error);
