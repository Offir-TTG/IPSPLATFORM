const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMeetingSettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('CHECKING MEETING DETAILS');
  console.log('='.repeat(80));

  // Get the specific lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('zoom_meeting_id', '89231935133')
    .single();

  if (lesson) {
    console.log('\nLesson Details:');
    console.log('  Title:', lesson.title);
    console.log('  Meeting ID:', lesson.zoom_meeting_id);
    console.log('  Join URL:', lesson.zoom_join_url);
    console.log('  Passcode:', lesson.zoom_passcode || 'None');
    console.log('  Start URL:', lesson.zoom_start_url || 'Not set');
    console.log('  Status:', lesson.status);
    console.log('  Type:', lesson.type);
  }

  console.log('\n' + '='.repeat(80));
  console.log('POTENTIAL ISSUES:');
  console.log('='.repeat(80));
  console.log('\nError 3712 can occur if:');
  console.log('  1. Meeting requires authentication (check Zoom meeting settings)');
  console.log('  2. Meeting is scheduled and hasn\'t started yet');
  console.log('  3. App is in wrong mode (should be Meeting SDK, not S2S OAuth)');
  console.log('  4. SDK credentials don\'t match the account that created the meeting');
  console.log('\nTRY THIS:');
  console.log('  - Join the meeting directly via Zoom client first');
  console.log('  - Check if meeting has "Only authenticated users can join" enabled');
  console.log('  - Verify the Zoom account used to create SDK app owns these meetings');
  console.log('='.repeat(80));
}

checkMeetingSettings().catch(console.error);
