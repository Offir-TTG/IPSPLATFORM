-- ============================================================================
-- ZOOM INTEGRATION MIGRATION
-- Adds zoom_sessions and instructor_bridge_links tables for enhanced Zoom support
-- ============================================================================

-- ============================================================================
-- 1. ZOOM_SESSIONS TABLE
-- Maps lessons to Zoom meetings with detailed recording tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zoom_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,

  -- Zoom meeting identifiers
  zoom_meeting_id TEXT NOT NULL,           -- Zoom numeric meeting ID (e.g., "1234567890")
  zoom_meeting_uuid TEXT NOT NULL,         -- Zoom UUID for recording mapping

  -- Meeting URLs
  join_url TEXT NOT NULL,                  -- URL for students to join
  start_url TEXT NOT NULL,                 -- URL for instructor/host to start

  -- Schedule information
  scheduled_start TIMESTAMPTZ NOT NULL,    -- When the meeting is scheduled
  duration_minutes INTEGER NOT NULL,       -- Planned duration

  -- Recording status and metadata
  recording_status TEXT NOT NULL DEFAULT 'none' CHECK (
    recording_status IN ('none', 'pending', 'ready', 'failed')
  ),
  recording_files JSONB DEFAULT '[]'::jsonb,  -- Raw recording data from Zoom webhook
  recording_play_url TEXT,                    -- Zoom cloud playback URL
  recording_download_url TEXT,                -- Zoom download URL
  storage_location TEXT DEFAULT 'zoom' CHECK (
    storage_location IN ('zoom', 'supabase', 'external')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_lesson_zoom UNIQUE(lesson_id),
  CONSTRAINT unique_zoom_meeting UNIQUE(zoom_meeting_id)
);

-- Index for quick lookup by meeting UUID (used in webhook processing)
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_meeting_uuid
  ON public.zoom_sessions(zoom_meeting_uuid);

-- Index for finding sessions by tenant
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_tenant
  ON public.zoom_sessions(tenant_id);

-- Index for finding sessions by recording status
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_recording_status
  ON public.zoom_sessions(recording_status);

-- ============================================================================
-- 2. INSTRUCTOR_BRIDGE_LINKS TABLE
-- One permanent link per program for instructors to access live sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.instructor_bridge_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Bridge link identifier (used in URL: /bridge/{bridge_slug})
  bridge_slug TEXT NOT NULL UNIQUE,        -- e.g., "flagship2025-drsmith"

  -- Configuration
  is_active BOOLEAN DEFAULT true,          -- Can be disabled without deleting
  grace_before_minutes INTEGER DEFAULT 15, -- How early instructor can join
  grace_after_minutes INTEGER DEFAULT 30,  -- How late system will redirect

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,                -- Track last access for analytics

  -- Constraints
  CONSTRAINT unique_program_instructor UNIQUE(program_id, instructor_id)
);

