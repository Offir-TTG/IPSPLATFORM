/**
 * Script to check all lessons in the database
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllLessons() {
  console.log('Checking all lessons in database...\n');

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, module_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lessons:', error);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.log('No lessons found in database');
    return;
  }

  console.log(`Found ${lessons.length} lessons:\n`);

  // Group by module
  const lessonsByModule: Record<string, any[]> = {};

  for (const lesson of lessons) {
    if (!lessonsByModule[lesson.module_id]) {
      lessonsByModule[lesson.module_id] = [];
    }
    lessonsByModule[lesson.module_id].push(lesson);
  }

  for (const [moduleId, moduleLessons] of Object.entries(lessonsByModule)) {
    console.log(`Module ${moduleId}: ${moduleLessons.length} lessons`);
    for (const lesson of moduleLessons) {
      console.log(`  - ${lesson.title} (${lesson.id})`);
    }
    console.log('');
  }

  // Check for zoom sessions
  const { data: zoomSessions } = await supabase
    .from('zoom_sessions')
    .select('lesson_id');

  console.log(`\nTotal zoom_sessions in database: ${zoomSessions?.length || 0}`);
}

checkAllLessons();
