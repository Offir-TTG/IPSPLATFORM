const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fetchExistingRecording() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get meeting ID from command line
  const meetingId = process.argv[2];

  if (!meetingId) {
    console.error('ERROR: Please provide a meeting ID as an argument');
    console.log('\nUsage:');
    console.log('  node fetch-existing-recording.js MEETING_ID');
    console.log('\nExample:');
    console.log('  node fetch-existing-recording.js 89231935133');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('FETCHING EXISTING ZOOM RECORDING');
  console.log('='.repeat(80));
  console.log('\nMeeting ID:', meetingId);

  try {
    // Get Zoom integration credentials
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'zoom')
      .eq('is_enabled', true)
      .single();

    if (!integration) {
      console.error('Zoom integration not found or not enabled');
      process.exit(1);
    }

    const credentials = integration.credentials;
    if (!credentials.account_id || !credentials.client_id || !credentials.client_secret) {
      console.error('Zoom credentials are incomplete');
      process.exit(1);
    }

    console.log('\n✓ Zoom integration found');
    console.log('  Account ID:', credentials.account_id);

    // Get OAuth token
    console.log('\n→ Getting OAuth token...');
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=account_credentials&account_id=${credentials.account_id}`,
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Failed to get OAuth token:', error);
      process.exit(1);
    }

    const { access_token } = await tokenResponse.json();
    console.log('✓ OAuth token obtained');

    // Get meeting recordings
    console.log('\n→ Fetching recordings for meeting...');
    const recordingsResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!recordingsResponse.ok) {
      const error = await recordingsResponse.json();
      console.error('Failed to fetch recordings:', error);
      if (recordingsResponse.status === 404) {
        console.log('\n⚠️  This could mean:');
        console.log('  1. No recording exists for this meeting');
        console.log('  2. Recording is still processing (wait 5-10 minutes)');
        console.log('  3. Meeting ID is incorrect');
        console.log('  4. Recording was not saved to cloud');
      }
      process.exit(1);
    }

    const recordingData = await recordingsResponse.json();
    console.log('✓ Recordings found!');

    console.log('\n' + '='.repeat(80));
    console.log('RECORDING DETAILS');
    console.log('='.repeat(80));
    console.log('\nTopic:', recordingData.topic);
    console.log('Start Time:', recordingData.start_time);
    console.log('Duration:', recordingData.duration, 'minutes');
    console.log('Recording Count:', recordingData.recording_count);
    console.log('Share URL:', recordingData.share_url || 'N/A');

    console.log('\nRecording Files:');
    recordingData.recording_files?.forEach((file, index) => {
      console.log(`\n  ${index + 1}. ${file.file_type} (${file.file_extension || 'N/A'})`);
      console.log(`     Size: ${(file.file_size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     Play URL: ${file.play_url || 'N/A'}`);
      console.log(`     Download URL: ${file.download_url || 'N/A'}`);
    });

    // Find zoom_session for this meeting
    console.log('\n' + '='.repeat(80));
    console.log('UPDATING DATABASE');
    console.log('='.repeat(80));

    const { data: zoomSession } = await supabase
      .from('zoom_sessions')
      .select('*')
      .eq('zoom_meeting_id', meetingId)
      .single();

    if (!zoomSession) {
      console.log('\n⚠️  No zoom_session found for this meeting ID');
      console.log('This meeting may not have been created through the system.');
      process.exit(0);
    }

    console.log('\n✓ Zoom session found');
    console.log('  Lesson ID:', zoomSession.lesson_id);

    // Extract recording URLs
    const playUrl = recordingData.share_url || recordingData.recording_files?.[0]?.play_url;
    const downloadUrl = recordingData.recording_files?.find(f => f.file_type === 'MP4')?.download_url;

    // Update zoom_session
    const { error: updateError } = await supabase
      .from('zoom_sessions')
      .update({
        recording_status: 'ready',
        recording_files: recordingData.recording_files,
        recording_play_url: playUrl,
        recording_download_url: downloadUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', zoomSession.id);

    if (updateError) {
      console.error('Error updating zoom_session:', updateError);
      process.exit(1);
    }

    console.log('✓ Zoom session updated');

    // Update lesson
    const { error: lessonError } = await supabase
      .from('lessons')
      .update({
        recording_url: playUrl || downloadUrl,
        status: 'completed',
      })
      .eq('id', zoomSession.lesson_id);

    if (lessonError) {
      console.error('Error updating lesson:', lessonError);
      process.exit(1);
    }

    console.log('✓ Lesson updated');

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS! Recording fetched and saved to database');
    console.log('='.repeat(80));
    console.log('\nRecording URL:', playUrl || downloadUrl);
    console.log('\nYou can now view the recording in your application!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fetchExistingRecording().catch(console.error);