-- Index for quick lookup by slug (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_bridge_links_slug
  ON public.instructor_bridge_links(bridge_slug)
  WHERE is_active = true;

-- Index for finding links by program
CREATE INDEX IF NOT EXISTS idx_bridge_links_program
  ON public.instructor_bridge_links(program_id);

-- Index for finding links by instructor
CREATE INDEX IF NOT EXISTS idx_bridge_links_instructor
  ON public.instructor_bridge_links(instructor_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.zoom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_bridge_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for migration reruns)
DROP POLICY IF EXISTS "Users can view zoom sessions in their tenant" ON public.zoom_sessions;
DROP POLICY IF EXISTS "Admins can manage zoom sessions in their tenant" ON public.zoom_sessions;
DROP POLICY IF EXISTS "Users can view bridge links in their tenant" ON public.instructor_bridge_links;
DROP POLICY IF EXISTS "Admins can manage bridge links in their tenant" ON public.instructor_bridge_links;

-- Zoom sessions policies
CREATE POLICY "Users can view zoom sessions in their tenant"
  ON public.zoom_sessions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage zoom sessions in their tenant"
  ON public.zoom_sessions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Instructor bridge links policies
CREATE POLICY "Users can view bridge links in their tenant"
  ON public.instructor_bridge_links
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage bridge links in their tenant"
  ON public.instructor_bridge_links
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. UPDATED_AT TRIGGERS
-- Automatically update updated_at timestamp on record changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zoom_sessions_updated_at
  BEFORE UPDATE ON public.zoom_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_bridge_links_updated_at
  BEFORE UPDATE ON public.instructor_bridge_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get the current or next lesson for an instructor bridge link
CREATE OR REPLACE FUNCTION public.get_current_lesson_for_bridge(
  bridge_slug_param TEXT,
  now_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  lesson_id UUID,
  lesson_title TEXT,
  lesson_start_time TIMESTAMPTZ,
  zoom_start_url TEXT,
  zoom_join_url TEXT,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH bridge AS (
    SELECT
      b.program_id,
      b.grace_before_minutes,
      b.grace_after_minutes,
      b.id as bridge_id
    FROM public.instructor_bridge_links b
    WHERE b.bridge_slug = bridge_slug_param
      AND b.is_active = true
    LIMIT 1
  ),
  program_courses AS (
    SELECT c.id as course_id
    FROM bridge b
    INNER JOIN public.program_courses pc ON pc.program_id = b.program_id
    INNER JOIN public.courses c ON c.id = pc.course_id
  ),
  program_lessons AS (
    SELECT
      l.id,
      l.title,
      l.start_time,
      zs.start_url,
      zs.join_url,
      b.grace_before_minutes,
      b.grace_after_minutes
    FROM program_courses pc
    INNER JOIN public.modules m ON m.course_id = pc.course_id
    INNER JOIN public.lessons l ON l.module_id = m.id
    CROSS JOIN bridge b
    LEFT JOIN public.zoom_sessions zs ON zs.lesson_id = l.id
    WHERE l.start_time IS NOT NULL
      AND zs.start_url IS NOT NULL
  )
  SELECT
    pl.id,
    pl.title,
    pl.start_time,
    pl.start_url,
    pl.join_url,
    (
      pl.start_time - INTERVAL '1 minute' * pl.grace_before_minutes <= now_param
      AND pl.start_time + INTERVAL '1 minute' * pl.grace_after_minutes >= now_param
    ) as is_current
  FROM program_lessons pl
  WHERE
    -- Either currently within grace period
    (
      pl.start_time - INTERVAL '1 minute' * pl.grace_before_minutes <= now_param
      AND pl.start_time + INTERVAL '1 minute' * pl.grace_after_minutes >= now_param
    )
    -- Or upcoming within next 7 days
    OR (
      pl.start_time > now_param
      AND pl.start_time <= now_param + INTERVAL '7 days'
    )
  ORDER BY
    is_current DESC,  -- Current lessons first
    pl.start_time ASC -- Then by soonest
  LIMIT 1;

  -- Update last_used_at timestamp
  UPDATE public.instructor_bridge_links
  SET last_used_at = now_param
  WHERE bridge_slug = bridge_slug_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON public.zoom_sessions TO authenticated;
GRANT SELECT ON public.instructor_bridge_links TO authenticated;

-- Grant access to service role for backend operations
GRANT ALL ON public.zoom_sessions TO service_role;
GRANT ALL ON public.instructor_bridge_links TO service_role;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION public.get_current_lesson_for_bridge TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_lesson_for_bridge TO service_role;

COMMENT ON TABLE public.zoom_sessions IS 'Maps lessons to Zoom meetings with recording tracking';
COMMENT ON TABLE public.instructor_bridge_links IS 'Permanent links for instructors to access their program sessions';
COMMENT ON FUNCTION public.get_current_lesson_for_bridge IS 'Finds current or next lesson for instructor bridge access';
