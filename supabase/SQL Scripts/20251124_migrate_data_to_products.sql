-- =====================================================
-- Data Migration: Move existing programs/courses to products
-- Date: 2025-11-24
--
-- This script migrates existing payment configuration from:
-- - programs (price, payment_plan, docusign) → products
-- - courses (price, payment_plan) → products
--
-- Run this AFTER 20251124_restructure_products_pure_content.sql
-- =====================================================

DO $$
DECLARE
  prog RECORD;
  crs RECORD;
  new_product_id UUID;
  payment_plan_json JSONB;
  program_count INTEGER := 0;
  course_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting data migration to products...';

  -- =====================================================
  -- MIGRATE PROGRAMS → PRODUCTS
  -- =====================================================

  RAISE NOTICE '--- Migrating Programs ---';

  FOR prog IN
    SELECT
      p.id,
      p.tenant_id,
      p.name,
      p.description,
      p.is_active,
      pb.price,
      pb.payment_plan,
      pb.installment_count,
      pb.docusign_template_id,
      pb.require_signature,
      pb.crm_tag
    FROM programs p
    LEFT JOIN programs_backup pb ON p.id = pb.id
    WHERE p.is_active = true
  LOOP
    -- Build payment_plan JSON from old fields
    IF prog.payment_plan = 'installments' THEN
      payment_plan_json := jsonb_build_object(
        'installments', COALESCE(prog.installment_count, 12),
        'frequency', 'monthly',
        'deposit_type', 'none',
        'deposit_amount', NULL,
        'deposit_percentage', NULL,
        'start_delay_days', 0
      );
    ELSE
      payment_plan_json := '{}'::jsonb;
    END IF;

    -- Determine payment model
    DECLARE
      payment_model_val TEXT;
      price_val DECIMAL(10, 2);
    BEGIN
      IF prog.price IS NULL OR prog.price = 0 THEN
        payment_model_val := 'free';
        price_val := NULL;
      ELSIF prog.payment_plan = 'installments' THEN
        payment_model_val := 'deposit_then_plan';
        price_val := prog.price;
      ELSE
        payment_model_val := 'one_time';
        price_val := prog.price;
      END IF;

      -- Create product
      INSERT INTO products (
        tenant_id,
        type,
        title,
        description,
        program_id,
        requires_signature,
        signature_template_id,
        payment_model,
        price,
        currency,
        payment_plan,
        is_active,
        metadata
      ) VALUES (
        prog.tenant_id,
        'program',
        prog.name,
        prog.description,
        prog.id,
        COALESCE(prog.require_signature, false),
        prog.docusign_template_id,
        payment_model_val,
        price_val,
        'USD',  -- Default currency
        payment_plan_json,
        prog.is_active,
        CASE
          WHEN prog.crm_tag IS NOT NULL THEN jsonb_build_object('crm_tag', prog.crm_tag)
          ELSE '{}'::jsonb
        END
      ) RETURNING id INTO new_product_id;

      -- Update program with product_id back-reference
      UPDATE programs
      SET product_id = new_product_id
      WHERE id = prog.id;

      program_count := program_count + 1;
      RAISE NOTICE '  ✓ Migrated program: % (ID: %) → Product: %',
        prog.name, prog.id, new_product_id;
    END;
  END LOOP;

  RAISE NOTICE 'Programs migrated: %', program_count;

  -- =====================================================
  -- MIGRATE STANDALONE COURSES → PRODUCTS
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '--- Migrating Standalone Courses ---';

  FOR crs IN
    SELECT
      c.id,
      c.tenant_id,
      c.title,
      c.description,
      c.is_standalone,
      c.is_active,
      cb.price,
      cb.currency,
      cb.payment_plan,
      cb.installment_count
    FROM courses c
    LEFT JOIN courses_backup cb ON c.id = cb.id
    WHERE c.is_standalone = true
      AND c.is_active = true
  LOOP
    -- Build payment_plan JSON
    IF crs.payment_plan = 'installments' THEN
      payment_plan_json := jsonb_build_object(
        'installments', COALESCE(crs.installment_count, 6),
        'frequency', 'monthly',
        'deposit_type', 'none',
        'deposit_amount', NULL,
        'deposit_percentage', NULL,
        'start_delay_days', 0
      );
    ELSE
      payment_plan_json := '{}'::jsonb;
    END IF;

    -- Determine payment model
    DECLARE
      payment_model_val TEXT;
      price_val DECIMAL(10, 2);
      currency_val TEXT;
    BEGIN
      IF crs.price IS NULL OR crs.price = 0 THEN
        payment_model_val := 'free';
        price_val := NULL;
      ELSIF crs.payment_plan = 'installments' THEN
        payment_model_val := 'deposit_then_plan';
        price_val := crs.price;
      ELSE
        payment_model_val := 'one_time';
        price_val := crs.price;
      END IF;

      currency_val := COALESCE(crs.currency, 'USD');

      -- Create product
      INSERT INTO products (
        tenant_id,
        type,
        title,
        description,
        course_id,
        requires_signature,
        payment_model,
        price,
        currency,
        payment_plan,
        is_active
      ) VALUES (
        crs.tenant_id,
        'course',
        crs.title,
        crs.description,
        crs.id,
        false,  -- Courses don't have signature requirement by default
        payment_model_val,
        price_val,
        currency_val,
        payment_plan_json,
        crs.is_active
      ) RETURNING id INTO new_product_id;

      -- Update course with product_id back-reference
      UPDATE courses
      SET product_id = new_product_id
      WHERE id = crs.id;

      course_count := course_count + 1;
      RAISE NOTICE '  ✓ Migrated course: % (ID: %) → Product: %',
        crs.title, crs.id, new_product_id;
    END;
  END LOOP;

  RAISE NOTICE 'Standalone courses migrated: %', course_count;

  -- =====================================================
  -- SUMMARY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Data Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Programs migrated:   %', program_count;
  RAISE NOTICE 'Courses migrated:    %', course_count;
  RAISE NOTICE 'Total products:      %', program_count + course_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify products in admin panel';
  RAISE NOTICE '2. Test enrollment flow';
  RAISE NOTICE '3. Update application code to use new product structure';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration failed: %', SQLERRM;
    RAISE NOTICE 'Rolling back changes...';
END $$;
