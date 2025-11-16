-- ============================================================================
-- FIX COMMON TRANSLATIONS CONTEXT
-- ============================================================================
-- This migration fixes the incorrect 'common' context value for common translations
-- The valid contexts are: 'admin', 'user', or 'both'
-- Common translations should use 'both' to be available in both admin and user contexts

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing translations
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        -- If no translations exist yet, get the default tenant
        SELECT id INTO v_tenant_id FROM public.tenants WHERE is_default = true LIMIT 1;

        IF v_tenant_id IS NULL THEN
            -- If no default tenant, just get any tenant
            SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
        END IF;
    END IF;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found in database';
    END IF;

    -- Update all translations with 'common' context to use 'both' instead
    UPDATE public.translations
    SET context = 'both'
    WHERE context = 'common';

    -- Specifically ensure common.* translations have the correct context
    UPDATE public.translations
    SET context = 'both'
    WHERE translation_key LIKE 'common.%'
      AND context != 'both';

    -- List of critical common translations that must be available in both contexts
    UPDATE public.translations
    SET context = 'both'
    WHERE translation_key IN (
      'common.delete',
      'common.edit',
      'common.save',
      'common.cancel',
      'common.loading',
      'common.saving',
      'common.deleting',
      'common.creating',
      'common.view',
      'common.search',
      'common.filter',
      'common.sort',
      'common.actions',
      'common.status',
      'common.date',
      'common.time',
      'common.language',
      'common.error',
      'common.success',
      'common.noData',
      'common.create',
      'common.update'
    ) AND context != 'both';

    -- Add Hebrew translations if they're missing
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
      ('he', 'common.delete', 'מחק', 'both', v_tenant_id, 'common'),
      ('he', 'common.edit', 'ערוך', 'both', v_tenant_id, 'common'),
      ('he', 'common.save', 'שמור', 'both', v_tenant_id, 'common'),
      ('he', 'common.cancel', 'ביטול', 'both', v_tenant_id, 'common'),
      ('he', 'common.loading', 'טוען...', 'both', v_tenant_id, 'common'),
      ('he', 'common.saving', 'שומר...', 'both', v_tenant_id, 'common'),
      ('he', 'common.deleting', 'מוחק...', 'both', v_tenant_id, 'common'),
      ('he', 'common.creating', 'יוצר...', 'both', v_tenant_id, 'common'),
      ('he', 'common.create', 'צור', 'both', v_tenant_id, 'common'),
      ('he', 'common.update', 'עדכן', 'both', v_tenant_id, 'common')
    ON CONFLICT (language_code, translation_key)
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      context = EXCLUDED.context;

    -- Add English translations if they're missing
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
      ('en', 'common.delete', 'Delete', 'both', v_tenant_id, 'common'),
      ('en', 'common.edit', 'Edit', 'both', v_tenant_id, 'common'),
      ('en', 'common.save', 'Save', 'both', v_tenant_id, 'common'),
      ('en', 'common.cancel', 'Cancel', 'both', v_tenant_id, 'common'),
      ('en', 'common.loading', 'Loading...', 'both', v_tenant_id, 'common'),
      ('en', 'common.saving', 'Saving...', 'both', v_tenant_id, 'common'),
      ('en', 'common.deleting', 'Deleting...', 'both', v_tenant_id, 'common'),
      ('en', 'common.creating', 'Creating...', 'both', v_tenant_id, 'common'),
      ('en', 'common.create', 'Create', 'both', v_tenant_id, 'common'),
      ('en', 'common.update', 'Update', 'both', v_tenant_id, 'common')
    ON CONFLICT (language_code, translation_key)
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      context = EXCLUDED.context;
END $$;