ENGINEERING DOCUMENT — ZOOM INTEGRATION FOR MULTI-LESSON PROGRAMS

Title: Zoom Integration Architecture for Programs, Lessons, Recordings & Instructors
Author: Platform Engineering
Audience: Claude (development), Backend Engineers, Frontend Engineers
Purpose: Define how to implement Zoom meetings per lesson, secure recordings, and a single simple link for instructors, while keeping the LMS architecture clean and automated.

-----------------------------------------------------------------------
1. CORE GOALS
-----------------------------------------------------------------------

1) Each LESSON in the LMS has its own Zoom meeting.
2) Each Zoom meeting produces its own recording that is automatically mapped back to the correct lesson.
3) Students NEVER see raw Zoom links; all playback is done inside the platform via a secure container.
4) Instructors (doctors/professors) receive ONE simple link for the entire course and do NOT need to use the platform UI.
5) The system supports:
   - Multi-lesson courses (e.g., 15 lessons)
   - Zoom cloud recordings
   - Large files (1GB+)
   - Secure streaming
   - Webhooks
   - Audit logging

This document describes the data model, flows, and API endpoints Claude should implement.

-----------------------------------------------------------------------
2. CONTENT HIERARCHY (ALREADY IN PLACE)
-----------------------------------------------------------------------

The LMS content hierarchy:

Program → Course → Topic → Lesson

- Programs contain Courses
- Courses contain Topics
- Topics contain Lessons

Lessons are the unit that map to Zoom meetings and recordings.

No content is generated per user. Programs, courses, topics, and lessons are created once by admins.

-----------------------------------------------------------------------
3. ZOOM SESSIONS PER LESSON
-----------------------------------------------------------------------

Each LESSON that has a live session will have ONE associated Zoom meeting.

Table: zoom_sessions
--------------------
- id (uuid)
- lesson_id (uuid, FK lessons)
- zoom_meeting_id (string)          -- Zoom meeting ID
- zoom_meeting_uuid (string)        -- Zoom meeting UUID (used for recordings)
- join_url (string)                 -- Zoom join URL for students
- start_url (string)                -- Zoom host URL for instructor
- scheduled_start (timestamptz)     -- Lesson start datetime
- duration_minutes (int)
- recording_status (enum: 'none', 'pending', 'ready', 'failed')
- recording_files (jsonb, optional) -- Raw data from Zoom recording webhook
- recording_play_url (text, optional)
- recording_download_url (text, optional)
- storage_location (enum: 'zoom', 'supabase', 'external')
- created_at
- updated_at

Creation workflow:
- When admin creates or edits a Course and defines its Lessons + schedule, the backend:
  - Iterates over lessons that require live Zoom.
  - Calls Zoom API to CREATE a Zoom meeting for each lesson.
  - Stores zoom_meeting_id, zoom_meeting_uuid, join_url, start_url.

Important:
- There is ONE Zoom meeting per LESSON (not per Course).
- This enables per-lesson recording mapping and secure playback.

-----------------------------------------------------------------------
4. STUDENT ACCESS TO LIVE LESSONS
-----------------------------------------------------------------------

Students NEVER see raw Zoom URLs directly. They always access lessons via the LMS.

Frontend:
- Lesson page at: /student/lessons/[lessonId]
- Backend returns lesson data including whether a live session is scheduled and the timestamp.

When the session is live (current time within window around scheduled_start):
- Show a "Join Live Session" button.
- This button calls a backend endpoint that returns a SAFE join URL or redirects to it.

Backend endpoint (example):
- GET /api/lessons/[lessonId]/join

Flow:
1) Authenticate student.
2) Check user access to course/lesson via access layer (user_programs + user_course_overrides).
3) Load zoom_sessions for that lesson.
4) Option A: redirect student directly to join_url (not ideal for link sharing).
5) Option B (better): return a short-lived signed link on your own domain that proxies the join_url.

At minimum, the join_url should be only accessible to authenticated users through your LMS.

-----------------------------------------------------------------------
5. RECORDING WORKFLOW PER LESSON
-----------------------------------------------------------------------

Zoom recording model:
- Zoom records meetings in the cloud.
- Each meeting_uuid has its own recording bundle.
- Zoom sends a webhook when recording is completed.

We use the meeting_uuid to map recordings back to lessons via zoom_sessions.zoom_meeting_uuid.

