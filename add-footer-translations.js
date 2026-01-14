const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Footer - Brand Name
  { key: 'public.nav.brandName', en: 'International Parenting School', he: 'בית הספר הבינלאומי להורות' },
  { key: 'public.footer.description', en: 'Empowering learners worldwide with quality education and expert instruction.', he: 'מעצימים לומדים ברחבי העולם עם חינוך איכותי והדרכה מומחית.' },

  // Footer - Platform Section
  { key: 'public.footer.platform', en: 'Platform', he: 'פלטפורמה' },
  { key: 'public.footer.browsePrograms', en: 'Browse Programs', he: 'עיון בתוכניות' },
  { key: 'public.footer.browseCourses', en: 'Browse Courses', he: 'עיון בקורסים' },
  { key: 'public.footer.becomeInstructor', en: 'Become an Instructor', he: 'הפוך למרצה' },
  { key: 'public.footer.pricing', en: 'Pricing', he: 'תמחור' },

  // Footer - Company Section
  { key: 'public.footer.company', en: 'Company', he: 'חברה' },
  { key: 'public.footer.about', en: 'About Us', he: 'אודותינו' },
  { key: 'public.footer.careers', en: 'Careers', he: 'קריירה' },
  { key: 'public.footer.blog', en: 'Blog', he: 'בלוג' },
  { key: 'public.footer.contact', en: 'Contact Us', he: 'צור קשר' },

  // Footer - Support Section
  { key: 'public.footer.support', en: 'Support', he: 'תמיכה' },
  { key: 'public.footer.helpCenter', en: 'Help Center', he: 'מרכז עזרה' },
  { key: 'public.footer.terms', en: 'Terms of Service', he: 'תנאי שירות' },
  { key: 'public.footer.privacy', en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  { key: 'public.footer.accessibility', en: 'Accessibility', he: 'נגישות' },
];

async function addTranslations() {
  console.log('Starting to add footer translations...\n');

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
