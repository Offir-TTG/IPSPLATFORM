const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Navigation
  { key: 'public.nav.brandName', en: 'EduPlatform', he: 'פלטפורמת למידה' },
  { key: 'public.nav.login', en: 'Login', he: 'התחבר' },
  { key: 'public.nav.signup', en: 'Sign Up', he: 'הרשם' },

  // Hero Section
  { key: 'public.hero.title', en: 'Transform Your Future with Expert-Led Learning', he: 'שנה את עתידך עם למידה מומחית' },
  { key: 'public.hero.subtitle', en: 'Access world-class courses and programs designed to help you achieve your goals', he: 'גש לקורסים ותוכניות ברמה עולמית שנועדו לעזור לך להגשים את מטרותיך' },
  { key: 'public.hero.getStarted', en: 'Get Started', he: 'התחל עכשיו' },
  { key: 'public.hero.exploreCourses', en: 'Explore Courses', he: 'גלה קורסים' },

  // Programs Section
  { key: 'public.programs.title', en: 'Featured Programs', he: 'תוכניות מומלצות' },
  { key: 'public.programs.subtitle', en: 'Comprehensive learning paths designed by industry experts', he: 'מסלולי למידה מקיפים שעוצבו על ידי מומחי התעשייה' },
  { key: 'public.programs.viewAll', en: 'View All Programs', he: 'צפה בכל התוכניות' },
  { key: 'public.programs.program', en: 'Program', he: 'תוכנית' },

  // Courses Section
  { key: 'public.courses.title', en: 'Popular Courses', he: 'קורסים פופולריים' },
  { key: 'public.courses.subtitle', en: 'Learn new skills with our expertly crafted courses', he: 'למד מهارות חדשות עם הקורסים המעוצבים בקפידה' },
  { key: 'public.courses.viewAll', en: 'View All Courses', he: 'צפה בכל הקורסים' },
  { key: 'public.courses.course', en: 'Course', he: 'קורס' },

  // Footer
  { key: 'public.footer.description', en: 'Empowering learners worldwide with quality education and expert instruction.', he: 'מעצימים לומדים ברחבי העולם עם חינוך איכותי והדרכה מומחית.' },
  { key: 'public.footer.platform', en: 'Platform', he: 'פלטפורמה' },
  { key: 'public.footer.browsePrograms', en: 'Browse Programs', he: 'עיין בתוכניות' },
  { key: 'public.footer.browseCourses', en: 'Browse Courses', he: 'עיין בקורסים' },
  { key: 'public.footer.company', en: 'Company', he: 'החברה' },
  { key: 'public.footer.about', en: 'About Us', he: 'אודותינו' },
  { key: 'public.footer.contact', en: 'Contact Us', he: 'צור קשר' },
  { key: 'public.footer.support', en: 'Support', he: 'תמיכה' },
  { key: 'public.footer.helpCenter', en: 'Help Center', he: 'מרכז עזרה' },
  { key: 'public.footer.terms', en: 'Terms of Service', he: 'תנאי שימוש' },
  { key: 'public.footer.privacy', en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  { key: 'public.footer.rights', en: 'All rights reserved', he: 'כל הזכויות שמורות' },
];

async function addTranslations() {
  console.log('Starting to add public page translations...\n');

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
