-- Add completion benefit and access duration fields to products table

-- Add completion_benefit field (what users get when they finish)
-- Examples: "Certificate of Completion", "Digital Badge", "Certification", etc.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS completion_benefit TEXT;

-- Add access_duration field (how long users have access)
-- Examples: "lifetime", "1_year", "6_months", "3_months"
ALTER TABLE products
ADD COLUMN IF NOT EXISTS access_duration TEXT DEFAULT 'lifetime';

-- Add a comment to explain the fields
COMMENT ON COLUMN products.completion_benefit IS 'What users receive upon completing the program/course (e.g., Certificate, Badge, Certification)';
COMMENT ON COLUMN products.access_duration IS 'How long users have access to the content (e.g., lifetime, 1_year, 6_months)';

-- Update existing products to have default values
UPDATE products
SET 
  completion_benefit = 'Certificate',
  access_duration = 'lifetime'
WHERE completion_benefit IS NULL OR access_duration IS NULL;