Zoom webhook:
- event: 'recording.completed'
- payload.object.uuid = zoom_meeting_uuid
- payload.object.recording_files = [ ... ]
- payload.object.share_url or download_url

Webhook endpoint:
- POST /api/zoom/webhooks

Webhook flow:
1) Verify Zoom webhook signature (security).
2) If event == 'recording.completed':
   - Extract meeting_uuid = payload.object.uuid
   - Find zoom_session:
       SELECT * FROM zoom_sessions WHERE zoom_meeting_uuid = meeting_uuid
   - If found:
       - Update zoom_sessions:
           recording_status       = 'ready'
           recording_files        = payload.object.recording_files
           recording_play_url     = payload.object.share_url (if using Zoom playback)
           recording_download_url = first downloadable file URL (if needed)
           storage_location       = 'zoom'
   - Log audit event: 'zoom_recording_completed' with lesson_id, meeting_uuid.

From this point, the LMS knows that this lesson has a ready recording.

-----------------------------------------------------------------------
6. SECURE RECORDING PLAYBACK (NO PUBLIC ZOOM LINKS)
-----------------------------------------------------------------------

Goal:
- Students watch recordings INSIDE the platform.
- Students NEVER see or share raw Zoom playback URLs.
- Recordings are protected by the LMS auth + access rules.

Approach:
- Use a secure streaming proxy endpoint that:
  - Validates user
  - Validates access to the lesson
  - Fetches a temporary Zoom download/play URL
  - Streams the video to the browser

Frontend:
- Lesson page shows a <video> player with src pointing to:
  /api/lessons/[lessonId]/recording/stream

Example:
<video src="/api/lessons/123/recording/stream" controls />

Backend endpoint:
- GET /api/lessons/[lessonId]/recording/stream

Flow:
1) Authenticate user.
2) Validate they have access to the lesson (via access layer).
3) Load zoom_session by lessonId:
   - Check recording_status == 'ready'.
4) Obtain a fresh Zoom download URL:
   - Using Zoom API with JWT/OAuth token to get recording file's download_url or use the stored one if it's still valid.
5) Stream the recording to the client:
   - Pipe the Zoom response stream to the HTTP response.
   - Use proper headers for video streaming (Content-Type: video/mp4, range requests support if possible).
6) The browser sees a video file coming from YOUR domain and cannot see Zoom's real URL.

Benefits:
- Students cannot copy a Zoom share URL.
- Access is controlled entirely by your LMS.
- Works for large 1GB+ files due to streaming.
- Zoom remains the origin, you don't need to store video unless desired.

Optional:
- In the future, add watermarking overlays (student name, timestamp) to deter screen recording leaks.

-----------------------------------------------------------------------
7. OPTIONAL LONG-TERM STORAGE (SUPABASE)
-----------------------------------------------------------------------

If long-term archival is required (e.g., Zoom deletes recordings after a retention period), implement a background process that:

- Downloads recordings from Zoom using download_url in chunks.
- Uploads to Supabase Storage (or S3) using streaming.
- Updates zoom_sessions.storage_location = 'supabase' and sets a new recording_play_url pointing to the Supabase file.
- The same /recording/stream endpoint can switch logic:
  - If storage_location == 'zoom': proxy from Zoom.
  - If storage_location == 'supabase': stream from Supabase.

This is optional and can be implemented in a second phase.

-----------------------------------------------------------------------
8. INSTRUCTOR EXPERIENCE (ONE LINK FOR ENTIRE PROGRAM)
-----------------------------------------------------------------------

Constraint:
- Instructors (doctors/professors) are not comfortable with tech.
- They should receive ONE link for the whole program and use it every week.
- They should NOT be required to log into the platform or manage 15 Zoom links.

Solution:
- Create an "Instructor Bridge Link" per program (or per instructor+program).
- This is a single URL on YOUR platform that automatically routes them to the correct Zoom meeting for the current lesson.

Table: instructor_bridge_links
------------------------------
- id (uuid)
- program_id (uuid)
- instructor_id (uuid)
- bridge_slug (text, unique)   -- e.g. 'flagship2025-drsmith'
- created_at
- updated_at

Instructor link:
- URL: https://yourplatform.com/bridge/[bridge_slug]

Example:
- https://yourplatform.com/bridge/flagship2025

This is the only link the instructor needs. It can be sent before the program starts and it does not change.

