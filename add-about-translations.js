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
  // Page Title
  {
    key: 'about.title',
    en: 'About the International Parenting School',
    he: 'אודות בית הספר הבינלאומי להורות'
  },

  // Main Introduction
  {
    key: 'about.intro',
    en: 'The International Parenting School is an online institution specializing in parenting, family relationships, and training professionals to work with parents and families. The school operates in Israel and worldwide, offering professional, knowledge-based solutions to two complementary audiences: parents seeking guidance and support in their parenting journey, and professionals interested in training, enrichment, and professional development in the field of parenting.',
    he: 'בית הספר הבינלאומי להורות הוא בית ספר מקוון המתמחה בהורות, ביחסים במשפחה ובהכשרת אנשי מקצוע לעבודה עם הורים ומשפחות. בית הספר פועל בישראל וברחבי העולם ומציע מענה מקצועי, מבוסס ידע וניסיון, לשתי אוכלוסיות משלימות: הורים המבקשים ליווי והכוונה בתהליך ההורי, ואנשי מקצוע המעוניינים בהכשרה, העמקה ופיתוח מקצועי בתחום ההורות.'
  },

  // Parent Support Section
  {
    key: 'about.parents.title',
    en: 'Guidance and Support for Parents',
    he: 'ליווי והדרכה להורים'
  },
  {
    key: 'about.parents.content',
    en: 'The school accompanies parents in dealing with the challenges of modern parenting, while strengthening balanced family functioning, mutual communication, and cooperation between parents and their children. The parent programs are based on the principles of Adlerian psychology according to Alfred Adler, and are built from the real needs of families for professional, focused, and applicable guidance that enables practical and sustainable change in daily life. Learning combines theoretical knowledge, practical tools, practice, ongoing monitoring, and feedback - until achieving real results.',
    he: 'בית הספר מלווה הורים בהתמודדות עם אתגרי ההורות המודרנית, תוך חיזוק התנהלות משפחתית מאוזנת, תקשורת הדדית ושיתוף פעולה בין הורים לילדיהם. התוכניות להורים מבוססות על עקרונות הפסיכולוגיה האדלריאנית על פי אלפרד אדלר, ונבנו מתוך צורך אמיתי של משפחות בהדרכה מקצועית, ממוקדת ויישומית, המאפשרת שינוי מעשי ובר־קיימא בחיי היומיום. הלמידה משלבת ידע תיאורטי, כלים פרקטיים, תרגול, מעקב ופידבק שוטף – עד להשגת תוצאות ממשיות.'
  },

  // Professional Training Section
  {
    key: 'about.professionals.title',
    en: 'Training and Professional Development for Professionals',
    he: 'הכשרה ופיתוח מקצועי לאנשי מקצוע'
  },
  {
    key: 'about.professionals.content',
    en: 'Concurrently, the school operates training and enrichment programs for professionals working with parents and families - therapists, counselors, educators, and other therapeutic roles. These programs are based on deep theoretical knowledge, practical experience, and a high standard of training, while relying on the psychological approach of Alfred Adler. The training process includes development of professional skills, expansion of the toolkit, professional guidance, and implementation in fieldwork.',
    he: 'במקביל, בית הספר מפעיל תוכניות הכשרה והעמקה לאנשי מקצוע העובדים עם הורים ומשפחות – מטפלים, יועצים, אנשי חינוך ובעלי תפקידים טיפוליים נוספים. תוכניות אלו מבוססות על ידע תיאורטי מעמיק, ניסיון יישומי וסטנדרט הכשרה גבוה, תוך התבססות על הגישה הפסיכולוגית של אלפרד אדלר. תהליך ההכשרה כולל פיתוח מיומנויות מקצועיות, הרחבת ארגז הכלים, ליווי מקצועי ויישום בעבודה בשטח.'
  },

  // Academic Collaboration Section
  {
    key: 'about.collaboration.title',
    en: 'Academic Collaboration with the University of Haifa',
    he: 'שיתוף פעולה אקדמי עם אוניברסיטת חיפה'
  },
  {
    key: 'about.collaboration.content',
    en: 'The parent educator training programs of the International Parenting School operate within the Continuing Education Unit of the University of Haifa, in full academic collaboration. Program graduates are entitled to a Parent Educator Certificate in the Alfred Adler approach, awarded jointly by the University of Haifa and the International Parenting School. This collaboration ensures a high academic standard, professional recognition, and practical training adapted to field needs and practical work with parents and families.',
    he: 'תוכניות ההכשרה להכשרת מנחי הורים של בית הספר הבינלאומי להורות פועלות במסגרת היחידה ללימודי המשך של אוניברסיטת חיפה, ובשיתוף פעולה אקדמי מלא. בוגרי התוכניות זכאים לתעודת מנחה הורים בגישת אלפרד אדלר, המוענקת במשותף על ידי אוניברסיטת חיפה ובית הספר הבינלאומי להורות. שיתוף פעולה זה מבטיח סטנדרט אקדמי גבוה, הכרה מקצועית והכשרה יישומית המותאמת לצורכי השטח והעבודה המעשית עם הורים ומשפחות.'
  },

  // Vision Section
  {
    key: 'about.vision.title',
    en: 'Our Vision',
    he: 'החזון שלנו'
  },
  {
    key: 'about.vision.content',
    en: 'The vision of the International Parenting School is to promote beneficial parenting and strengthen the quality of training and professional work with parents and families, through a combination of theoretical knowledge, practical application, and human values, according to the conception of Alfred Adler, and from a commitment to excellence and long-term impact.',
    he: 'החזון של בית הספר הבינלאומי להורות הוא לקדם הורות מיטיבה ולחזק את איכות ההכשרה והעבודה המקצועית עם הורים ומשפחות, באמצעות שילוב בין ידע תיאורטי, יישום מעשי וערכים אנושיים, על פי תפיסתו של אלפרד אדלר, ומתוך מחויבות למצוינות ולהשפעה ארוכת טווח.'
  },
];

async function addTranslations() {
  console.log('🌐 Adding About page translations...\n');

  // Get tenant ID
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
  let errorCount = 0;

  for (const translation of translations) {
    try {
      // Check if English translation exists
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (existingEn && existingEn.length > 0) {
        console.log(`- Skipped EN (exists): ${translation.key}`);
      } else {
        // Insert English
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
        console.log(`✓ Added EN: ${translation.key}`);
        successCount++;
      }

      // Check if Hebrew translation exists
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (existingHe && existingHe.length > 0) {
        console.log(`- Skipped HE (exists): ${translation.key}`);
      } else {
        // Insert Hebrew
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
        console.log(`✓ Added HE: ${translation.key}`);
        successCount++;
      }

      console.log('');
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Translation import completed!`);
  console.log(`Total translations processed: ${translations.length}`);
  console.log(`Successfully added: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
