/**
 * Add legal pages translations (Privacy, Terms, Cookies)
 */

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
  // Footer links
  { key: 'public.footer.legal', en: 'Legal', he: 'משפטי' },
  { key: 'public.footer.terms', en: 'Terms of Use', he: 'תנאי שימוש' },
  { key: 'public.footer.privacy', en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  { key: 'public.footer.cookies', en: 'Cookie Policy', he: 'מדיניות קוקיז' },

  // Privacy Policy Page
  { key: 'legal.privacy.title', en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  { key: 'legal.privacy.subtitle', en: 'Last updated: January 2026', he: 'עדכון אחרון: ינואר 2026' },

  { key: 'legal.privacy.section1.title', en: '1. Information We Collect', he: '1. מידע שאנו אוספים' },
  { key: 'legal.privacy.section1.content', en: 'We collect information that you provide directly to us, including your name, email address, and any other information you choose to provide when you register for an account or enroll in our courses.', he: 'אנו אוספים מידע שאתה מספק לנו ישירות, כולל שמך, כתובת הדוא"ל שלך וכל מידע אחר שתבחר לספק כאשר אתה נרשם לחשבון או נרשם לקורסים שלנו.' },

  { key: 'legal.privacy.section2.title', en: '2. How We Use Your Information', he: '2. כיצד אנו משתמשים במידע שלך' },
  { key: 'legal.privacy.section2.content', en: 'We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you technical notices and support messages, and to communicate with you about products, services, and events.', he: 'אנו משתמשים במידע שאנו אוספים כדי לספק, לתחזק ולשפר את השירותים שלנו, לעבד את העסקאות שלך, לשלוח לך הודעות טכניות והודעות תמיכה, ולתקשר איתך לגבי מוצרים, שירותים ואירועים.' },

  { key: 'legal.privacy.section3.title', en: '3. Information Sharing', he: '3. שיתוף מידע' },
  { key: 'legal.privacy.section3.content', en: 'We do not share your personal information with third parties except as described in this policy. We may share information with service providers who perform services on our behalf, with your consent, or as required by law.', he: 'אנו לא משתפים את המידע האישי שלך עם צדדים שלישיים למעט כמתואר במדיניות זו. אנו עשויים לשתף מידע עם ספקי שירות המבצעים שירותים בשמנו, בהסכמתך, או כנדרש על פי חוק.' },

  { key: 'legal.privacy.section4.title', en: '4. Data Security', he: '4. אבטחת מידע' },
  { key: 'legal.privacy.section4.content', en: 'We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.', he: 'אנו נוקטים באמצעים סבירים כדי לעזור להגן על המידע האישי שלך מפני אובדן, גניבה, שימוש לרעה, גישה לא מורשית, חשיפה, שינוי והשמדה.' },

  { key: 'legal.privacy.section5.title', en: '5. Your Rights', he: '5. הזכויות שלך' },
  { key: 'legal.privacy.section5.content', en: 'You have the right to access, update, or delete your personal information at any time. You may also have the right to object to or restrict certain types of processing of your personal information.', he: 'יש לך את הזכות לגשת, לעדכן או למחוק את המידע האישי שלך בכל עת. ייתכן שיש לך גם את הזכות להתנגד או להגביל סוגים מסוימים של עיבוד המידע האישי שלך.' },

  { key: 'legal.privacy.section6.title', en: '6. Cookies and Tracking', he: '6. קוקיז ומעקב' },
  { key: 'legal.privacy.section6.content', en: 'We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings.', he: 'אנו משתמשים בקוקיז וטכנולוגיות מעקב דומות כדי לאסוף מידע על פעילויות הגלישה שלך. אתה יכול לשלוט בקוכיז דרך הגדרות הדפדפן שלך.' },

  { key: 'legal.privacy.section7.title', en: '7. Changes to This Policy', he: '7. שינויים במדיניות זו' },
  { key: 'legal.privacy.section7.content', en: 'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.', he: 'אנו עשויים לעדכן את מדיניות הפרטיות הזו מעת לעת. נודיע לך על כל שינוי על ידי פרסום המדיניות החדשה בדף זה ועדכון תאריך "עדכון אחרון".' },

  { key: 'legal.privacy.section8.title', en: '8. Contact Us', he: '8. צור קשר' },
  { key: 'legal.privacy.section8.content', en: 'If you have any questions about this privacy policy, please contact us through our support channels.', he: 'אם יש לך שאלות לגבי מדיניות פרטיות זו, אנא צור קשר דרך ערוצי התמיכה שלנו.' },

  // Terms of Use Page
  { key: 'legal.terms.title', en: 'Terms of Use', he: 'תנאי שימוש' },
  { key: 'legal.terms.subtitle', en: 'Last updated: January 2026', he: 'עדכון אחרון: ינואר 2026' },

  { key: 'legal.terms.section1.title', en: '1. Acceptance of Terms', he: '1. קבלת התנאים' },
  { key: 'legal.terms.section1.content', en: 'By accessing and using this platform, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.', he: 'על ידי גישה ושימוש בפלטפורמה זו, אתה מקבל ומסכים להיות כפוף לתנאים והוראות הסכם זה. אם אינך מסכים לתנאים אלה, אנא אל תשתמש בשירותים שלנו.' },

  { key: 'legal.terms.section2.title', en: '2. Use License', he: '2. רישיון שימוש' },
  { key: 'legal.terms.section2.content', en: 'Permission is granted to access and use the platform for personal, non-commercial educational purposes. This license shall automatically terminate if you violate any of these restrictions.', he: 'ניתנת הרשאה לגשת ולהשתמש בפלטפורמה למטרות חינוכיות אישיות ולא מסחריות. רישיון זה יסתיים אוטומטית אם תפר אחת מההגבלות הללו.' },

  { key: 'legal.terms.section3.title', en: '3. User Accounts', he: '3. חשבונות משתמש' },
  { key: 'legal.terms.section3.content', en: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.', he: 'אתה אחראי לשמור על סודיות החשבון והסיסמה שלך. אתה מסכים לקבל אחריות על כל הפעילויות המתרחשות תחת החשבון שלך.' },

  { key: 'legal.terms.section4.title', en: '4. Course Enrollment and Payment', he: '4. הרשמה לקורס ותשלום' },
  { key: 'legal.terms.section4.content', en: 'When you enroll in a course, you agree to pay all fees associated with that course. Refund policies vary by course and will be clearly stated before enrollment.', he: 'כאשר אתה נרשם לקורס, אתה מסכים לשלם את כל העמלות הקשורות לקורס זה. מדיניות ההחזרים משתנה לפי קורס ותצוין בבירור לפני ההרשמה.' },

  { key: 'legal.terms.section5.title', en: '5. Intellectual Property', he: '5. קניין רוחני' },
  { key: 'legal.terms.section5.content', en: 'All course materials, including videos, documents, and other content, are the intellectual property of the platform or its instructors. You may not reproduce, distribute, or create derivative works without permission.', he: 'כל חומרי הקורס, כולל סרטונים, מסמכים ותכנים אחרים, הם קניין רוחני של הפלטפורמה או המדריכים שלה. אינך רשאי לשכפל, להפיץ או ליצור עבודות נגזרות ללא רשות.' },

  { key: 'legal.terms.section6.title', en: '6. User Conduct', he: '6. התנהגות משתמש' },
  { key: 'legal.terms.section6.content', en: 'You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the platform. You will not attempt to gain unauthorized access to any part of the platform.', he: 'אתה מסכים לא להשתמש בפלטפורמה לכל מטרה בלתי חוקית או בכל דרך שעלולה לפגוע, להשבית או לפגוע בפלטפורמה. לא תנסה לקבל גישה בלתי מורשית לכל חלק מהפלטפורמה.' },

  { key: 'legal.terms.section7.title', en: '7. Disclaimers', he: '7. הצהרות כלליות' },
  { key: 'legal.terms.section7.content', en: 'The platform and its content are provided "as is" without warranties of any kind. We do not guarantee that the platform will be error-free or uninterrupted.', he: 'הפלטפורמה והתוכן שלה מסופקים "כמות שהם" ללא אחריות מכל סוג שהוא. איננו מבטיחים שהפלטפורמה תהיה נקייה מטעויות או ללא הפרעות.' },

  { key: 'legal.terms.section8.title', en: '8. Limitation of Liability', he: '8. הגבלת אחריות' },
  { key: 'legal.terms.section8.content', en: 'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.', he: 'לא נהיה אחראים לכל נזק עקיף, מקרי, מיוחד, תוצאתי או עונשי הנובע מהשימוש שלך בפלטפורמה או מחוסר היכולת להשתמש בה.' },

  { key: 'legal.terms.section9.title', en: '9. Changes to Terms', he: '9. שינויים בתנאים' },
  { key: 'legal.terms.section9.content', en: 'We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the platform after changes constitutes acceptance of the new terms.', he: 'אנו שומרים לעצמנו את הזכות לשנות את התנאים הללו בכל עת. נודיע למשתמשים על כל שינוי מהותי. המשך השימוש שלך בפלטפורמה לאחר השינויים מהווה קבלה של התנאים החדשים.' },

  { key: 'legal.terms.section10.title', en: '10. Contact Information', he: '10. פרטי קשר' },
  { key: 'legal.terms.section10.content', en: 'If you have any questions about these terms, please contact us through our support channels.', he: 'אם יש לך שאלות לגבי תנאים אלה, אנא צור קשר דרך ערוצי התמיכה שלנו.' },

  // Cookie Policy Page
  { key: 'legal.cookies.title', en: 'Cookie Policy', he: 'מדיניות קוקיז' },
  { key: 'legal.cookies.subtitle', en: 'Last updated: January 2026', he: 'עדכון אחרון: ינואר 2026' },

  { key: 'legal.cookies.section1.title', en: '1. What Are Cookies', he: '1. מה הם קוקיז' },
  { key: 'legal.cookies.section1.content', en: 'Cookies are small text files that are placed on your device when you visit our platform. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.', he: 'קוקיז הם קבצי טקסט קטנים המוצבים במכשיר שלך כשאתה מבקר בפלטפורמה שלנו. הם עוזרים לנו לספק לך חוויה טובה יותר על ידי זכירת ההעדפות שלך והבנת האופן שבו אתה משתמש בפלטפורמה שלנו.' },

  { key: 'legal.cookies.section2.title', en: '2. How We Use Cookies', he: '2. כיצד אנו משתמשים בקוקיז' },
  { key: 'legal.cookies.section2.content', en: 'We use cookies to authenticate users, remember user preferences, analyze platform usage, and improve our services. Cookies help us understand which features are most popular and how we can improve your experience.', he: 'אנו משתמשים בקוקיז כדי לאמת משתמשים, לזכור העדפות משתמש, לנתח שימוש בפלטפורמה ולשפר את השירותים שלנו. קוקיז עוזרים לנו להבין אילו תכונות הכי פופולריות וכיצד נוכל לשפר את החוויה שלך.' },

  { key: 'legal.cookies.section3.title', en: '3. Types of Cookies We Use', he: '3. סוגי הקוקיז שאנו משתמשים בהם' },

  { key: 'legal.cookies.section3.essential.title', en: 'Essential Cookies', he: 'קוקיז חיוניים' },
  { key: 'legal.cookies.section3.essential.content', en: 'These cookies are necessary for the platform to function properly. They enable core functionality such as security, authentication, and accessibility. The platform cannot function properly without these cookies.', he: 'קוקיז אלה נחוצים כדי שהפלטפורמה תפעל כראוי. הם מאפשרים פונקציונליות ליבה כגון אבטחה, אימות ונגישות. הפלטפורמה לא יכולה לתפקד כראוי ללא קוקיז אלה.' },

  { key: 'legal.cookies.section3.functional.title', en: 'Functional Cookies', he: 'קוקיז פונקציונליים' },
  { key: 'legal.cookies.section3.functional.content', en: 'These cookies enable enhanced functionality and personalization, such as remembering your language preference, theme selection, and other customization options.', he: 'קוקיז אלה מאפשרים פונקציונליות משופרת והתאמה אישית, כגון זכירת העדפת השפה שלך, בחירת נושא ואפשרויות התאמה אישית אחרות.' },

  { key: 'legal.cookies.section3.analytics.title', en: 'Analytics Cookies', he: 'קוקיז אנליטיים' },
  { key: 'legal.cookies.section3.analytics.content', en: 'These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously. This helps us improve our platform and services.', he: 'קוקיז אלה עוזרים לנו להבין כיצד מבקרים מתקשרים עם הפלטפורמה שלנו על ידי איסוף ודיווח מידע באופן אנונימי. זה עוזר לנו לשפר את הפלטפורמה והשירותים שלנו.' },

  { key: 'legal.cookies.section4.title', en: '4. Managing Cookies', he: '4. ניהול קוקיז' },
  { key: 'legal.cookies.section4.content', en: 'Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or to alert you when cookies are being sent. However, if you disable cookies, some features of the platform may not function properly.', he: 'רוב דפדפני האינטרנט מאפשרים לך לשלוט בקוקיז דרך ההגדרות שלהם. אתה יכול להגדיר את הדפדפן שלך לסרב לקוקיז או להתריע כאשר קוקיז נשלחים. עם זאת, אם תשבית קוקיז, ייתכן שחלק מהתכונות של הפלטפורמה לא יפעלו כראוי.' },

  { key: 'legal.cookies.section5.title', en: '5. Third-Party Cookies', he: '5. קוקיז של צד שלישי' },
  { key: 'legal.cookies.section5.content', en: 'We may use third-party services that set their own cookies to provide analytics and other services. These third parties have their own privacy policies and cookie policies.', he: 'אנו עשויים להשתמש בשירותים של צד שלישי שמגדירים קוקיז משלהם כדי לספק אנליטיקס ושירותים אחרים. לצדדים שלישיים אלה יש מדיניות פרטיות ומדיניות קוקיז משלהם.' },

  { key: 'legal.cookies.section6.title', en: '6. Updates to This Policy', he: '6. עדכונים למדיניות זו' },
  { key: 'legal.cookies.section6.content', en: 'We may update this cookie policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.', he: 'אנו עשויים לעדכן את מדיניות הקוקיז הזו מעת לעת. נודיע לך על כל שינוי על ידי פרסום המדיניות החדשה בדף זה ועדכון תאריך "עדכון אחרון".' },

  { key: 'legal.cookies.section7.title', en: '7. Contact Us', he: '7. צור קשר' },
  { key: 'legal.cookies.section7.content', en: 'If you have any questions about our use of cookies, please contact us through our support channels.', he: 'אם יש לך שאלות לגבי השימוש שלנו בקוכיז, אנא צור קשר דרך ערוצי התמיכה שלנו.' },
];

async function addTranslations() {
  console.log('🌐 Adding legal pages translations...\n');

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

  let addedCount = 0;
  let updatedCount = 0;

  for (const translation of translations) {
    const { key, en, he } = translation;

    // Process Hebrew translation
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
      }
    }

    // Process English translation
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
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Legal pages translations added successfully!');
  console.log(`   ➕ Added: ${addedCount}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log('');
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
