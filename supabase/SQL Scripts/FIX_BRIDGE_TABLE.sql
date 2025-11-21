-- ============================================================================
-- FIX INSTRUCTOR_BRIDGE_LINKS TABLE
-- ============================================================================
-- Drop and recreate the table with all required columns
-- ============================================================================

-- Drop the existing table
DROP TABLE IF EXISTS public.instructor_bridge_links CASCADE;

-- Recreate with correct schema
CREATE TABLE public.instructor_bridge_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bridge_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_instructor_bridge_links_slug
  ON public.instructor_bridge_links(bridge_slug) WHERE is_active = true;

CREATE INDEX idx_instructor_bridge_links_course
  ON public.instructor_bridge_links(course_id);

CREATE INDEX idx_instructor_bridge_links_tenant
  ON public.instructor_bridge_links(tenant_id);

-- Enable RLS
ALTER TABLE public.instructor_bridge_links ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
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

-- Verify the table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'instructor_bridge_links'
ORDER BY ordinal_position;
