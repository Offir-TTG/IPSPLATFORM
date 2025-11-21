-- FINAL KEAP TRANSLATIONS FIX
-- Copy this ENTIRE file and paste it into Supabase SQL Editor
-- This uses the simplest possible approach

-- Step 1: Clean slate - delete all existing Keap translations
DELETE FROM translations WHERE translation_key LIKE '%keap%';

-- Step 2: Insert ALL Keap translations (154 total)
-- Navigation
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap.dashboard', 'Keap Dashboard', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap.tags', 'Tags', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap.dashboard', 'לוח בקרה Keap', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap.tags', 'תגיות', 'admin', NOW(), NOW());

-- Integration Config English
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.description', 'CRM and marketing automation platform', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.clientId', 'Client ID', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.clientSecret', 'Client Secret', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.accessToken', 'Access Token', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.refreshToken', 'Refresh Token', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.autoSyncContacts', 'Auto-sync Contacts', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.defaultTagCategory', 'Default Tag Category', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.syncFrequency', 'Sync Frequency', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.syncRealtime', 'Real-time', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.syncHourly', 'Hourly', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.syncDaily', 'Daily', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.integrations.keap.syncManual', 'Manual', 'admin', NOW(), NOW());

-- Integration Config Hebrew
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.description', 'פלטפורמת CRM ואוטומציה שיווקית', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.clientId', 'מזהה לקוח', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.clientSecret', 'סוד לקוח', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.accessToken', 'אסימון גישה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.refreshToken', 'אסימון רענון', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.autoSyncContacts', 'סנכרון אוטומטי של אנשי קשר', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.defaultTagCategory', 'קטגוריית תגיות ברירת מחדל', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.syncFrequency', 'תדירות סנכרון', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.syncRealtime', 'זמן אמת', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.syncHourly', 'כל שעה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.syncDaily', 'יומי', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.integrations.keap.syncManual', 'ידני', 'admin', NOW(), NOW());

-- Dashboard English
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.title', 'Keap Integration', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.description', 'Manage CRM sync and student segmentation', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.totalTags', 'Total Tags', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.syncedStudents', 'Synced Students', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.enabled', 'Enabled', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.disabled', 'Disabled', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.autoSync', 'Auto-Sync', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.never', 'Never', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.lastSync', 'Last Sync', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.manageTags', 'Manage Tags', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.manageTagsDesc', 'View and create tags for student segmentation', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.bulkSync', 'Bulk Sync Students', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.bulkSyncDesc', 'Sync all existing students to Keap CRM', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.settings', 'Integration Settings', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.settingsDesc', 'Configure Keap API credentials and sync options', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.recentActivity', 'Recent Sync Activity', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.noActivity', 'No recent sync activity', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.autoSyncInfo', 'Automatic Sync', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.dashboard.autoSyncInfoDesc', 'When auto-sync is enabled, students are automatically synced to Keap when they enroll in courses or complete lessons. Tags are applied based on their activity.', 'admin', NOW(), NOW());

-- Dashboard Hebrew
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.title', 'אינטגרציית Keap', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.description', 'ניהול סנכרון CRM וסגמנטציה של תלמידים', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.totalTags', 'סך תגיות', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.syncedStudents', 'תלמידים מסונכרנים', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.enabled', 'פעיל', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.disabled', 'לא פעיל', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.autoSync', 'סנכרון אוטומטי', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.never', 'אף פעם', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.lastSync', 'סנכרון אחרון', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.manageTags', 'ניהול תגיות', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.manageTagsDesc', 'צפייה ויצירת תגיות לסגמנטציה של תלמידים', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.bulkSync', 'סנכרון המוני של תלמידים', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.bulkSyncDesc', 'סנכרון כל התלמידים הקיימים ל-Keap CRM', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.settings', 'הגדרות אינטגרציה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.settingsDesc', 'הגדרת אישורי API של Keap ואפשרויות סנכרון', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.recentActivity', 'פעילות סנכרון אחרונה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.noActivity', 'אין פעילות סנכרון אחרונה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.autoSyncInfo', 'סנכרון אוטומטי', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.dashboard.autoSyncInfoDesc', 'כאשר סנכרון אוטומטי מופעל, תלמידים מסונכרנים אוטומטית ל-Keap כאשר הם נרשמים לקורסים או משלימים שיעורים. תגיות מוחלות על בסיס הפעילות שלהם.', 'admin', NOW(), NOW());

-- Tags English
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.title', 'Keap Tags', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.pageDescription', 'Manage tags for student segmentation and automation', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.refresh', 'Refresh', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.createTag', 'Create Tag', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.searchPlaceholder', 'Search tags...', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.noTags', 'No tags found', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.noSearchResults', 'Try a different search term', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.createFirstTag', 'Create your first tag to get started', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.totalTags', 'Total Tags', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.filtered', 'Filtered', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.withCategory', 'With Category', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.tagName', 'Tag Name', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.tagNamePlaceholder', 'e.g., LMS Student', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.description', 'Description', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.descriptionPlaceholder', 'Brief description of this tag', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.cancel', 'Cancel', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.keap.tags.create', 'Create', 'admin', NOW(), NOW());

-- Tags Hebrew
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.title', 'תגיות Keap', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.pageDescription', 'ניהול תגיות לסגמנטציה ואוטומציה של תלמידים', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.refresh', 'רענן', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.createTag', 'צור תגית', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.searchPlaceholder', 'חיפוש תגיות...', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.noTags', 'לא נמצאו תגיות', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.noSearchResults', 'נסה מונח חיפוש אחר', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.createFirstTag', 'צור את התגית הראשונה שלך כדי להתחיל', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.totalTags', 'סך תגיות', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.filtered', 'מסונן', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.withCategory', 'עם קטגוריה', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.tagName', 'שם תגית', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.tagNamePlaceholder', 'לדוגמה, תלמיד LMS', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.description', 'תיאור', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.descriptionPlaceholder', 'תיאור קצר של תגית זו', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.cancel', 'ביטול', 'admin', NOW(), NOW());
INSERT INTO translations VALUES ('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.keap.tags.create', 'צור', 'admin', NOW(), NOW());

-- Verify
SELECT COUNT(*) as keap_translations_count FROM translations WHERE translation_key LIKE '%keap%';
