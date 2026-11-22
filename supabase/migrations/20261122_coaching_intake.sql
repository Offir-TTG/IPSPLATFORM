-- Intake for child coaching. The team edits the questions in the admin; the
-- parent fills the intake after the coaching pack is set up, before the first
-- session can be booked, and can edit it until the first session takes place.
-- Server-only, like the other family tables. Safe to run more than once.

-- The questions. A form for a specific product wins over the school's
-- general form (product_id empty). `questions` is a list like:
--   [{"id":"q1","label":"...","kind":"text|long_text|choice|multi|yes_no|number|date",
--     "options":["..."],"required":true,"help":"..."}]
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(questions) = 'array'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- At most one active form per product, and one active general form per school.
CREATE UNIQUE INDEX IF NOT EXISTS uq_intake_forms_active_product
  ON public.intake_forms (tenant_id, product_id) WHERE is_active AND product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_intake_forms_active_general
  ON public.intake_forms (tenant_id) WHERE is_active AND product_id IS NULL;

-- One intake per coaching pack. The questions are copied in when it's first
-- sent, so later edits to the form never change what an answer meant.
CREATE TABLE IF NOT EXISTS public.intake_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  form_id uuid REFERENCES public.intake_forms(id) ON DELETE SET NULL,
  questions jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by uuid REFERENCES public.users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intake_forms, public.intake_responses FROM anon, authenticated;
