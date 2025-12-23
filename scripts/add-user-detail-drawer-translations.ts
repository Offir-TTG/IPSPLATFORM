import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Tab labels
  { key: 'admin.users.drawer.tabs.basic', en: 'Basic Info', he: 'מידע בסיסי' },
  { key: 'admin.users.drawer.tabs.profile', en: 'Profile', he: 'פרופיל' },
  { key: 'admin.users.drawer.tabs.security', en: 'Security', he: 'אבטחה' },

  // Basic Info fields
  { key: 'admin.users.drawer.firstName', en: 'First Name', he: 'שם פרטי' },
  { key: 'admin.users.drawer.lastName', en: 'Last Name', he: 'שם משפחה' },
  { key: 'admin.users.drawer.email', en: 'Email', he: 'אימייל' },
  { key: 'admin.users.drawer.phone', en: 'Phone', he: 'טלפון' },
  { key: 'admin.users.drawer.role', en: 'Role', he: 'תפקיד' },
  { key: 'admin.users.drawer.status', en: 'Status', he: 'סטטוס' },

  // Role options
  { key: 'admin.users.drawer.role.student', en: 'Student', he: 'תלמיד' },
  { key: 'admin.users.drawer.role.instructor', en: 'Instructor', he: 'מרצה' },
  { key: 'admin.users.drawer.role.staff', en: 'Staff', he: 'צוות' },
  { key: 'admin.users.drawer.role.admin', en: 'Admin', he: 'מנהל' },
  { key: 'admin.users.drawer.role.selectRole', en: 'Select role', he: 'בחר תפקיד' },

  // Status options
  { key: 'admin.users.drawer.status.active', en: 'Active', he: 'פעיל' },
  { key: 'admin.users.drawer.status.invited', en: 'Invited', he: 'מוזמן' },
  { key: 'admin.users.drawer.status.suspended', en: 'Suspended', he: 'מושעה' },
  { key: 'admin.users.drawer.status.deleted', en: 'Deleted', he: 'נמחק' },

  // Profile fields
  { key: 'admin.users.drawer.bio', en: 'Bio', he: 'ביוגרפיה' },
  { key: 'admin.users.drawer.bioPlaceholder', en: 'Tell us about yourself...', he: 'ספר לנו על עצמך...' },
  { key: 'admin.users.drawer.location', en: 'Location', he: 'מיקום' },
  { key: 'admin.users.drawer.locationPlaceholder', en: 'City, Country', he: 'עיר, מדינה' },
  { key: 'admin.users.drawer.contactEmail', en: 'Contact Email', he: 'אימייל ליצירת קשר' },
  { key: 'admin.users.drawer.contactEmailPlaceholder', en: 'Alternative email address', he: 'כתובת אימייל חלופית' },
  { key: 'admin.users.drawer.isWhatsapp', en: 'Phone number is WhatsApp', he: 'מספר הטלפון הוא WhatsApp' },
  { key: 'admin.users.drawer.isWhatsappDescription', en: 'Enable if this phone number can receive WhatsApp messages', he: 'הפעל אם מספר טלפון זה יכול לקבל הודעות WhatsApp' },

  // Security Tab
  { key: 'admin.users.drawer.accountCreated', en: 'Account Created', he: 'תאריך יצירת חשבון' },
  { key: 'admin.users.drawer.lastLogin', en: 'Last Login', he: 'התחברות אחרונה' },
  { key: 'admin.users.drawer.enrollments', en: 'Enrollments', he: 'רישומים' },
  { key: 'admin.users.drawer.completedCourses', en: 'Completed Courses', he: 'קורסים שהושלמו' },
  { key: 'admin.users.drawer.never', en: 'Never', he: 'אף פעם' },
  { key: 'admin.users.drawer.notAvailable', en: 'N/A', he: 'לא זמין' },

  // Actions
  { key: 'admin.users.drawer.cancel', en: 'Cancel', he: 'ביטול' },
  { key: 'admin.users.drawer.saveChanges', en: 'Save Changes', he: 'שמור שינויים' },
  { key: 'admin.users.drawer.saving', en: 'Saving...', he: 'שומר...' },

  // Messages
  { key: 'admin.users.drawer.updateSuccess', en: 'User updated successfully', he: 'המשתמש עודכן בהצלחה' },
  { key: 'admin.users.drawer.updateError', en: 'Failed to update user', he: 'נכשל בעדכון המשתמש' },
  { key: 'admin.users.drawer.loadError', en: 'Failed to load user details', he: 'נכשל בטעינת פרטי המשתמש' },

  // Unsaved changes dialog
  { key: 'admin.users.drawer.unsavedChanges.title', en: 'Unsaved Changes', he: 'שינויים שלא נשמרו' },
  { key: 'admin.users.drawer.unsavedChanges', en: 'You have unsaved changes. Are you sure you want to close?', he: 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור?' },
  { key: 'admin.users.drawer.unsavedChanges.stay', en: 'Stay', he: 'הישאר' },
  { key: 'admin.users.drawer.unsavedChanges.discard', en: 'Discard Changes', he: 'בטל שינויים' },

  // Validation messages
  { key: 'admin.users.drawer.validation.firstNameRequired', en: 'First name is required', he: 'שם פרטי הוא שדה חובה' },
  { key: 'admin.users.drawer.validation.lastNameRequired', en: 'Last name is required', he: 'שם משפחה הוא שדה חובה' },
  { key: 'admin.users.drawer.validation.invalidEmail', en: 'Invalid email address', he: 'כתובת אימייל לא תקינה' },
  { key: 'admin.users.drawer.validation.invalidZipCode', en: 'Invalid ZIP code', he: 'מיקוד לא תקין' },
];

async function addUserDetailDrawerTranslations() {
  try {
    console.log('🚀 Adding user detail drawer translations...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translations to avoid duplicates
    const translationKeys = translations.map(t => t.key);
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', translationKeys)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    } else {
      console.log('✓ Cleaned up existing translations\n');
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations in batches
    const batchSize = 100;
    for (let i = 0; i < translationEntries.length; i += batchSize) {
      const batch = translationEntries.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('translations')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert translations batch ${i / batchSize + 1}: ${insertError.message}`);
      }
      console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} entries)`);
    }

    console.log('\n✅ Successfully added user detail drawer translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationEntries.length} entries\n`);

    // Display summary by category
    console.log('📊 Summary by category:');
    console.log('  - Tab labels: 3');
    console.log('  - Basic Info fields: 6');
    console.log('  - Role options: 5');
    console.log('  - Status options: 4');
    console.log('  - Profile fields: 8');
    console.log('  - Security Tab: 6');
    console.log('  - Actions: 3');
    console.log('  - Messages: 3');
    console.log('  - Unsaved changes dialog: 4');
    console.log('  - Validation messages: 4\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addUserDetailDrawerTranslations();
