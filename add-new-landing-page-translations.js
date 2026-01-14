const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Navigation
  { key: 'public.nav.brandName', en: 'International Parenting School', he: 'בית הספר הבינלאומי להורות' },
  { key: 'public.nav.login', en: 'Login', he: 'התחברות' },
  { key: 'public.nav.signup', en: 'Sign Up', he: 'הרשמה' },

  // Hero Section
  { key: 'public.hero.badge', en: 'Transform Your Learning Journey', he: 'שנה את מסע הלמידה שלך' },
  { key: 'public.hero.title', en: 'Learn Without Limits', he: 'למד ללא גבולות' },
  { key: 'public.hero.subtitle', en: 'Access quality education from expert instructors. Start learning today.', he: 'גישה לחינוך איכותי ממורים מומחים. התחל ללמוד היום.' },
  { key: 'public.hero.browseCourses', en: 'Browse Courses', he: 'עיון בקורסים' },
  { key: 'public.hero.getStarted', en: 'Get Started Free', he: 'התחל בחינם' },

  // Stats
  { key: 'public.stats.students', en: 'Active Students', he: 'סטודנטים פעילים' },
  { key: 'public.stats.courses', en: 'Expert Courses', he: 'קורסים מומחים' },
  { key: 'public.stats.certificates', en: 'Certifications', he: 'תעודות' },
  { key: 'public.stats.satisfaction', en: 'Satisfaction Rate', he: 'שביעות רצון' },

  // Programs Section
  { key: 'public.programs.badge', en: 'Structured Learning', he: 'למידה מובנית' },
  { key: 'public.programs.title', en: 'Featured Programs', he: 'תוכניות מובילות' },
  { key: 'public.programs.subtitle', en: 'Structured learning paths to master your skills', he: 'מסלולי למידה מובנים לשליטה במיומנויות שלך' },
  { key: 'public.programs.program', en: 'Program', he: 'תוכנית' },
  { key: 'public.programs.courses', en: 'courses', he: 'קורסים' },
  { key: 'public.programs.hours', en: 'hours', he: 'שעות' },
  { key: 'public.programs.viewAll', en: 'View All Programs', he: 'צפה בכל התוכניות' },
  { key: 'public.programs.noPrograms', en: 'No programs available at the moment', he: 'אין תוכניות זמינות כרגע' },

  // Courses Section
  { key: 'public.courses.badge', en: 'Individual Courses', he: 'קורסים עצמאיים' },
  { key: 'public.courses.title', en: 'Featured Courses', he: 'קורסים מובילים' },
  { key: 'public.courses.subtitle', en: 'Start with our most popular standalone courses', he: 'התחל עם הקורסים העצמאיים הפופולריים ביותר שלנו' },
  { key: 'public.courses.lessons', en: 'lessons', he: 'שיעורים' },
  { key: 'public.courses.hours', en: 'hours', he: 'שעות' },
  { key: 'public.courses.viewAll', en: 'View All Courses', he: 'צפה בכל הקורסים' },
  { key: 'public.courses.noCourses', en: 'No courses available at the moment', he: 'אין קורסים זמינים כרגע' },

  // How It Works Section
  { key: 'public.howItWorks.badge', en: 'Simple Process', he: 'תהליך פשוט' },
  { key: 'public.howItWorks.title', en: 'How It Works', he: 'איך זה עובד' },
  { key: 'public.howItWorks.subtitle', en: 'Getting started is simple', he: 'להתחיל זה פשוט' },
  { key: 'public.howItWorks.step', en: 'Step', he: 'שלב' },
  { key: 'public.howItWorks.step1.title', en: 'Browse Courses', he: 'עיין בקורסים' },
  { key: 'public.howItWorks.step1.description', en: 'Explore our catalog of courses and programs', he: 'חקור את קטלוג הקורסים והתוכניות שלנו' },
  { key: 'public.howItWorks.step2.title', en: 'Enroll & Learn', he: 'הירשם ולמד' },
  { key: 'public.howItWorks.step2.description', en: 'Start learning at your own pace', he: 'התחל ללמוד בקצב שלך' },
  { key: 'public.howItWorks.step3.title', en: 'Earn Certificate', he: 'קבל תעודה' },
  { key: 'public.howItWorks.step3.description', en: 'Complete courses and earn recognized certificates', he: 'סיים קורסים וקבל תעודות מוכרות' },

  // FAQ Section
  { key: 'public.faq.badge', en: 'Help Center', he: 'מרכז עזרה' },
  { key: 'public.faq.title', en: 'Frequently Asked Questions', he: 'שאלות נפוצות' },
  { key: 'public.faq.subtitle', en: 'Find answers to common questions', he: 'מצא תשובות לשאלות נפוצות' },
  { key: 'public.faq.q1.question', en: 'How do I enroll in a course?', he: 'איך נרשמים לקורס?' },
  { key: 'public.faq.q1.answer', en: 'Simply browse our course catalog, select a course, and click the enroll button. You can start learning immediately after enrollment.', he: 'פשוט עיין בקטלוג הקורסים, בחר קורס ולחץ על כפתור ההרשמה. תוכל להתחיל ללמוד מיד לאחר ההרשמה.' },
  { key: 'public.faq.q2.question', en: 'Can I learn at my own pace?', he: 'האם אוכל ללמוד בקצב שלי?' },
  { key: 'public.faq.q2.answer', en: 'Yes! All courses are self-paced, allowing you to learn whenever and wherever you want.', he: 'כן! כל הקורסים הם בקצב עצמי, מה שמאפשר לך ללמוד מתי ואיפה שתרצה.' },
  { key: 'public.faq.q3.question', en: 'Do I get a certificate?', he: 'האם אקבל תעודה?' },
  { key: 'public.faq.q3.answer', en: 'Yes, you will receive a certificate of completion for each course you finish successfully.', he: 'כן, תקבל תעודת סיום עבור כל קורס שתסיים בהצלחה.' },
  { key: 'public.faq.q4.question', en: 'What if I need help?', he: 'מה אם אצטרך עזרה?' },
  { key: 'public.faq.q4.answer', en: 'Our instructors and support team are here to help. You can reach out through the platform for assistance.', he: 'המורים וצוות התמיכה שלנו כאן כדי לעזור. תוכל לפנות דרך הפלטפורמה לקבלת סיוע.' },

  // CTA Section
  { key: 'public.cta.title', en: 'Ready to Start Learning?', he: 'מוכן להתחיל ללמוד?' },
  { key: 'public.cta.subtitle', en: 'Join our learning community today', he: 'הצטרף לקהילת הלמידה שלנו היום' },
  { key: 'public.cta.button', en: 'Get Started Free', he: 'התחל בחינם' },

  // Footer
  { key: 'public.footer.about', en: 'About', he: 'אודות' },
  { key: 'public.footer.privacy', en: 'Privacy', he: 'פרטיות' },
  { key: 'public.footer.terms', en: 'Terms', he: 'תנאים' },
  { key: 'public.footer.rights', en: 'All rights reserved', he: 'כל הזכויות שמורות' },
];

async function addTranslations() {
  console.log('Starting to add new landing page translations...\n');

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
