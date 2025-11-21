/**
 * Script to test lesson deletion and identify what's preventing it
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLessonDeletion() {
  console.log('Testing lesson deletion...\n');

  // Use one of the recent lessons
  const lessonId = '89b67cb3-fa8e-45ea-ae8f-77c84431b7ff';

  // First, check what foreign key relationships exist
  console.log('Checking foreign key relationships for lesson:', lessonId);

  // Check zoom_sessions
  const { data: zoomSessions } = await supabase
    .from('zoom_sessions')
    .select('*')
    .eq('lesson_id', lessonId);
  console.log('  - zoom_sessions:', zoomSessions?.length || 0);

  // Check lesson_topics
  const { data: lessonTopics } = await supabase
    .from('lesson_topics')
    .select('*')
    .eq('lesson_id', lessonId);
  console.log('  - lesson_topics:', lessonTopics?.length || 0);

  // Check enrollments (if exists)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('lesson_id', lessonId);
  console.log('  - enrollments:', enrollments?.length || 0);

  console.log('\nAttempting to delete lesson_topics first...');
  const { error: topicsError } = await supabase
    .from('lesson_topics')
    .delete()
    .eq('lesson_id', lessonId);

  if (topicsError) {
    console.error('❌ Error deleting lesson_topics:', topicsError);
  } else {
    console.log('✓ lesson_topics deleted successfully');
  }

  console.log('\nAttempting to delete lesson...');
  const { error: lessonError } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (lessonError) {
    console.error('❌ Error deleting lesson:', lessonError);
    console.error('  Code:', lessonError.code);
    console.error('  Details:', lessonError.details);
    console.error('  Hint:', lessonError.hint);
    console.error('  Message:', lessonError.message);
  } else {
    console.log('✓ Lesson deleted successfully');
  }
}

testLessonDeletion();
