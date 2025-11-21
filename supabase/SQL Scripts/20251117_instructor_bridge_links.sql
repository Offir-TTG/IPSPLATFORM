-- ============================================================================
-- INSTRUCTOR BRIDGE LINKS TABLE
-- ============================================================================
-- Creates table for instructor bridge links that allow instructors to access
-- the correct Zoom meeting based on current time without logging into the platform
-- ============================================================================

-- Create instructor_bridge_links table
CREATE TABLE IF NOT EXISTS public.instructor_bridge_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bridge_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on bridge_slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_instructor_bridge_links_slug
  ON public.instructor_bridge_links(bridge_slug) WHERE is_active = true;

-- Create index on course_id for lookups
CREATE INDEX IF NOT EXISTS idx_instructor_bridge_links_course
  ON public.instructor_bridge_links(course_id);

-- Create index on tenant_id for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_instructor_bridge_links_tenant
  ON public.instructor_bridge_links(tenant_id);

-- Add RLS policies
ALTER TABLE public.instructor_bridge_links ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage bridge links within their tenant
CREATE POLICY "Admins can manage bridge links" ON public.instructor_bridge_links
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE user_id = auth.uid()
        AND tenant_id = instructor_bridge_links.tenant_id
        AND role IN ('admin', 'instructor')
    )
  );

-- Policy: Public read access to bridge links (for instructor access)
-- Note: This allows anyone with the slug to access it
-- Authentication happens in the application layer, not at DB level
CREATE POLICY "Public can read active bridge links" ON public.instructor_bridge_links
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_instructor_bridge_links_updated_at
  BEFORE UPDATE ON public.instructor_bridge_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.instructor_bridge_links IS
'Instructor bridge links provide a single URL for instructors to access their Zoom meetings without logging in';

