-- ============================================================================
-- LOGIN PAGE TRANSLATIONS
-- Adds unified login page translations
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

  -- Delete existing login translations to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key LIKE 'auth.login.title'
     OR translation_key LIKE 'auth.login.subtitle';

  -- Insert English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    (v_tenant_id, 'en', 'auth.login.title', 'Welcome Back', 'auth', NOW(), NOW()),
    (v_tenant_id, 'en', 'auth.login.subtitle', 'Sign in to your account to continue', 'auth', NOW(), NOW());

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    (v_tenant_id, 'he', 'auth.login.title', 'ברוך שובך', 'auth', NOW(), NOW()),
    (v_tenant_id, 'he', 'auth.login.subtitle', 'התחבר לחשבונך כדי להמשיך', 'auth', NOW(), NOW());

END $$;
