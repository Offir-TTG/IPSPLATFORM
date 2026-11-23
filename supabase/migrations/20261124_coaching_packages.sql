-- Coaching packages (parent and child coaching) on top of product enrollments.
--
-- 1. coaching_offers: sessions the team offers to add to a package. The client
--    approves them in the portal (no new contract, nothing charged on
--    approval); a gift is added at once. Approved offers raise the package's
--    session count, and each added session is charged at the offer's price
--    when it is held.
-- 2. coaching_requests: a request is either coaching for another child
--    ('child', as today) or more sessions on a package ('more_sessions').
-- Safe to rerun.

CREATE TABLE IF NOT EXISTS public.coaching_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  sessions int NOT NULL CHECK (sessions BETWEEN 1 AND 100),
  session_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (session_amount >= 0),
  is_gift boolean NOT NULL DEFAULT false,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  request_id uuid REFERENCES public.coaching_requests(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id),
  decided_by uuid REFERENCES public.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coaching_offers_enrollment ON public.coaching_offers (enrollment_id, created_at);
-- One open offer per package at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_coaching_offers_one_pending
  ON public.coaching_offers (enrollment_id) WHERE status = 'pending';
ALTER TABLE public.coaching_offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coaching_offers FROM anon, authenticated;

ALTER TABLE public.coaching_requests ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'child';
ALTER TABLE public.coaching_requests ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL;
ALTER TABLE public.coaching_requests ADD COLUMN IF NOT EXISTS sessions_requested int CHECK (sessions_requested IS NULL OR sessions_requested BETWEEN 1 AND 100);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coaching_requests_kind_check') THEN
    ALTER TABLE public.coaching_requests ADD CONSTRAINT coaching_requests_kind_check CHECK (kind IN ('child', 'more_sessions'));
  END IF;
END $$;
