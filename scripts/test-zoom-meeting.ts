/**
 * Script to test Zoom meeting creation
 */
import { ZoomService } from '@/lib/zoom/zoomService';

async function testZoomMeeting() {
  console.log('Testing Zoom meeting creation...\n');

  // Use one of the recent lessons
  const lessonId = '89b67cb3-fa8e-45ea-ae8f-77c84431b7ff';

  try {
    // Replace with your tenant ID
    const tenantId = 'your-tenant-id-here';
    const zoomService = new ZoomService(tenantId);
    const result = await zoomService.createMeetingForLesson(
      lessonId,
      {
        topic: 'Test Lesson Meeting',
        agenda: 'This is a test meeting',
        start_time: '2025-11-23T23:00:00+00:00',
        duration: 60,
        timezone: 'Asia/Jerusalem',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: false,
          waiting_room: true,
          auto_recording: 'none',
          audio: 'both',
        },
      }
    );

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✓ Zoom meeting created successfully!');
      console.log('Meeting ID:', result.data?.zoom_meeting_id);
      console.log('Join URL:', result.data?.join_url);
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

testZoomMeeting();
