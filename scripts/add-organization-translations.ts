import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Page Header
  { key: 'organization.title', en: 'Organization Settings', he: 'הגדרות ארגון' },
  { key: 'organization.subtitle', en: 'Manage your organization settings and preferences', he: 'נהל את הגדרות והעדפות הארגון שלך' },

  // Basic Information Section
  { key: 'organization.basicInfo', en: 'Basic Information', he: 'מידע בסיסי' },
  { key: 'organization.basicInfoDesc', en: 'Core details about your organization', he: 'פרטים ליבה על הארגון שלך' },
  { key: 'organization.name', en: 'Organization Name', he: 'שם ארגון' },
  { key: 'organization.slug', en: 'Slug', he: 'מזהה' },
  { key: 'organization.slugNote', en: 'Slug cannot be changed', he: 'לא ניתן לשנות את המזהה' },
  { key: 'organization.adminEmail', en: 'Admin Email', he: 'דוא"ל מנהל' },
  { key: 'organization.status', en: 'Status', he: 'סטטוס' },

  // Logo Upload
  { key: 'organization.logo', en: 'Organization Logo', he: 'לוגו ארגון' },
  { key: 'organization.uploadLogo', en: 'Upload Logo', he: 'העלה לוגו' },
  { key: 'organization.uploading', en: 'Uploading...', he: 'מעלה...' },
  { key: 'organization.logoNote', en: 'PNG, JPG or SVG. Max 2MB.', he: 'PNG, JPG או SVG. מקסימום 2MB.' },
  { key: 'organization.logoError', en: 'Please upload an image file', he: 'אנא העלה קובץ תמונה' },
  { key: 'organization.logoSizeError', en: 'Image must be less than 2MB', he: 'התמונה חייבת להיות פחות מ-2MB' },
  { key: 'organization.logoSuccess', en: 'Logo uploaded successfully', he: 'הלוגו הועלה בהצלחה' },
  { key: 'organization.logoUploadError', en: 'Failed to upload logo', he: 'העלאת הלוגו נכשלה' },

  // Localization Section
  { key: 'organization.localization', en: 'Localization', he: 'לוקליזציה' },
  { key: 'organization.localizationDesc', en: 'Language, timezone, and currency settings', he: 'הגדרות שפה, אזור זמן ומטבע' },
  { key: 'organization.defaultLanguage', en: 'Default Language', he: 'שפת ברירת מחדל' },
  { key: 'organization.timezone', en: 'Timezone', he: 'אזור זמן' },
  { key: 'organization.currency', en: 'Currency', he: 'מטבע' },

  // Features Section
  { key: 'organization.features', en: 'Enabled Features', he: 'תכונות מופעלות' },
  { key: 'organization.featuresDesc', en: 'Enable or disable platform features', he: 'הפעל או השבת תכונות פלטפורמה' },
  { key: 'organization.coursesFeature', en: 'Courses', he: 'קורסים' },
  { key: 'organization.zoomFeature', en: 'Zoom Integration', he: 'אינטגרציית Zoom' },
  { key: 'organization.docusignFeature', en: 'DocuSign Integration', he: 'אינטגרציית DocuSign' },

  // Subscription Section
  { key: 'organization.subscription', en: 'Subscription', he: 'מנוי' },
  { key: 'organization.subscriptionDesc', en: 'Your subscription details and limits', he: 'פרטי המנוי והמגבלות שלך' },
  { key: 'organization.tier', en: 'Tier', he: 'רמה' },
  { key: 'organization.maxUsers', en: 'Max Users', he: 'מקסימום משתמשים' },
  { key: 'organization.maxCourses', en: 'Max Courses', he: 'מקסימום קורסים' },
  { key: 'organization.createdAt', en: 'Created At', he: 'נוצר בתאריך' },

  // Actions
  { key: 'organization.reset', en: 'Reset', he: 'איפוס' },
  { key: 'organization.saveChanges', en: 'Save Changes', he: 'שמור שינויים' },
  { key: 'organization.saving', en: 'Saving...', he: 'שומר...' },

  // Messages
  { key: 'organization.loadError', en: 'Failed to load organization data', he: 'טעינת נתוני הארגון נכשלה' },
  { key: 'organization.saveSuccess', en: 'Organization updated successfully', he: 'הארגון עודכן בהצלחה' },
  { key: 'organization.saveError', en: 'Failed to update organization', he: 'עדכון הארגון נכשל' },
  { key: 'organization.adminRequired', en: 'Admin access required', he: 'נדרשת גישת מנהל' },
];

async function addTranslations() {
  try {
    console.log('Adding organization translations...\n');

    // Get tenant_id
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenants found');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`Using tenant ID: ${tenantId}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      try {
        // Determine category from key (first part)
        const parts = translation.key.split('.');
        const category = parts[0];
        const context = 'admin';

        const { error: enError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'en',
          p_translation_key: translation.key,
          p_translation_value: translation.en,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (enError) {
          console.error(`Error adding EN for ${translation.key}:`, enError.message);
          errorCount++;
          continue;
        }

        // Add Hebrew translation
        const { error: heError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'he',
          p_translation_key: translation.key,
          p_translation_value: translation.he,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (heError) {
          console.error(`Error adding HE for ${translation.key}:`, heError.message);
          errorCount++;
          continue;
        }

        console.log(`✓ ${translation.key}`);
        console.log(`  EN: ${translation.en}`);
        console.log(`  HE: ${translation.he}`);
        successCount++;
      } catch (err) {
        console.error(`Error processing ${translation.key}:`, err);
        errorCount++;
      }
    }

    console.log(`\n✅ Successfully added ${successCount} translations`);
    if (errorCount > 0) {
      console.log(`❌ Failed to add ${errorCount} translations`);
    }
    console.log(`\nTotal translation keys: ${translations.length}`);
  } catch (error) {
    console.error('Error adding translations:', error);
  }
}

addTranslations();
