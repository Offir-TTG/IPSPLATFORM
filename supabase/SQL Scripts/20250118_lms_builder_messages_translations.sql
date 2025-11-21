-- ============================================================================
-- LMS BUILDER MESSAGES TRANSLATIONS
-- Adds English and Hebrew translations for LMS builder messages
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant (for single-tenant setup, or adjust as needed)
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing translations for LMS builder messages to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key IN (
    'lms.builder.load_failed',
    'lms.builder.module_order_updated',
    'lms.builder.order_local_only',
    'lms.builder.zoom_topic_required',
    'lms.builder.lesson_created_zoom_failed',
    'lms.builder.lesson_created_zoom_error',
    'lms.builder.lesson_zoom_created',
    'lms.builder.lesson_created',
    'lms.builder.lesson_create_failed',
    'lms.builder.lesson_deleted',
    'lms.builder.lesson_delete_failed',
    'lms.builder.zoom_created',
    'lms.builder.zoom_create_failed',
    'lms.builder.select_module_first',
    'lms.builder.series_name_required',
    'lms.builder.lessons_count_range',
    'lms.builder.zoom_topic_pattern_required',
    'lms.builder.lessons_create_failed'
  );

  -- Insert English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    (v_tenant_id, 'en', 'lms.builder.load_failed', 'Failed to load course data', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_order_updated', 'Module order updated', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.order_local_only', 'Order updated locally only', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.zoom_topic_required', 'Zoom meeting topic is required when creating Zoom meeting', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_created_zoom_failed', 'Lesson created but Zoom meeting failed: {error}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_created_zoom_error', 'Lesson created but Zoom meeting creation failed', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_zoom_created', 'Lesson and Zoom meeting created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_created', 'Lesson created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_create_failed', 'Failed to create lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_deleted', 'Lesson deleted successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_delete_failed', 'Failed to delete lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.zoom_created', 'Zoom meeting created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.zoom_create_failed', 'Failed to create Zoom meeting', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.select_module_first', 'Please select a module first', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.series_name_required', 'Series name is required', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lessons_count_range', 'Please enter a number between 1 and 50', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.zoom_topic_pattern_required', 'Zoom topic pattern is required when creating Zoom meetings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lessons_create_failed', 'Failed to create lessons', 'admin', NOW(), NOW());

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    (v_tenant_id, 'he', 'lms.builder.load_failed', 'טעינת נתוני הקורס נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_order_updated', 'סדר המודולים עודכן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.order_local_only', 'הסדר עודכן מקומית בלבד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.zoom_topic_required', 'נושא פגישת Zoom נדרש בעת יצירת פגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_created_zoom_failed', 'השיעור נוצר אך פגישת Zoom נכשלה: {error}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_created_zoom_error', 'השיעור נוצר אך יצירת פגישת Zoom נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_zoom_created', 'השיעור ופגישת Zoom נוצרו בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_created', 'השיעור נוצר בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_create_failed', 'יצירת השיעור נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_deleted', 'השיעור נמחק בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_delete_failed', 'מחיקת השיעור נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.zoom_created', 'פגישת Zoom נוצרה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.zoom_create_failed', 'יצירת פגישת Zoom נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.select_module_first', 'אנא בחר מודול תחילה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.series_name_required', 'שם הסדרה נדרש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lessons_count_range', 'אנא הזן מספר בין 1 ל-50', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.zoom_topic_pattern_required', 'תבנית נושא Zoom נדרשת בעת יצירת פגישות Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lessons_create_failed', 'יצירת השיעורים נכשלה', 'admin', NOW(), NOW());

END $$;