Backend route:
- GET /bridge/[bridge_slug]

Flow:
1) Identify bridge_link by slug.
2) Load program + instructor from bridge_link.
3) Determine the current datetime.
4) Find which lesson in the program is currently scheduled OR next in a small time window.
   - SELECT * FROM lessons
     WHERE program_id = X
       AND scheduled_start is within [now - GRACE_BEFORE, now + GRACE_AFTER]
5) Get the corresponding zoom_session for that lesson.
6) Redirect instructor to zoom_sessions.start_url.
7) Log audit event: 'instructor_joined_lesson' with instructor_id, lesson_id, zoom_meeting_id.

If there is no matching lesson at this time:
- Show a simple message:
  "You have no live session scheduled right now. Your next session is on <date> at <time>."

Benefits:
- Instructor has one simple link for the whole semester.
- Instructors never see 15 different links.
- Schedule changes do NOT require sending a new link.
- Platform maintains per-lesson Zoom meetings for recordings and automation.

-----------------------------------------------------------------------
9. EMAIL FLOW FOR INSTRUCTORS
-----------------------------------------------------------------------

Before the program starts:

Send an email:

Subject:
  "Your Live Teaching Link for <Program Name>"

Body:
  Hello Dr. <Name>,

  Here is your single access link for all live sessions in the "<Program Name>":

  Click here to join your sessions:
  https://yourplatform.com/bridge/flagship2025

  Please use this same link each week at your scheduled class time.
  You do not need to log into any platform or manage multiple Zoom links.

  Thank you,
  The Parenting School Team

This email is generated once per instructor and does not change.

Optional:
- Attach an .ics calendar file with all sessions.
- Send automatic reminder emails 30 minutes before each session.

-----------------------------------------------------------------------
10. STUDENT LESSON PAGE BEHAVIOR
-----------------------------------------------------------------------

On the student side, the Lesson page should:

1) Show live attendance UI:
   - If current time is near scheduled_start:
     - Show a "Join Live Session" button.

2) Show recording playback UI:
   - If zoom_sessions.recording_status == 'ready':
     - Show a video player with src=/api/lessons/[lessonId]/recording/stream
   - If recording_status == 'pending':
     - Show "Recording will be available soon".

3) Hide all Zoom-specific details:
   - Never show raw meeting IDs or Zoom URLs.
   - All Zoom integration is hidden behind the LMS UI.

-----------------------------------------------------------------------
11. RELATIONSHIP TO ENROLLMENT & ACCESS LAYER
-----------------------------------------------------------------------

This Zoom architecture must work together with the enrollment and access layer:

- Only users with access to a program (via user_programs) and to a course (via program_courses + user_course_overrides) can see lessons and recordings.
- The /join and /recording/stream endpoints must:
  - Authenticate user
  - Resolve visibleCourses for that user
  - Check that the lesson belongs to a visible course
  - Only then allow join/stream

So access to live sessions and recordings is always determined by:
visibleCourses = (CoursesFromPrograms ∪ GrantedOverrides) − HiddenOverrides

-----------------------------------------------------------------------
12. IMPLEMENTATION NOTES FOR CLAUDE
-----------------------------------------------------------------------

When implementing this in code, Claude should:

1) Add and migrate the zoom_sessions table with fields exactly as described (or adapted to existing schema).
2) Implement helper functions:
   - createZoomMeetingForLesson(lesson)
   - fetchZoomRecordingForMeeting(meeting_uuid)
   - getCurrentLessonForBridgeLink(bridge_slug, now)

3) Implement endpoints:
   - POST /api/zoom/webhooks        -- handle recording.completed
   - GET  /api/lessons/[lessonId]/join
   - GET  /api/lessons/[lessonId]/recording/stream
   - GET  /bridge/[bridge_slug]

4) Always protect endpoints with:
   - Authentication
   - Access checks based on enrollment and overrides

5) Ensure that:
   - No raw Zoom URLs or meeting IDs are exposed in frontend HTML.
   - All streaming is done via the platform’s own domain.
   - Large-file streaming supports chunked transfer.

6) Maintain full audit logging for:
   - Meeting creation
   - Recording completion
   - Instructor bridge usage
   - Student joins and recording views (optional)

-----------------------------------------------------------------------
END OF DOCUMENT
-----------------------------------------------------------------------