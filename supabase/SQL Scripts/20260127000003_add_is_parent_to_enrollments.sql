-- Add is_parent field to enrollments table
-- This indicates if the enrollment is for a parent (no dashboard access)
-- vs a student enrollment (has dashboard access)

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_is_parent
ON enrollments(is_parent);

COMMENT ON COLUMN enrollments.is_parent IS
'Indicates if this is a parent enrollment (true) or student enrollment (false). Parent enrollments do not grant dashboard access. Dashboard access is granted when user has at least one non-parent enrollment.';
