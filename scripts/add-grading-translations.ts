import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addGradingTranslations() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('📝 Adding grading system translations...\n');

  const translations = [
    // Navigation
    {
      key: 'admin.nav.grading',
      en: 'Grading',
      he: 'ציונים',
      category: 'admin',
    },
    // Grading Scales Page
    {
      key: 'admin.grading.scales.title',
      en: 'Grading Scales',
      he: 'סולמות ציונים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.subtitle',
      en: 'Manage grading scales and grade ranges for courses',
      he: 'ניהול סולמות ציונים וטווחי ציונים לקורסים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.create',
      en: 'Create Scale',
      he: 'יצירת סולם',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.default',
      en: 'Default',
      he: 'ברירת מחדל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.active',
      en: 'Active',
      he: 'פעיל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.inactive',
      en: 'Inactive',
      he: 'לא פעיל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.ranges',
      en: 'Grade Ranges',
      he: 'טווחי ציונים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.failing',
      en: 'Failing',
      he: 'נכשל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.noRanges',
      en: 'No grade ranges defined',
      he: 'לא הוגדרו טווחי ציונים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.empty.title',
      en: 'No Grading Scales',
      he: 'אין סולמות ציונים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.empty.description',
      en: 'Create your first grading scale to get started',
      he: 'צור את סולם הציונים הראשון שלך כדי להתחיל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.info.title',
      en: 'About Grading Scales',
      he: 'אודות סולמות ציונים',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.info.description',
      en: 'Grading scales define how percentages are converted to letter grades. You can create multiple scales for different course types (e.g., Letter Grades A-F, Pass/Fail, Numeric 0-100). Set one scale as default to automatically apply it to new courses.',
      he: 'סולמות ציונים מגדירים כיצד אחוזים מומרים לציוני אותיות. ניתן ליצור מספר סולמות לסוגי קורסים שונים (למשל, ציוני אותיות A-F, עבר/נכשל, מספרי 0-100). הגדר סולם אחד כברירת מחדל כדי להחיל אותו אוטומטית על קורסים חדשים.',
      category: 'admin',
    },
    // Create Dialog
    {
      key: 'admin.grading.scales.createDescription',
      en: 'Create a new grading scale for your courses',
      he: 'צור סולם ציונים חדש לקורסים שלך',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.name',
      en: 'Name',
      he: 'שם',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.namePlaceholder',
      en: 'e.g., Standard Letter Grade (A-F)',
      he: 'למשל, ציון אותיות סטנדרטי (A-F)',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.description',
      en: 'Description',
      he: 'תיאור',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.descriptionPlaceholder',
      en: 'Optional description...',
      he: 'תיאור אופציונלי...',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.type',
      en: 'Scale Type',
      he: 'סוג סולם',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.default',
      en: 'Set as Default',
      he: 'הגדר כברירת מחדל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.form.active',
      en: 'Active',
      he: 'פעיל',
      category: 'admin',
    },
    // Scale Types
    {
      key: 'admin.grading.scales.types.letter',
      en: 'Letter Grade (A-F)',
      he: 'ציון אותיות (A-F)',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.types.numeric',
      en: 'Numeric (0-100)',
      he: 'מספרי (0-100)',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.types.passfail',
      en: 'Pass/Fail',
      he: 'עבר/נכשל',
      category: 'admin',
    },
    {
      key: 'admin.grading.scales.types.custom',
      en: 'Custom',
      he: 'מותאם אישית',
      category: 'admin',
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const trans of translations) {
    // English
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: trans.key,
      p_translation_value: trans.en,
      p_category: trans.category,
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error(`❌ Error adding EN ${trans.key}:`, enError.message);
      errorCount++;
    } else {
      console.log(`✓ Added EN: ${trans.key}`);
      successCount++;
    }

    // Hebrew
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: trans.key,
      p_translation_value: trans.he,
      p_category: trans.category,
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error(`❌ Error adding HE ${trans.key}:`, heError.message);
      errorCount++;
    } else {
      console.log(`✓ Added HE: ${trans.key}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully added: ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(60));
}

addGradingTranslations().catch(console.error);
