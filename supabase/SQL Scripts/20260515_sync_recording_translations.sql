-- Hebrew + English translations for the Sync Recording admin feature.
--
-- Keys added by the new admin-builder "Sync recording" button + its
-- handler. Without these rows, Hebrew users see the English fallbacks
-- baked into the t() calls in code.

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;

  DELETE FROM public.translations
  WHERE translation_key LIKE 'lms.builder.sync_recording%'
     OR translation_key IN (
       'lms.builder.recording_synced',
       'lms.builder.recording_synced_short',
       'lms.builder.recording_already_synced',
       'lms.builder.recording_not_ready',
       'lms.builder.recording_sync_failed',
       'lms.builder.recording_not_found_on_zoom',
       'lms.builder.recording_no_meeting'
     );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Button label
    ('en', 'lms.builder.sync_recording', 'Sync recording', 'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.sync_recording', 'סנכרון הקלטה',   'admin', tenant_uuid, 'lms'),

    -- Button label (disabled, "already synced" state — compact)
    ('en', 'lms.builder.recording_synced_short', 'Synced',  'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_synced_short', 'סונכרן',  'admin', tenant_uuid, 'lms'),

    -- Tooltip when the button is active
    ('en', 'lms.builder.sync_recording_tooltip',
     'Fetch the recording from Zoom now (use if webhook was missed)',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.sync_recording_tooltip',
     'משוך את ההקלטה מ-Zoom עכשיו (במידה וה-webhook לא הופעל)',
     'admin', tenant_uuid, 'lms'),

    -- Tooltip when the button is disabled because recording is already synced
    ('en', 'lms.builder.recording_already_synced', 'Recording already synced',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_already_synced', 'ההקלטה כבר סונכרנה',
     'admin', tenant_uuid, 'lms'),

    -- Toast: success
    ('en', 'lms.builder.recording_synced', 'Recording synced successfully',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_synced', 'ההקלטה סונכרנה בהצלחה',
     'admin', tenant_uuid, 'lms'),

    -- Toast: not-yet-ready warning (Zoom still processing)
    ('en', 'lms.builder.recording_not_ready',
     'Recording is still processing on Zoom; try again in a few minutes.',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_not_ready',
     'ההקלטה עדיין בעיבוד ב-Zoom; נסה שוב בעוד מספר דקות.',
     'admin', tenant_uuid, 'lms'),

    -- Toast: generic failure (network/API error, unknown error code)
    ('en', 'lms.builder.recording_sync_failed', 'Failed to sync recording',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_sync_failed', 'סנכרון ההקלטה נכשל',
     'admin', tenant_uuid, 'lms'),

    -- Toast: specific case — Zoom has no recording for this meeting
    -- (the meeting was never recorded, or was deleted from Zoom). Surfaces
    -- the friendly message instead of Zoom's raw English 404 text.
    ('en', 'lms.builder.recording_not_found_on_zoom',
     'No recording was found on Zoom for this lesson.',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_not_found_on_zoom',
     'לא נמצאה הקלטה ב-Zoom עבור שיעור זה.',
     'admin', tenant_uuid, 'lms'),

    -- Toast: lesson is missing a Zoom session or meeting_id, so we can't
    -- query Zoom at all. Different message helps the admin diagnose.
    ('en', 'lms.builder.recording_no_meeting',
     'This lesson has no Zoom meeting attached.',
     'admin', tenant_uuid, 'lms'),
    ('he', 'lms.builder.recording_no_meeting',
     'לשיעור זה לא משויך מפגש Zoom.',
     'admin', tenant_uuid, 'lms');

END $$;
