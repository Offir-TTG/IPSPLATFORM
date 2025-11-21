/**
 * Script to check recent lessons and their Zoom sessions
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentLessons() {
  console.log('Checking recent lessons...\n');

  // Get the 5 most recent lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, start_time, zoom_meeting_id, zoom_join_url, zoom_start_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (lessonsError) {
    console.error('❌ Error fetching lessons:', lessonsError);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.log('No lessons found');
    return;
  }

  console.log(`Found ${lessons.length} recent lessons:\n`);

  for (const lesson of lessons) {
    console.log(`Lesson: ${lesson.title}`);
    console.log(`  ID: ${lesson.id}`);
    console.log(`  Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`  Start Time: ${lesson.start_time}`);
    console.log(`  Zoom Meeting ID: ${lesson.zoom_meeting_id || 'Not set'}`);
    console.log(`  Zoom Join URL: ${lesson.zoom_join_url ? 'Present' : 'Missing'}`);
    console.log(`  Zoom Start URL: ${lesson.zoom_start_url ? 'Present' : 'Missing'}`);

    // Check for zoom_sessions record
    const { data: zoomSession, error: zoomError } = await supabase
      .from('zoom_sessions')
      .select('*')
      .eq('lesson_id', lesson.id)
      .single();

    if (zoomSession) {
      console.log(`  ✓ Zoom Session Found:`);
      console.log(`    - Zoom Meeting ID: ${zoomSession.zoom_meeting_id}`);
      console.log(`    - Join URL: ${zoomSession.join_url ? 'Present' : 'Missing'}`);
      console.log(`    - Start URL: ${zoomSession.start_url ? 'Present' : 'Missing'}`);
      console.log(`    - Recording Status: ${zoomSession.recording_status}`);
    } else {
      console.log(`  ✗ No Zoom Session found`);
      if (zoomError && zoomError.code !== 'PGRST116') {
        console.log(`    Error: ${zoomError.message}`);
      }
    }
    console.log('');
  }
}

checkRecentLessons();
