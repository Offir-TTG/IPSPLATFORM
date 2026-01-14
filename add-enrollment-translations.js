const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Product Pricing
  { key: 'public.products.free', en: 'Free', he: 'חינם' },
  { key: 'public.products.installments', en: 'Installments Available', he: 'תשלומים זמינים' },
  { key: 'public.products.viewDetails', en: 'View Details', he: 'צפה בפרטים' },
  { key: 'public.products.enrollNow', en: 'Enroll Now', he: 'הירשם עכשיו' },
  { key: 'public.products.from', en: 'From', he: 'החל מ-' },

  // Program Detail Page
  { key: 'public.programs.program', en: 'Program', he: 'תוכנית' },
  { key: 'detail.back', en: 'Back', he: 'חזרה' },
  { key: 'detail.backToHome', en: 'Back to Home', he: 'חזרה לדף הבית' },
  { key: 'detail.enrollButton', en: 'Enroll Now', he: 'הירשם עכשיו' },
  { key: 'detail.enrolling', en: 'Enrolling...', he: 'נרשם...' },
  { key: 'detail.aboutProgram', en: 'About This Program', he: 'אודות התוכנית' },
  { key: 'detail.aboutCourse', en: 'About This Course', he: 'אודות הקורס' },

  // Pricing Section
  { key: 'detail.pricing.title', en: 'Pricing', he: 'תמחור' },
  { key: 'detail.pricing.monthlyPayments', en: 'monthly payments available', he: 'תשלומים חודשיים זמינים' },

  // Stats
  { key: 'detail.stats.courses', en: 'Courses', he: 'קורסים' },
  { key: 'detail.stats.lessons', en: 'Lessons', he: 'שיעורים' },
  { key: 'detail.stats.hours', en: 'Hours', he: 'שעות' },
  { key: 'detail.stats.students', en: 'Students Enrolled', he: 'סטודנטים נרשמו' },

  // Program/Course Includes
  { key: 'detail.includes', en: 'This program includes:', he: 'תוכנית זו כוללת:' },
  { key: 'detail.courseIncludes', en: 'This course includes:', he: 'קורס זה כולל:' },
  { key: 'detail.coursesDesc', en: 'Comprehensive curriculum', he: 'תכנית לימודים מקיפה' },
  { key: 'detail.lessonsDesc', en: 'Step-by-step learning', he: 'למידה שלב אחר שלב' },
  { key: 'detail.hoursDesc', en: 'Of video content', he: 'של תוכן וידאו' },
  { key: 'detail.access', en: 'Lifetime Access', he: 'גישה לכל החיים' },
  { key: 'detail.accessDesc', en: 'Learn at your own pace', he: 'למד בקצב שלך' },

  // Error Messages
  { key: 'errors.alreadyEnrolled', en: 'Already Enrolled', he: 'כבר נרשם' },
  { key: 'errors.alreadyEnrolledDesc', en: 'You are already enrolled in this program', he: 'אתה כבר רשום לתוכנית זו' },
  { key: 'errors.enrollmentFailed', en: 'Enrollment Failed', he: 'ההרשמה נכשלה' },
  { key: 'errors.productNotFound', en: 'Product not found or unavailable', he: 'המוצר לא נמצא או לא זמין' },

  // Curriculum Section
  { key: 'detail.curriculum', en: 'Program Curriculum', he: 'תכנית הלימודים' },
  { key: 'detail.modules', en: 'Course Content', he: 'תוכן הקורס' },
  { key: 'detail.min', en: 'min', he: 'דק\'' },
  { key: 'detail.whatYouWillLearn', en: 'What You Will Learn', he: 'מה תלמד' },
  { key: 'detail.requirements', en: 'Requirements', he: 'דרישות' },
  { key: 'detail.instructor', en: 'Instructor', he: 'מדריך' },
  { key: 'detail.certificate', en: 'Certificate', he: 'תעודה' },
  { key: 'detail.certificateDesc', en: 'Upon completion', he: 'עם סיום התוכנית' },
];

async function addTranslations() {
  console.log('Starting to add enrollment translations...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const translation of translations) {
    const { key, en, he } = translation;

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he')
      .eq('context', 'user');

    if (existingHe && existingHe.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: he })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated HE: ${key}`);
      } else {
        console.error(`Error updating HE for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: he,
          language_code: 'he',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added HE: ${key}`);
      } else {
        console.error(`Error adding HE for ${key}:`, insertError.message);
      }
    }

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en')
      .eq('context', 'user');

    if (existingEn && existingEn.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: en })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated EN: ${key}`);
      } else {
        console.error(`Error updating EN for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: en,
          language_code: 'en',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added EN: ${key}`);
      } else {
        console.error(`Error adding EN for ${key}:`, insertError.message);
      }
    }
  }

  console.log(`\n✅ Completed!`);
  console.log(`   Added: ${addedCount} translations`);
  console.log(`   Updated: ${updatedCount} translations`);
}

addTranslations().catch(console.error);
