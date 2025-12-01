-- Add Product Type Translations for Enrollment Page
-- These translations display the product type badge on the public enrollment page

DELETE FROM translations WHERE translation_key IN (
  'enrollment.productType.course',
  'enrollment.productType.program',
  'enrollment.productType.bundle',
  'enrollment.productType.workshop',
  'enrollment.productType.service'
);

INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- Course
  ('enrollment.productType.course', 'en', 'Course', 'user', NULL),
  ('enrollment.productType.course', 'he', 'קורס', 'user', NULL),

  -- Program
  ('enrollment.productType.program', 'en', 'Program', 'user', NULL),
  ('enrollment.productType.program', 'he', 'תוכנית', 'user', NULL),

  -- Bundle
  ('enrollment.productType.bundle', 'en', 'Bundle', 'user', NULL),
  ('enrollment.productType.bundle', 'he', 'חבילה', 'user', NULL),

  -- Workshop
  ('enrollment.productType.workshop', 'en', 'Workshop', 'user', NULL),
  ('enrollment.productType.workshop', 'he', 'סדנה', 'user', NULL),

  -- Service
  ('enrollment.productType.service', 'en', 'Service', 'user', NULL),
  ('enrollment.productType.service', 'he', 'שירות', 'user', NULL);
