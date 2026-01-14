const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Browse pages
  { key: 'browse.programs.badge', en: 'All Programs', he: 'כל התוכניות' },
  { key: 'browse.programs.title', en: 'Browse All Programs', he: 'עיון בכל התוכניות' },
  { key: 'browse.programs.subtitle', en: 'Explore our comprehensive learning programs', he: 'גלו את תוכניות הלימוד המקיפות שלנו' },
  { key: 'browse.courses.badge', en: 'All Courses', he: 'כל הקורסים' },
  { key: 'browse.courses.title', en: 'Browse All Courses', he: 'עיון בכל הקורסים' },
  { key: 'browse.courses.subtitle', en: 'Discover courses taught by expert instructors', he: 'גלו קורסים המועברים על ידי מדריכים מומחים' },
  { key: 'browse.search', en: 'Search programs...', he: 'חיפוש תוכניות...' },
  { key: 'browse.search.courses', en: 'Search courses...', he: 'חיפוש קורסים...' },
  { key: 'browse.price', en: 'Price', he: 'מחיר' },
  { key: 'browse.price.all', en: 'All Prices', he: 'כל המחירים' },
  { key: 'browse.price.free', en: 'Free', he: 'חינם' },
  { key: 'browse.price.paid', en: 'Paid', he: 'בתשלום' },
  { key: 'browse.sort', en: 'Sort by', he: 'מיון לפי' },
  { key: 'browse.sort.newest', en: 'Newest', he: 'החדשים ביותר' },
  { key: 'browse.sort.popular', en: 'Most Popular', he: 'הפופולריים ביותר' },
  { key: 'browse.sort.priceLow', en: 'Price: Low to High', he: 'מחיר: מהנמוך לגבוה' },
  { key: 'browse.sort.priceHigh', en: 'Price: High to Low', he: 'מחיר: מהגבוה לנמוך' },
  { key: 'browse.clear', en: 'Clear', he: 'נקה' },
  { key: 'browse.showing', en: 'Showing', he: 'מציג' },
  { key: 'browse.of', en: 'of', he: 'מתוך' },
  { key: 'browse.programs', en: 'programs', he: 'תוכניות' },
  { key: 'browse.courses', en: 'courses', he: 'קורסים' },
  { key: 'browse.error.title', en: 'Failed to Load', he: 'טעינה נכשלה' },
  { key: 'browse.error.retry', en: 'Try Again', he: 'נסה שוב' },
  { key: 'browse.noResults.title', en: 'No Results Found', he: 'לא נמצאו תוצאות' },
  { key: 'browse.noResults.description', en: 'Try adjusting your filters or search query', he: 'נסה לשנות את המסננים או את שאילתת החיפוש' },
  { key: 'browse.noResults.clear', en: 'Clear Filters', he: 'נקה מסננים' },

  // View All buttons
  { key: 'public.programs.viewAll', en: 'View All Programs', he: 'צפה בכל התוכניות' },
  { key: 'public.courses.viewAll', en: 'View All Courses', he: 'צפה בכל הקורסים' },

  // How It Works
  { key: 'howItWorks.badge', en: 'Simple Process', he: 'תהליך פשוט' },
  { key: 'howItWorks.title', en: 'How It Works', he: 'איך זה עובד' },
  { key: 'howItWorks.subtitle', en: 'Start your learning journey in 4 simple steps', he: 'התחל את מסע הלימוד שלך ב-4 שלבים פשוטים' },
  { key: 'howItWorks.step1.title', en: 'Choose Your Program', he: 'בחר את התוכנית שלך' },
  { key: 'howItWorks.step1.description', en: 'Browse our programs and courses to find the perfect fit for your goals', he: 'עיין בתוכניות והקורסים שלנו כדי למצוא את ההתאמה המושלמת ליעדים שלך' },
  { key: 'howItWorks.step2.title', en: 'Enroll & Complete Profile', he: 'הירשם והשלם פרופיל' },
  { key: 'howItWorks.step2.description', en: 'Sign up, complete your profile, and choose your payment plan', he: 'הירשם, השלם את הפרופיל שלך ובחר את תוכנית התשלום' },
  { key: 'howItWorks.step3.title', en: 'Learn at Your Pace', he: 'למד בקצב שלך' },
  { key: 'howItWorks.step3.description', en: 'Access lessons, participate in live sessions, and engage with the community', he: 'גש לשיעורים, השתתף בשיעורים חיים והתחבר לקהילה' },
  { key: 'howItWorks.step4.title', en: 'Get Certified', he: 'קבל הסמכה' },
  { key: 'howItWorks.step4.description', en: 'Complete your program and receive your professional certification', he: 'השלם את התוכנית וקבל את ההסמכה המקצועית שלך' },

  // Accreditation
  { key: 'accreditation.badge', en: 'Accreditation', he: 'הסמכה' },
  { key: 'accreditation.title', en: 'Internationally Recognized Certification', he: 'הסמכה מוכרת בינלאומית' },
  { key: 'accreditation.description', en: 'Our programs are developed in partnership with leading academic institutions and professional organizations', he: 'התוכניות שלנו מפותחות בשיתוף עם מוסדות אקדמיים מובילים וארגונים מקצועיים' },
  { key: 'accreditation.university.title', en: 'University Partnership', he: 'שיתוף פעולה אוניברסיטאי' },
  { key: 'accreditation.university.description', en: 'Certified by University of Haifa Clinical Center', he: 'מוסמך על ידי המרכז הקליני של אוניברסיטת חיפה' },
  { key: 'accreditation.adler.title', en: 'Adler Methodology', he: 'שיטת אדלר' },
  { key: 'accreditation.adler.description', en: "Based on Alfred Adler's proven approach to parent guidance", he: 'מבוסס על הגישה המוכחת של אלפרד אדלר להדרכת הורים' },
  { key: 'accreditation.professional.title', en: 'Professional Recognition', he: 'הכרה מקצועית' },
  { key: 'accreditation.professional.description', en: 'Recognized by professional parent guidance associations', he: 'מוכר על ידי איגודים מקצועיים להדרכת הורים' },
  { key: 'accreditation.learnMore', en: 'Learn More About Our Programs', he: 'למד עוד על התוכניות שלנו' },

  // FAQ
  { key: 'faq.badge', en: 'FAQ', he: 'שאלות נפוצות' },
  { key: 'faq.title', en: 'Frequently Asked Questions', he: 'שאלות נפוצות' },
  { key: 'faq.subtitle', en: 'Everything you need to know about our programs', he: 'כל מה שצריך לדעת על התוכניות שלנו' },
  { key: 'faq.q1.question', en: 'How long are the programs?', he: 'כמה זמן נמשכות התוכניות?' },
  { key: 'faq.q1.answer', en: 'Program duration varies. Most of our comprehensive parent guidance programs run for 8-12 months, with flexible scheduling to accommodate your needs.', he: 'משך התוכנית משתנה. רוב תוכניות ההדרכה המקיפות שלנו נמשכות 8-12 חודשים, עם לוח זמנים גמיש שמתאים לצרכים שלך.' },
  { key: 'faq.q2.question', en: 'Are the sessions live or recorded?', he: 'השיעורים הם בשידור חי או מוקלטים?' },
  { key: 'faq.q2.answer', en: 'We offer both live online sessions and recorded content. Live sessions allow real-time interaction with instructors, while recordings enable you to learn at your own pace.', he: 'אנו מציעים גם שיעורים מקוונים בשידור חי וגם תוכן מוקלט. שיעורים חיים מאפשרים אינטראקציה בזמן אמת עם המדריכים, בעוד ההקלטות מאפשרות לך ללמוד בקצב שלך.' },
  { key: 'faq.q3.question', en: 'What certification will I receive?', he: 'איזו הסמכה אקבל?' },
  { key: 'faq.q3.answer', en: 'Upon successful completion, you will receive a professional certification recognized by the University of Haifa Clinical Center and professional parent guidance associations.', he: 'עם סיום מוצלח, תקבל הסמכה מקצועית המוכרת על ידי המרכז הקליני של אוניברסיטת חיפה ואיגודים מקצועיים להדרכת הורים.' },
  { key: 'faq.q4.question', en: 'What are the payment options?', he: 'מהן אפשרויות התשלום?' },
  { key: 'faq.q4.answer', en: 'We offer flexible payment plans including one-time payment, deposit with installments, and subscription options. Payment plans can be customized during enrollment.', he: 'אנו מציעים תוכניות תשלום גמישות כולל תשלום חד-פעמי, פיקדון עם תשלומים ואפשרויות מנוי. ניתן להתאים אישית את תוכניות התשלום במהלך ההרשמה.' },
  { key: 'faq.q5.question', en: 'Do I need prior experience?', he: 'האם אני צריך ניסיון קודם?' },
  { key: 'faq.q5.answer', en: 'No prior experience is required for most programs. Our courses are designed for both beginners and those seeking to enhance their existing knowledge in parent guidance.', he: 'אין צורך בניסיון קודם עבור רוב התוכניות. הקורסים שלנו מיועדים הן למתחילים והן לאלה המבקשים להעמיק את הידע הקיים שלהם בהדרכת הורים.' },
  { key: 'faq.q6.question', en: 'Can I access course materials after completion?', he: 'האם אוכל לגשת לחומרי הקורס לאחר הסיום?' },
  { key: 'faq.q6.answer', en: 'Yes! Once enrolled, you maintain lifetime access to all course materials, allowing you to revisit content whenever needed.', he: 'כן! ברגע שנרשמת, תישמר לך גישה לכל החיים לכל חומרי הקורס, מה שמאפשר לך לחזור לתכנים בכל עת שתצטרך.' },
  { key: 'faq.stillHaveQuestions', en: 'Still have questions?', he: 'עדיין יש שאלות?' },
  { key: 'faq.contactUs', en: 'Contact Us', he: 'צור קשר' },

  // Breadcrumbs
  { key: 'breadcrumbs.home', en: 'Home', he: 'בית' },
  { key: 'breadcrumbs.programs', en: 'Programs', he: 'תוכניות' },
  { key: 'breadcrumbs.courses', en: 'Courses', he: 'קורסים' },
];

async function addTranslations() {
  console.log('🌐 Adding browse and enhanced feature translations...\n');

  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('❌ Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const translation of translations) {
    try {
      // Check English
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (existingEn && existingEn.length > 0) {
        skipCount++;
      } else {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: 'user',
          });

        if (enError) throw enError;
        successCount++;
      }

      // Check Hebrew
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (existingHe && existingHe.length > 0) {
        skipCount++;
      } else {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: 'user',
          });

        if (heError) throw heError;
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
    }
  }

  console.log('='.repeat(50));
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
