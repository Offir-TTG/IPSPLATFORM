-- Add description fields for completion benefit and access duration

ALTER TABLE products
ADD COLUMN IF NOT EXISTS completion_description TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS access_description TEXT;

COMMENT ON COLUMN products.completion_description IS 'Description of when/how users receive the completion benefit (e.g., "Upon completion", "After finishing all modules")';
COMMENT ON COLUMN products.access_description IS 'Description of the access terms (e.g., "Learn at your own pace", "Full access to all materials")';

-- Update existing products with default values
UPDATE products
SET 
  completion_description = 'Upon completion',
  access_description = 'Learn at your own pace'
WHERE completion_description IS NULL OR access_description IS NULL;
