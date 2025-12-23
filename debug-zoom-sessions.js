require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugZoomSessions() {
  console.log('Fetching zoom_sessions data...\n');

  // Get all zoom_sessions with lesson details
  const { data: sessions, error } = await supabase
    .from('zoom_sessions')
    .select(`
      id,
      lesson_id,
      platform,
      zoom_meeting_id,
      daily_room_name,
      daily_room_url,
      daily_room_id,
      lessons (
        id,
        title,
        course_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${sessions.length} zoom_sessions records:\n`);

  sessions.forEach((session, i) => {
    console.log(`${i + 1}. ${session.lessons?.title || 'Unknown Lesson'}`);
    console.log(`   Platform: ${session.platform || 'NULL'}`);
    console.log(`   Zoom Meeting ID: ${session.zoom_meeting_id || 'NULL'}`);
    console.log(`   Daily Room Name: ${session.daily_room_name || 'NULL'}`);
    console.log(`   Daily Room URL: ${session.daily_room_url || 'NULL'}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Lesson ID: ${session.lesson_id}\n`);
  });

  // Count by platform
  const dailyCount = sessions.filter(s => s.platform === 'daily').length;
  const zoomCount = sessions.filter(s => s.platform === 'zoom').length;
  const nullCount = sessions.filter(s => !s.platform).length;

  console.log('\nSummary:');
  console.log(`  Daily.co: ${dailyCount}`);
  console.log(`  Zoom: ${zoomCount}`);
  console.log(`  No platform: ${nullCount}`);
}

debugZoomSessions();
