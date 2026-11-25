-- =====================================================================
-- CRM tags on each enrollment
-- =====================================================================
-- What it does, in plain words:
--   Each enrollment keeps the CRM tags its product had when the
--   enrollment was made. The admin can then find every enrollment with
--   tag X (Enrollments → "CRM tag" filter), and a later change to the
--   product's tags never rewrites what older enrollments brought.
--
--   1. A new column, enrollments.crm_tag_slugs (a list of tag slugs).
--   2. Existing enrollments get their product's current tags.
--   3. Every new enrollment copies its product's tags automatically,
--      whatever creates it (wizard, admin, coaching, import).
--
-- What it does NOT change:
--   - Products, the CRM and existing data other than this new column.
--
-- Safe to run more than once.
-- =====================================================================

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS crm_tag_slugs text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS enrollments_crm_tag_slugs ON public.enrollments USING gin (crm_tag_slugs);

-- Existing enrollments: their product's tags today.
-- (to_jsonb reads products.crm_tag_slugs whether it is a text list or JSON.)
UPDATE public.enrollments e
SET crm_tag_slugs = ARRAY(SELECT jsonb_array_elements_text(to_jsonb(p.crm_tag_slugs)))
FROM public.products p
WHERE p.id = e.product_id
  AND coalesce(array_length(e.crm_tag_slugs, 1), 0) = 0
  AND jsonb_typeof(to_jsonb(p.crm_tag_slugs)) = 'array'
  AND jsonb_array_length(to_jsonb(p.crm_tag_slugs)) > 0;

-- New enrollments: copy the product's tags when none are given.
CREATE OR REPLACE FUNCTION public.enrollments_copy_product_crm_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(array_length(NEW.crm_tag_slugs, 1), 0) = 0 AND NEW.product_id IS NOT NULL THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(to_jsonb(p.crm_tag_slugs))) INTO NEW.crm_tag_slugs
    FROM public.products p
    WHERE p.id = NEW.product_id
      AND jsonb_typeof(to_jsonb(p.crm_tag_slugs)) = 'array';
    NEW.crm_tag_slugs := coalesce(NEW.crm_tag_slugs, '{}');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_copy_product_crm_tags ON public.enrollments;
CREATE TRIGGER enrollments_copy_product_crm_tags
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.enrollments_copy_product_crm_tags();

COMMENT ON COLUMN public.enrollments.crm_tag_slugs IS
  'CRM tag slugs this enrollment brought (copied from the product when the enrollment was made). Searchable in Enrollments.';
