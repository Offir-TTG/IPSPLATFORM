-- Verify Products Schema
-- This script checks which product schema is currently applied

DO $$
DECLARE
  has_program_id BOOLEAN;
  has_course_id BOOLEAN;
  has_product_type BOOLEAN;
  has_product_id BOOLEAN;
  has_payment_plan_jsonb BOOLEAN;
  has_payment_model BOOLEAN;
  has_requires_signature BOOLEAN;
  has_keap_tag BOOLEAN;
  payment_plans_exists BOOLEAN;
BEGIN
  -- Check if products table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    RAISE NOTICE '❌ Products table does not exist!';
    RAISE NOTICE '👉 Action: Run migration 20251124_restructure_products_pure_content.sql';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Products table exists';
  RAISE NOTICE '';
  RAISE NOTICE '=== Checking Schema Structure ===';

  -- Check for new schema columns (foreign keys)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'program_id'
  ) INTO has_program_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'course_id'
  ) INTO has_course_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'payment_model'
  ) INTO has_payment_model;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'requires_signature'
  ) INTO has_requires_signature;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'keap_tag'
  ) INTO has_keap_tag;

  -- Check for old schema columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) INTO has_product_type;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_id'
  ) INTO has_product_id;

  -- Check payment_plan column type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'payment_plan'
    AND data_type = 'jsonb'
  ) INTO has_payment_plan_jsonb;

  -- Check if payment_plans table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_plans'
  ) INTO payment_plans_exists;

  -- Report findings
  RAISE NOTICE '';
  RAISE NOTICE '--- NEW SCHEMA (20251124) Indicators ---';
  IF has_program_id THEN
    RAISE NOTICE '✅ program_id column exists (FK to programs)';
  ELSE
    RAISE NOTICE '❌ program_id column missing';
  END IF;

  IF has_course_id THEN
    RAISE NOTICE '✅ course_id column exists (FK to courses)';
  ELSE
    RAISE NOTICE '❌ course_id column missing';
  END IF;

  IF has_payment_model THEN
    RAISE NOTICE '✅ payment_model column exists';
  ELSE
    RAISE NOTICE '❌ payment_model column missing';
  END IF;

  IF has_requires_signature THEN
    RAISE NOTICE '✅ requires_signature column exists (DocuSign)';
  ELSE
    RAISE NOTICE '❌ requires_signature column missing';
  END IF;

  IF has_keap_tag THEN
    RAISE NOTICE '✅ keap_tag column exists';
  ELSE
    RAISE NOTICE '❌ keap_tag column missing';
  END IF;

  IF has_payment_plan_jsonb THEN
    RAISE NOTICE '✅ payment_plan is JSONB type';
  ELSE
    RAISE NOTICE '❌ payment_plan is not JSONB or missing';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- OLD SCHEMA (20251122) Indicators ---';
  IF has_product_type THEN
    RAISE NOTICE '⚠️  product_type column exists (old schema)';
  ELSE
    RAISE NOTICE '✅ product_type column removed';
  END IF;

  IF has_product_id THEN
    RAISE NOTICE '⚠️  product_id column exists (old schema)';
  ELSE
    RAISE NOTICE '✅ product_id column removed';
  END IF;

  IF payment_plans_exists THEN
    RAISE NOTICE '⚠️  payment_plans table exists (old schema)';
  ELSE
    RAISE NOTICE '✅ payment_plans table removed';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== CONCLUSION ===';

  IF has_program_id AND has_course_id AND has_payment_model AND has_payment_plan_jsonb THEN
    RAISE NOTICE '✅ NEW SCHEMA (20251124) is applied!';
    RAISE NOTICE '👉 Action: Proceed with UI implementation';
  ELSIF has_product_type AND has_product_id THEN
    RAISE NOTICE '❌ OLD SCHEMA (20251122) is still in use!';
    RAISE NOTICE '👉 Action: Run migration 20251124_restructure_products_pure_content.sql';
  ELSE
    RAISE NOTICE '⚠️  MIXED/UNKNOWN SCHEMA STATE!';
    RAISE NOTICE '👉 Action: Review schema manually and determine migration path';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== Column Details ===';
  RAISE NOTICE 'All columns in products table:';

  FOR rec IN
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - % (%) %', rec.column_name, rec.data_type,
      CASE WHEN rec.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
  END LOOP;

END$$;
