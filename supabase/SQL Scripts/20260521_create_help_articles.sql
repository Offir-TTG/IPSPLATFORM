-- =====================================================================
-- Help articles: in-app user manual for admin pages.
-- =====================================================================
-- One article per (slug, locale). slug is the stable identifier
-- referenced by `useHelp(slug)` calls on admin pages. locale is 'en'
-- or 'he'. Content is markdown stored as text — rendered client-side
-- by a small inline renderer.
--
-- page_slugs (array): which admin pages auto-open this article when
--   the user clicks the (?) icon on that page. A page can map to any
--   article; an article can serve any number of pages.
-- related_slugs (array): "see also" suggestions shown at the bottom
--   of the article body. Must be valid slugs (validated client-side).
-- category: high-level grouping ('LMS', 'Payments', 'Settings', ...)
--   used for the "Browse all" view in the help drawer.
-- display_order: ascending sort within a category for the browse view.
--
-- Articles are TENANT-AGNOSTIC for v1 (per product decision: all
-- tenants share the same manual). No tenant_id column. Phase 3 can
-- add an optional tenant_id for per-tenant overrides without breaking
-- the unique (slug, locale) constraint here.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.help_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL,
  locale          text NOT NULL CHECK (locale IN ('en', 'he')),
  title           text NOT NULL,
  body_markdown   text NOT NULL,
  category        text,
  related_slugs   text[] NOT NULL DEFAULT '{}',
  page_slugs      text[] NOT NULL DEFAULT '{}',
  display_order   int    NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale)
);

-- Slug+locale lookups are the hot path (drawer opens, page-mapped fetch).
CREATE INDEX IF NOT EXISTS help_articles_slug_locale_idx
  ON public.help_articles (slug, locale);

-- GIN index on page_slugs so we can answer "what article opens by default
-- on /admin/grading/scales?" in one query: WHERE 'grading-scales' = ANY(page_slugs).
CREATE INDEX IF NOT EXISTS help_articles_page_slugs_gin_idx
  ON public.help_articles USING gin (page_slugs);

-- Category browse: ORDER BY category, display_order on the "Browse all" view.
CREATE INDEX IF NOT EXISTS help_articles_category_order_idx
  ON public.help_articles (category, display_order);

-- Trigger to keep updated_at in sync on every UPDATE.
CREATE OR REPLACE FUNCTION help_articles_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS help_articles_updated_at_trg ON public.help_articles;
CREATE TRIGGER help_articles_updated_at_trg
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION help_articles_set_updated_at();

-- RLS: read is public to authenticated users (any admin reads the manual).
-- Writes are restricted to service_role for now (no in-app editor UI yet).
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS help_articles_read_authenticated ON public.help_articles;
CREATE POLICY help_articles_read_authenticated
  ON public.help_articles
  FOR SELECT
  TO authenticated
  USING (true);

-- (No INSERT/UPDATE/DELETE policy for authenticated users; service_role
-- bypasses RLS and is used by the seed migrations and the future editor.)
