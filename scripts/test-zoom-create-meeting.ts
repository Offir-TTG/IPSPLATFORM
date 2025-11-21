/**
 * Script to test creating a Zoom meeting with actual API call
 */
import { zoomService } from '@/lib/zoom/zoomService';

async function testCreateMeeting() {
  console.log('Testing Zoom meeting creation with actual API call...\n');

  // Use a recent lesson
  const lessonId = '0dcc07ed-f8eb-426d-9351-ecdad436031f';

  try {
    console.log('Creating Zoom meeting for lesson:', lessonId);

    const result = await zoomService.createMeetingForLesson(
      lessonId,
      {
        topic: 'Test Meeting from Script',
        agenda: 'Testing Zoom integration',
        start_time: '2025-01-20T10:00:00Z',
        duration: 60,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'none',
          audio: 'both',
        },
      }
    );

    console.log('\n=== RESULT ===');
    console.log('Success:', result.success);

    if (result.success && result.data) {
      console.log('\n✓ Zoom meeting created successfully!');
      console.log('Meeting ID:', result.data.zoom_meeting_id);
      console.log('Join URL:', result.data.join_url);
      console.log('Start URL:', result.data.start_url);
    } else {
      console.log('\n❌ Failed to create Zoom meeting');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Exception occurred:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testCreateMeeting();
