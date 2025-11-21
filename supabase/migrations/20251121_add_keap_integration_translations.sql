-- ============================================================================
-- Keap Integration Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for Keap (Infusionsoft) integration
-- Author: System
-- Date: 2025-01-21

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'admin.integrations.keap.description',
      'admin.integrations.keap.clientId',
      'admin.integrations.keap.clientIdPlaceholder',
      'admin.integrations.keap.clientSecret',
      'admin.integrations.keap.clientSecretPlaceholder',
      'admin.integrations.keap.accessToken',
      'admin.integrations.keap.accessTokenPlaceholder',
      'admin.integrations.keap.refreshToken',
      'admin.integrations.keap.refreshTokenPlaceholder',
      'admin.integrations.keap.autoSyncContacts',
      'admin.integrations.keap.defaultTagCategory',
      'admin.integrations.keap.defaultTagCategoryPlaceholder',
      'admin.integrations.keap.syncFrequency',
      'admin.integrations.keap.syncRealtime',
      'admin.integrations.keap.syncHourly',
      'admin.integrations.keap.syncDaily',
      'admin.integrations.keap.syncManual'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English translations
  (v_tenant_id, 'en', 'admin.integrations.keap.description', 'CRM and marketing automation platform', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientId', 'Client ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientIdPlaceholder', 'Your Keap Client ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientSecret', 'Client Secret', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.clientSecretPlaceholder', 'Your Keap Client Secret', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.accessToken', 'Access Token', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.accessTokenPlaceholder', 'Generated after OAuth authorization', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.refreshToken', 'Refresh Token', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.refreshTokenPlaceholder', 'Generated after OAuth authorization', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.autoSyncContacts', 'Auto-sync Contacts', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.defaultTagCategory', 'Default Tag Category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.defaultTagCategoryPlaceholder', 'LMS Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncFrequency', 'Sync Frequency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncRealtime', 'Real-time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncHourly', 'Hourly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncDaily', 'Daily', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.integrations.keap.syncManual', 'Manual', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'admin.integrations.keap.description', 'פלטפורמת CRM ואוטומציה שיווקית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientId', 'מזהה לקוח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientIdPlaceholder', 'מזהה הלקוח שלך ב-Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientSecret', 'סוד לקוח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.clientSecretPlaceholder', 'סוד הלקוח שלך ב-Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.accessToken', 'אסימון גישה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.accessTokenPlaceholder', 'נוצר לאחר אימות OAuth', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.refreshToken', 'אסימון רענון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.refreshTokenPlaceholder', 'נוצר לאחר אימות OAuth', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.autoSyncContacts', 'סנכרון אוטומטי של אנשי קשר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.defaultTagCategory', 'קטגוריית תגית ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.defaultTagCategoryPlaceholder', 'תלמידי LMS', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncFrequency', 'תדירות סנכרון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncRealtime', 'בזמן אמת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncHourly', 'כל שעה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncDaily', 'יומי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.keap.syncManual', 'ידני', 'admin', NOW(), NOW());

  RAISE NOTICE 'Keap integration translations added successfully';

END $$;
