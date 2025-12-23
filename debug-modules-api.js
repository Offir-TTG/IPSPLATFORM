require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugModulesAPI() {
  console.log('Testing what the modules API returns...\n');

  // Find the lesson with Daily.co session
  const lessonId = '33929ae5-c945-4ab8-b8e1-4c623c3b9b32';

  // Get the lesson with course_id
  const { data: lesson } = await supabase
    .from('lessons')
    .select('course_id, title')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    console.log('❌ Lesson not found');
    return;
  }

  console.log(`Lesson: "${lesson.title}"`);
  console.log(`Course ID: ${lesson.course_id}\n`);

  // Query modules exactly like the API does
  const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

  const { data: modules, error } = await supabase
    .from('modules')
    .select(`*, lessons(${lessonsColumns}, lesson_topics(*), zoom_sessions(id, zoom_meeting_id, join_url, start_url, recording_status, daily_room_name, daily_room_url, platform))`)
    .eq('course_id', lesson.course_id)
    .order('order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching modules:', error);
    return;
  }

  console.log(`Found ${modules.length} modules\n`);

  // Find our specific lesson
  let foundLesson = null;
  for (const module of modules) {
    if (module.lessons) {
      for (const l of module.lessons) {
        if (l.id === lessonId) {
          foundLesson = l;
          console.log('✅ Found lesson in modules data!');
          console.log(`Module: "${module.title}"`);
          console.log(`Lesson: "${l.title}"`);
          console.log(`\nLesson data:`);
          console.log(`  zoom_meeting_id: ${l.zoom_meeting_id || 'NULL'}`);
          console.log(`  zoom_sessions: ${l.zoom_sessions ? `Array with ${l.zoom_sessions.length} items` : 'NULL'}`);

          if (l.zoom_sessions && l.zoom_sessions.length > 0) {
            console.log(`\nFirst zoom_session:`);
            console.log(`  id: ${l.zoom_sessions[0].id}`);
            console.log(`  platform: ${l.zoom_sessions[0].platform || 'NULL'}`);
            console.log(`  zoom_meeting_id: ${l.zoom_sessions[0].zoom_meeting_id || 'NULL'}`);
            console.log(`  daily_room_name: ${l.zoom_sessions[0].daily_room_name || 'NULL'}`);
            console.log(`  daily_room_url: ${l.zoom_sessions[0].daily_room_url || 'NULL'}`);
            console.log(`  join_url: ${l.zoom_sessions[0].join_url || 'NULL'}`);
            console.log(`  start_url: ${l.zoom_sessions[0].start_url || 'NULL'}`);
          } else {
            console.log('\n⚠️  zoom_sessions is empty or null!');
          }
          break;
        }
      }
      if (foundLesson) break;
    }
  }

  if (!foundLesson) {
    console.log('❌ Lesson not found in modules data');
  }
}

debugModulesAPI();
