-- Add pricing, availability, and type fields to courses table
-- This allows courses to be sold standalone or as part of programs

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS payment_plan TEXT CHECK (payment_plan IN ('one_time', 'installments')),
ADD COLUMN IF NOT EXISTS installment_count INTEGER,
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'course' CHECK (course_type IN ('course', 'lecture', 'workshop', 'webinar'));

-- Add comments for documentation
COMMENT ON COLUMN public.courses.is_standalone IS 'Whether this course can be purchased separately or only as part of a program';
COMMENT ON COLUMN public.courses.price IS 'Price for standalone course (null if only available in programs)';
COMMENT ON COLUMN public.courses.currency IS 'Currency code for pricing (e.g., usd, eur, ils)';
COMMENT ON COLUMN public.courses.payment_plan IS 'Payment plan type: one_time or installments';
COMMENT ON COLUMN public.courses.installment_count IS 'Number of installments if payment_plan is installments';
COMMENT ON COLUMN public.courses.course_type IS 'Type of educational content: course (multi-session), lecture (single session), workshop (hands-on), webinar (online event)';

-- Add constraint to ensure pricing consistency
ALTER TABLE public.courses
ADD CONSTRAINT price_required_for_standalone CHECK (
  (is_standalone = false) OR
  (is_standalone = true AND price IS NOT NULL AND payment_plan IS NOT NULL)
);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_courses_standalone ON public.courses(is_standalone) WHERE is_standalone = true;
CREATE INDEX IF NOT EXISTS idx_courses_type ON public.courses(course_type);
