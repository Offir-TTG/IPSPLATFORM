/**
 * Script to test lesson deletion and see the actual error
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLessonDeletion() {
  console.log('Testing lesson deletion...\n');

  // Get a lesson to delete
  const { data: lessons, error: fetchError } = await supabase
    .from('lessons')
    .select('id, title')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError || !lessons || lessons.length === 0) {
    console.error('No lessons found to delete');
    return;
  }

  const lessonId = lessons[0].id;
  const lessonTitle = lessons[0].title;

  console.log(`Attempting to delete lesson: ${lessonTitle} (${lessonId})\n`);

  // Check what's referencing this lesson
  console.log('Checking references to this lesson:\n');

  const { data: zoomSessions } = await supabase
    .from('zoom_sessions')
    .select('id')
    .eq('lesson_id', lessonId);
  console.log(`  - zoom_sessions: ${zoomSessions?.length || 0} records`);

  const { data: lessonTopics } = await supabase
    .from('lesson_topics')
    .select('id')
    .eq('lesson_id', lessonId);
  console.log(`  - lesson_topics: ${lessonTopics?.length || 0} records`);

  // Check for other potential foreign keys
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('lesson_id', lessonId);
  console.log(`  - enrollments: ${enrollments?.length || 0} records`);

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('lesson_id', lessonId);
  console.log(`  - lesson_progress: ${progress?.length || 0} records`);

  const { data: attendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('lesson_id', lessonId);
  console.log(`  - attendance: ${attendance?.length || 0} records`);

  console.log('\n--- Attempting deletion in order ---\n');

  // Delete zoom_sessions
  console.log('1. Deleting zoom_sessions...');
  const { error: zoomError } = await supabase
    .from('zoom_sessions')
    .delete()
    .eq('lesson_id', lessonId);
  if (zoomError) {
    console.error('   ❌ Error:', zoomError.message);
  } else {
    console.log('   ✓ Done');
  }

  // Delete lesson_topics
  console.log('2. Deleting lesson_topics...');
  const { error: topicsError } = await supabase
    .from('lesson_topics')
    .delete()
    .eq('lesson_id', lessonId);
  if (topicsError) {
    console.error('   ❌ Error:', topicsError.message);
  } else {
    console.log('   ✓ Done');
  }

  // Delete enrollments
  console.log('3. Deleting enrollments...');
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .delete()
    .eq('lesson_id', lessonId);
  if (enrollmentError) {
    console.error('   ❌ Error:', enrollmentError.message);
  } else {
    console.log('   ✓ Done');
  }

  // Delete lesson_progress
  console.log('4. Deleting lesson_progress...');
  const { error: progressError } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('lesson_id', lessonId);
  if (progressError) {
    console.error('   ❌ Error:', progressError.message);
  } else {
    console.log('   ✓ Done');
  }

  // Delete attendance
  console.log('5. Deleting attendance...');
  const { error: attendanceError } = await supabase
    .from('attendance')
    .delete()
    .eq('lesson_id', lessonId);
  if (attendanceError) {
    console.error('   ❌ Error:', attendanceError.message);
  } else {
    console.log('   ✓ Done');
  }

  // Finally delete the lesson
  console.log('6. Deleting lesson...');
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (deleteError) {
    console.error('   ❌ Error:', deleteError.message);
    console.error('   Code:', deleteError.code);
    console.error('   Details:', deleteError.details);
    console.error('   Hint:', deleteError.hint);
  } else {
    console.log('   ✓ Lesson deleted successfully!');
  }
}

testLessonDeletion();
