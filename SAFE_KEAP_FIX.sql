-- SAFE Keap Translation Fix
-- This version checks for errors and reports them clearly

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
  v_deleted_count INTEGER;
  v_inserted_count INTEGER;
  v_final_count INTEGER;
BEGIN
  -- Step 1: Report what we're about to delete
  SELECT COUNT(*) INTO v_deleted_count
  FROM translations
  WHERE tenant_id = v_tenant_id
    AND (
      translation_key LIKE 'admin.keap%'
      OR translation_key LIKE 'admin.nav.keap%'
      OR translation_key LIKE 'admin.integrations.keap%'
    );

  RAISE NOTICE 'Found % existing Keap translations to delete', v_deleted_count;

  -- Step 2: Delete existing Keap translations
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND (
      translation_key LIKE 'admin.keap%'
      OR translation_key LIKE 'admin.nav.keap%'
      OR translation_key LIKE 'admin.integrations.keap%'
    );

  RAISE NOTICE 'Deleted % Keap translations', v_deleted_count;

  -- Step 3: Insert new translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Navigation (6 total: 3 en + 3 he)
  (v_tenant_id, 'en', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.nav.keap.dashboard', 'Keap Dashboard', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.nav.keap.tags', 'Tags', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.keap.dashboard', 'לוח בקרה Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.keap.tags', 'תגיות', 'admin', NOW(), NOW()),

  -- Integration Config (24 total: 12 en + 12 he)
  (v_tenant_id, 'en', 'admin.integrations.keap.description', 'CRM and marketing automation platform', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientId', 'Client ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientSecret', 'Client Secret', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.accessToken', 'Access Token', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.refreshToken', 'Refresh Token', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.autoSyncContacts', 'Auto-sync Contacts', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.defaultTagCategory', 'Default Tag Category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncFrequency', 'Sync Frequency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncRealtime', 'Real-time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncHourly', 'Hourly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncDaily', 'Daily', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncManual', 'Manual', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.description', 'פלטפורמת CRM ואוטומציה שיווקית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientId', 'מזהה לקוח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientSecret', 'סוד לקוח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.accessToken', 'אסימון גישה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.refreshToken', 'אסימון רענון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.autoSyncContacts', 'סנכרון אוטומטי של אנשי קשר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.defaultTagCategory', 'קטגוריית תגיות ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncFrequency', 'תדירות סנכרון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncRealtime', 'זמן אמת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncHourly', 'כל שעה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncDaily', 'יומי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncManual', 'ידני', 'admin', NOW(), NOW()),

  -- Dashboard (38 total: 19 en + 19 he)
  (v_tenant_id, 'en', 'admin.keap.dashboard.title', 'Keap Integration', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.description', 'Manage CRM sync and student segmentation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.totalTags', 'Total Tags', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.syncedStudents', 'Synced Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.enabled', 'Enabled', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.disabled', 'Disabled', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.autoSync', 'Auto-Sync', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.never', 'Never', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.lastSync', 'Last Sync', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.manageTags', 'Manage Tags', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.manageTagsDesc', 'View and create tags for student segmentation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.bulkSync', 'Bulk Sync Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.bulkSyncDesc', 'Sync all existing students to Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.settings', 'Integration Settings', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.settingsDesc', 'Configure Keap API credentials and sync options', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.recentActivity', 'Recent Sync Activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.noActivity', 'No recent sync activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.autoSyncInfo', 'Automatic Sync', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.dashboard.autoSyncInfoDesc', 'When auto-sync is enabled, students are automatically synced to Keap when they enroll in courses or complete lessons. Tags are applied based on their activity.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.title', 'אינטגרציית Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.description', 'ניהול סנכרון CRM וסגמנטציה של תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.totalTags', 'סך תגיות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.syncedStudents', 'תלמידים מסונכרנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.enabled', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.disabled', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.autoSync', 'סנכרון אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.never', 'אף פעם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.lastSync', 'סנכרון אחרון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.manageTags', 'ניהול תגיות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.manageTagsDesc', 'צפייה ויצירת תגיות לסגמנטציה של תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.bulkSync', 'סנכרון המוני של תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.bulkSyncDesc', 'סנכרון כל התלמידים הקיימים ל-Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.settings', 'הגדרות אינטגרציה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.settingsDesc', 'הגדרת אישורי API של Keap ואפשרויות סנכרון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.recentActivity', 'פעילות סנכרון אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.noActivity', 'אין פעילות סנכרון אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.autoSyncInfo', 'סנכרון אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.dashboard.autoSyncInfoDesc', 'כאשר סנכרון אוטומטי מופעל, תלמידים מסונכרנים אוטומטית ל-Keap כאשר הם נרשמים לקורסים או משלימים שיעורים. תגיות מוחלות על בסיס הפעילות שלהם.', 'admin', NOW(), NOW()),

  -- Tags Page (34 total: 17 en + 17 he)
  (v_tenant_id, 'en', 'admin.keap.tags.title', 'Keap Tags', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.pageDescription', 'Manage tags for student segmentation and automation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.refresh', 'Refresh', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.createTag', 'Create Tag', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.searchPlaceholder', 'Search tags...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.noTags', 'No tags found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.noSearchResults', 'Try a different search term', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.createFirstTag', 'Create your first tag to get started', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.totalTags', 'Total Tags', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.filtered', 'Filtered', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.withCategory', 'With Category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.tagName', 'Tag Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.tagNamePlaceholder', 'e.g., LMS Student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.description', 'Description', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.descriptionPlaceholder', 'Brief description of this tag', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.cancel', 'Cancel', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.create', 'Create', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.title', 'תגיות Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.pageDescription', 'ניהול תגיות לסגמנטציה ואוטומציה של תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.refresh', 'רענן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.createTag', 'צור תגית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.searchPlaceholder', 'חיפוש תגיות...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.noTags', 'לא נמצאו תגיות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.noSearchResults', 'נסה מונח חיפוש אחר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.createFirstTag', 'צור את התגית הראשונה שלך כדי להתחיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.totalTags', 'סך תגיות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.filtered', 'מסונן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.withCategory', 'עם קטגוריה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.tagName', 'שם תגית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.tagNamePlaceholder', 'לדוגמה, תלמיד LMS', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.description', 'תיאור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.descriptionPlaceholder', 'תיאור קצר של תגית זו', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.cancel', 'ביטול', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.create', 'צור', 'admin', NOW(), NOW());

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % new translations', v_inserted_count;

  -- Step 4: Verify final count
  SELECT COUNT(*) INTO v_final_count
  FROM translations
  WHERE tenant_id = v_tenant_id
    AND (
      translation_key LIKE 'admin.keap%'
      OR translation_key LIKE 'admin.nav.keap%'
      OR translation_key LIKE 'admin.integrations.keap%'
    );

  RAISE NOTICE '===============================================';
  RAISE NOTICE 'KEAP TRANSLATIONS MIGRATION COMPLETE';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Deleted: %', v_deleted_count;
  RAISE NOTICE 'Inserted: %', v_inserted_count;
  RAISE NOTICE 'Final count in DB: %', v_final_count;
  RAISE NOTICE 'Expected: 102 (6 nav + 24 integration + 38 dashboard + 34 tags)';

  IF v_final_count = 102 THEN
    RAISE NOTICE 'SUCCESS: All 102 translations are in the database!';
  ELSE
    RAISE WARNING 'MISMATCH: Expected 102 but found %', v_final_count;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'ERROR OCCURRED DURING MIGRATION';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE 'Detail: %', SQLSTATE;
    RAISE;
END $$;
