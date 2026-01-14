const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Navigation
  { key: 'public.nav.browse', en: 'Browse', he: 'עיון' },
  { key: 'public.nav.programs', en: 'Programs', he: 'תוכניות' },
  { key: 'public.nav.about', en: 'About', he: 'אודות' },
  { key: 'public.nav.login', en: 'Login', he: 'התחברות' },
  { key: 'public.nav.signup', en: 'Sign Up', he: 'הרשמה' },

  // Hero Section
  { key: 'public.hero.badge', en: 'Start Learning Today', he: 'התחל ללמוד היום' },
  { key: 'public.hero.title', en: 'Transform Your Future with Expert-Led Learning', he: 'שנה את עתידך עם למידה מקצועית' },
  { key: 'public.hero.subtitle', en: 'Join thousands of students learning from industry professionals. Master in-demand skills and advance your career.', he: 'הצטרף לאלפי סטודנטים הלומדים ממומחי התעשייה. שלוט במיומנויות מבוקשות וקדם את הקריירה שלך.' },
  { key: 'public.hero.browseCourses', en: 'Browse Courses', he: 'עיון בקורסים' },
  { key: 'public.hero.viewPrograms', en: 'View Programs', he: 'צפה בתוכניות' },

  // Programs Section
  { key: 'public.programs.title', en: 'Featured Programs', he: 'תוכניות מובילות' },
  { key: 'public.programs.subtitle', en: 'Comprehensive learning paths to master your skills', he: 'מסלולי למידה מקיפים לשליטה במיומנויותיך' },

  // Courses Section
  { key: 'public.courses.title', en: 'Popular Courses', he: 'קורסים פופולריים' },
  { key: 'public.courses.subtitle', en: 'Start learning with our most loved courses', he: 'התחל ללמוד עם הקורסים האהובים ביותר שלנו' },
  { key: 'public.courses.viewAll', en: 'View All Courses', he: 'צפה בכל הקורסים' },

  // Categories Section
  { key: 'public.categories.title', en: 'Explore by Category', he: 'חקור לפי קטגוריה' },
  { key: 'public.categories.subtitle', en: 'Find the perfect course for your interests', he: 'מצא את הקורס המושלם לתחומי העניין שלך' },

  // CTA Section
  { key: 'public.cta.title', en: 'Ready to Start Learning?', he: 'מוכן להתחיל ללמוד?' },
  { key: 'public.cta.subtitle', en: 'Join thousands of students and start your journey today', he: 'הצטרף לאלפי סטודנטים והתחל את המסע שלך היום' },
  { key: 'public.cta.button', en: 'Get Started Free', he: 'התחל בחינם' },

  // General
  { key: 'public.viewAll', en: 'View All', he: 'צפה בהכל' },
  { key: 'public.learnMore', en: 'Learn More', he: 'למד עוד' },
];

async function addTranslations() {
  console.log('Starting to add landing page translations...\n');

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
