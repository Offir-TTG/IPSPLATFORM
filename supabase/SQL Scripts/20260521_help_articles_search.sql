-- =====================================================================
-- Smart search + sequence/dependency support for help_articles.
-- =====================================================================
-- This migration adds:
--  1. pg_trgm extension (fuzzy matching, typo tolerance)
--  2. A generated `search_vector` tsvector column over title/category/body
--  3. GIN index for sub-millisecond full-text search
--  4. Trigram indexes on title for fuzzy fallback
--  5. `prerequisites text[]` and `next_steps text[]` columns — ordered
--     slugs that the drawer renders as cards before/after the article
--     body so admins always see "what to do first" and "what to do next"
--  6. `search_help_articles(q, locale, limit)` function — single entry
--     point for ranked, snippet-returning search
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- --------------------------------------------------------------------
-- 1. New columns: prerequisites + next_steps (ordered arrays of slugs)
-- --------------------------------------------------------------------
ALTER TABLE public.help_articles
  ADD COLUMN IF NOT EXISTS prerequisites text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_steps    text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.help_articles.prerequisites IS
  'Ordered slugs the admin must read/complete BEFORE this article. Rendered as cards above the body. Drives the dependency chain.';
COMMENT ON COLUMN public.help_articles.next_steps IS
  'Ordered slugs that logically come AFTER this article. Rendered as cards below the body.';

-- --------------------------------------------------------------------
-- 2. Generated tsvector column for full-text search
-- --------------------------------------------------------------------
-- `simple` config: case-fold + tokenize, no stemming. Works for both
-- English and Hebrew. Weighting: title=A (highest), category=B, body=C.
ALTER TABLE public.help_articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body_markdown, '')), 'C')
  ) STORED;

-- --------------------------------------------------------------------
-- 3. Indexes
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS help_articles_search_vector_idx
  ON public.help_articles USING gin (search_vector);

CREATE INDEX IF NOT EXISTS help_articles_title_trgm_idx
  ON public.help_articles USING gin (title gin_trgm_ops);

-- --------------------------------------------------------------------
-- 4. Smart search function
-- --------------------------------------------------------------------
-- Blends three relevance signals:
--   • Full-text rank (ts_rank_cd) × 2  — the primary signal
--   • Title trigram similarity         — catches typos ("stipe" → "stripe")
--   • Title prefix bonus               — boosts articles whose title
--                                        starts with the query
-- Falls back to ILIKE + similarity > 0.15 when websearch parsing
-- finds no matches (e.g., very short or noisy queries).
--
-- Returns a `snippet` from ts_headline with <mark>…</mark> wrapping
-- matched terms. Caller renders this as HTML (admin-curated content).
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_help_articles(
  q text,
  loc text DEFAULT 'en',
  result_limit int DEFAULT 15
)
RETURNS TABLE (
  slug          text,
  title         text,
  category      text,
  page_slugs    text[],
  updated_at    timestamptz,
  snippet       text,
  match_score   real
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  ts_q tsquery;
  trimmed_q text;
BEGIN
  trimmed_q := trim(coalesce(q, ''));

  -- Empty query: caller should hit the standard list endpoint instead.
  IF trimmed_q = '' THEN
    RETURN;
  END IF;

  -- websearch_to_tsquery handles natural language: phrases in quotes,
  -- implicit AND between unquoted words. We catch failures (invalid
  -- syntax produces empty tsquery; we still want trigram results).
  BEGIN
    ts_q := websearch_to_tsquery('simple', trimmed_q);
  EXCEPTION WHEN OTHERS THEN
    ts_q := plainto_tsquery('simple', trimmed_q);
  END;

  RETURN QUERY
  WITH scored AS (
    SELECT
      h.slug,
      h.title,
      h.category,
      h.page_slugs,
      h.updated_at,
      h.body_markdown,
      h.search_vector,
      (CASE WHEN ts_q IS NOT NULL AND ts_q <> ''::tsquery
            AND h.search_vector @@ ts_q
            THEN ts_rank_cd(h.search_vector, ts_q)
            ELSE 0 END)                                          AS ft_rank,
      similarity(h.title, trimmed_q)                             AS title_sim,
      (CASE WHEN h.title ILIKE trimmed_q || '%' THEN 0.5
            ELSE 0 END)                                          AS prefix_boost
    FROM public.help_articles h
    WHERE h.locale = loc
      AND (
        (ts_q IS NOT NULL AND ts_q <> ''::tsquery AND h.search_vector @@ ts_q)
        OR h.title ILIKE '%' || trimmed_q || '%'
        OR similarity(h.title, trimmed_q) > 0.15
      )
  )
  SELECT
    s.slug,
    s.title,
    s.category,
    s.page_slugs,
    s.updated_at,
    -- ts_headline returns the first matching window with <mark> highlights.
    -- We also strip the most common markdown noise so snippets read clean.
    COALESCE(
      NULLIF(
        regexp_replace(
          ts_headline(
            'simple',
            s.body_markdown,
            COALESCE(NULLIF(ts_q::text, '')::tsquery, plainto_tsquery('simple', trimmed_q)),
            'StartSel="<mark>", StopSel="</mark>", MaxWords=25, MinWords=10, ShortWord=2, HighlightAll=false'
          ),
          '[#*_`>]+',
          '',
          'g'
        ),
        ''
      ),
      -- Fallback when ts_headline returns nothing (no full-text match,
      -- only trigram hit): use the first 200 chars of the body.
      regexp_replace(substring(s.body_markdown for 200), '[#*_`>]+', '', 'g') || '…'
    ) AS snippet,
    (s.ft_rank * 2 + s.title_sim + s.prefix_boost)::real AS match_score
  FROM scored s
  ORDER BY match_score DESC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_help_articles(text, text, int) TO authenticated;

COMMENT ON FUNCTION public.search_help_articles IS
  'Smart help-article search. Blends full-text rank, title trigram similarity, and title prefix matching. Returns ranked rows with <mark>-highlighted snippets. Called by /api/admin/help/articles when ?search= is present.';
