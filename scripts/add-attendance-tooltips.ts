import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTooltips() {
  try {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Tooltip translations
    const translations = [
      // Action button tooltips
      { key: 'admin.attendance.tooltip.export', en: 'Export attendance data to CSV file', he: 'ייצא נתוני נוכחות לקובץ CSV' },
      { key: 'admin.attendance.tooltip.save', en: 'Save all attendance changes', he: 'שמור את כל שינויי הנוכחות' },
      { key: 'admin.attendance.tooltip.back', en: 'Return to course details', he: 'חזור לפרטי הקורס' },

      // Quick action tooltips
      { key: 'admin.attendance.tooltip.markAllPresent', en: 'Mark all students as present', he: 'סמן את כל התלמידים כנוכחים' },
      { key: 'admin.attendance.tooltip.markAllAbsent', en: 'Mark all students as absent', he: 'סמן את כל התלמידים כנעדרים' },
      { key: 'admin.attendance.tooltip.clearAll', en: 'Clear all attendance markings', he: 'נקה את כל סימוני הנוכחות' },

      // Filter tooltips
      { key: 'admin.attendance.tooltip.program', en: 'Filter courses by program', he: 'סנן קורסים לפי תוכנית' },
      { key: 'admin.attendance.tooltip.course', en: 'Select course to view attendance', he: 'בחר קורס לצפייה בנוכחות' },
      { key: 'admin.attendance.tooltip.date', en: 'Select date for attendance tracking', he: 'בחר תאריך למעקב נוכחות' },
      { key: 'admin.attendance.tooltip.lesson', en: 'Filter by specific lesson (optional)', he: 'סנן לפי שיעור ספציפי (אופציונלי)' },
      { key: 'admin.attendance.tooltip.search', en: 'Search students by name or email', he: 'חפש תלמידים לפי שם או אימייל' },

      // Status tooltips
      { key: 'admin.attendance.tooltip.present', en: 'Student was present', he: 'התלמיד היה נוכח' },
      { key: 'admin.attendance.tooltip.late', en: 'Student arrived late', he: 'התלמיד הגיע באיחור' },
      { key: 'admin.attendance.tooltip.absent', en: 'Student was absent', he: 'התלמיד נעדר' },
      { key: 'admin.attendance.tooltip.excused', en: 'Absence was excused', he: 'היעדרות מאושרת' },

      // Notes tooltip
      { key: 'admin.attendance.tooltip.notes', en: 'Add notes about student attendance', he: 'הוסף הערות לגבי נוכחות התלמיד' },
    ];

    // Delete existing tooltips
    const keys = translations.map(t => t.key);
    await supabase
      .from('translations')
      .delete()
      .in('translation_key', keys);

    console.log('Deleted old tooltip translations');

    // Insert new translations
    const translationsToInsert = translations.flatMap(t => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: t.key,
        translation_value: t.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: t.key,
        translation_value: t.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const { error } = await supabase
      .from('translations')
      .insert(translationsToInsert);

    if (error) {
      console.error('Error inserting translations:', error);
      throw error;
    }

    console.log('✅ Successfully added attendance tooltip translations');
    console.log(`Total: ${translations.length} keys × 2 languages = ${translationsToInsert.length} entries`);

  } catch (error) {
    console.error('Failed to add translations:', error);
    process.exit(1);
  }
}

addTooltips();
