-- ============================================================================
-- LESSON ZOOM CONFIGURATION AND TIMEZONE
-- Adds timezone and all Zoom meeting configuration columns to lessons table
-- ============================================================================

-- ============================================================================
-- 1. ADD TIMEZONE COLUMN
-- ============================================================================

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

COMMENT ON COLUMN public.lessons.timezone IS 'IANA timezone identifier for the lesson (e.g., America/New_York, Asia/Jerusalem)';

CREATE INDEX IF NOT EXISTS idx_lessons_timezone ON public.lessons(timezone);

-- ============================================================================
-- 2. ADD ZOOM SECURITY SETTINGS COLUMNS
-- ============================================================================

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS zoom_passcode TEXT,
ADD COLUMN IF NOT EXISTS zoom_waiting_room BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zoom_join_before_host BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zoom_mute_upon_entry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zoom_require_authentication BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.lessons.zoom_passcode IS 'Zoom meeting password (6-10 characters, optional)';
COMMENT ON COLUMN public.lessons.zoom_waiting_room IS 'Enable Zoom waiting room feature';
COMMENT ON COLUMN public.lessons.zoom_join_before_host IS 'Allow participants to join before host';
COMMENT ON COLUMN public.lessons.zoom_mute_upon_entry IS 'Mute all participants when they join';
COMMENT ON COLUMN public.lessons.zoom_require_authentication IS 'Require authentication to join meeting';

-- ============================================================================
-- 3. ADD ZOOM VIDEO/AUDIO SETTINGS COLUMNS
-- ============================================================================

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS zoom_host_video BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zoom_participant_video BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zoom_audio TEXT DEFAULT 'both' CHECK (zoom_audio IN ('both', 'telephony', 'voip'));

COMMENT ON COLUMN public.lessons.zoom_host_video IS 'Start video when host joins';
COMMENT ON COLUMN public.lessons.zoom_participant_video IS 'Start video when participants join';
COMMENT ON COLUMN public.lessons.zoom_audio IS 'Audio options: both (phone+computer), telephony (phone only), voip (computer only)';

-- ============================================================================
-- 4. ADD ZOOM RECORDING SETTINGS COLUMNS
-- ============================================================================

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS zoom_auto_recording TEXT DEFAULT 'none' CHECK (zoom_auto_recording IN ('none', 'local', 'cloud')),
ADD COLUMN IF NOT EXISTS zoom_record_speaker_view BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zoom_recording_disclaimer BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.lessons.zoom_auto_recording IS 'Automatic recording: none, local, or cloud';
COMMENT ON COLUMN public.lessons.zoom_record_speaker_view IS 'Record active speaker view with screen share';
COMMENT ON COLUMN public.lessons.zoom_recording_disclaimer IS 'Show recording disclaimer to participants';

-- ============================================================================
-- 5. CREATE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Index for finding lessons that require Zoom meetings
CREATE INDEX IF NOT EXISTS idx_lessons_has_zoom
  ON public.lessons(zoom_meeting_id)
  WHERE zoom_meeting_id IS NOT NULL;

-- Index for finding lessons with specific audio settings
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_audio
  ON public.lessons(zoom_audio);

-- Index for finding lessons with auto recording enabled
CREATE INDEX IF NOT EXISTS idx_lessons_zoom_recording
  ON public.lessons(zoom_auto_recording)
  WHERE zoom_auto_recording != 'none';
