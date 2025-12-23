require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDirectQuery() {
  const lessonId = '33929ae5-c945-4ab8-b8e1-4c623c3b9b32';

  console.log('Test 1: Direct query lessons with zoom_sessions join\n');

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, zoom_sessions(*)')
    .eq('id', lessonId);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Query successful');
    console.log('Lessons returned:', lessons.length);
    if (lessons.length > 0) {
      console.log('\nFirst lesson:');
      console.log('  Title:', lessons[0].title);
      console.log('  zoom_sessions:', lessons[0].zoom_sessions);
      if (lessons[0].zoom_sessions) {
        console.log('  zoom_sessions length:', lessons[0].zoom_sessions.length);
        if (lessons[0].zoom_sessions.length > 0) {
          console.log('\n  First session:');
          console.log('    platform:', lessons[0].zoom_sessions[0].platform);
          console.log('    daily_room_name:', lessons[0].zoom_sessions[0].daily_room_name);
          console.log('    zoom_meeting_id:', lessons[0].zoom_sessions[0].zoom_meeting_id);
        }
      }
    }
  }

  console.log('\n---\n');
  console.log('Test 2: Query zoom_sessions filtered by lesson_id\n');

  const { data: sessions, error: error2 } = await supabase
    .from('zoom_sessions')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error2) {
    console.error('❌ Error:', error2);
  } else {
    console.log('✅ Query successful');
    console.log('Sessions returned:', sessions.length);
    if (sessions.length > 0) {
      console.log('\nFirst session:');
      console.log('  platform:', sessions[0].platform);
      console.log('  daily_room_name:', sessions[0].daily_room_name);
      console.log('  lesson_id:', sessions[0].lesson_id);
    }
  }
}

checkDirectQuery();
