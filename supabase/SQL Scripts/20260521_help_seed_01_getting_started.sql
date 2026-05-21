-- Comprehensive help seed — File 1 of 6: Getting Started + Setup.
-- Idempotent: deletes each (slug, locale) before re-inserting so the file
-- can be re-run when content is edited. Designed for a brand-new admin
-- who has never used the platform.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'welcome',
    'first-time-setup',
    'admin-overview',
    'settings-organization',
    'settings-theme',
    'settings-overview'
  );

  -- =============================================================
  -- welcome
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('welcome', 'en', 'Welcome to IPSPlatform',
   'Getting Started', 0,
   ARRAY[]::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
$body$IPSPlatform is an all-in-one platform for online schools: it manages your courses, students, payments, communications, and CRM in one place.

## What you can do here as an admin
- Build courses and bundle them into programs.
- Sell access through products with flexible payment plans.
- Track every enrollment, payment, and refund.
- Grade students with weighted categories and custom scales.
- Send automated emails on enrollment, lesson reminders, payment receipts, etc.
- Connect to Stripe, Keap, Zoom, DocuSign, Brevo, and Twilio.

## How this help works
Click the **(?)** icon in the top header on any page. The drawer will open with help for that specific page. From inside the drawer you can:
- Read the step-by-step guide.
- Follow links to **Related articles**.
- Search all topics via **Browse all topics**.

## Where to start
If this is your first time, open the **First-time setup** article from "Browse all topics" — it walks you through every step from scratch.
$body$),
  ('welcome', 'he', 'ברוכים הבאים ל-IPSPlatform',
   'התחלה', 0,
   ARRAY[]::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
$body$IPSPlatform היא פלטפורמה כוללת לבתי ספר אונליין: ניהול קורסים, סטודנטים, תשלומים, תקשורת ו-CRM במקום אחד.

## מה אפשר לעשות כמנהל
- לבנות קורסים ולחבר אותם לתכניות.
- למכור גישה דרך מוצרים עם תכניות תשלום גמישות.
- לעקוב אחר כל הרשמה, תשלום והחזר.
- לתת ציונים עם קטגוריות משוקללות וסקלות מותאמות.
- לשלוח מיילים אוטומטיים בהרשמה, תזכורות שיעור, קבלות תשלום וכו'.
- להתחבר ל-Stripe, Keap, Zoom, DocuSign, Brevo ו-Twilio.

## כיצד עוזרה זו עובדת
לחץ על אייקון **(?)** בסרגל העליון בכל דף. החלון ייפתח עם עזרה לאותו דף. בתוך החלון אפשר:
- לקרוא את המדריך שלב אחר שלב.
- לעקוב אחר קישורים ל**מאמרים קשורים**.
- לחפש את כל הנושאים דרך **כל הנושאים**.

## איפה להתחיל
אם זו הפעם הראשונה שלך, פתח את המאמר **התקנה ראשונית** מ"כל הנושאים" — הוא ילווה אותך בכל שלב מההתחלה.
$body$);

  -- =============================================================
  -- first-time-setup
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('first-time-setup', 'en', 'First-time Setup Checklist',
   'Getting Started', 1,
   ARRAY[]::text[],
   ARRAY['settings-organization', 'settings-theme', 'integrations-overview', 'users-and-roles', 'lms-create-course', 'payments-products']::text[],
$body$Follow this checklist in order. Each step takes 2-15 minutes. Total first-time setup is usually 1-2 hours.

## Phase 1 — Identity (do first)
1. **Organization info** — Settings → Organization. Set name, address, contact email, country, locale, currency, timezone. This appears on every email, invoice, and PDF receipt.
2. **Branding** — Settings → Theme. Upload logo, set primary color, choose light/dark default.
3. **Languages** — Config → Languages. Enable the languages you need (English and/or Hebrew).

## Phase 2 — Money plumbing
4. **Stripe** — Admin → Integrations → Stripe. Paste your API keys. Without this, you cannot collect payments.
5. **Email** — Admin → Integrations → Email (Brevo/SMTP). Without this, no emails go out — not even password resets.
6. **PDF receipt template** — Admin → Payments → PDF Template. Configure how receipts look.

## Phase 3 — Optional integrations
7. **Keap** — if you use Keap for CRM/marketing automation. Admin → Integrations → Keap.
8. **Zoom** — if you teach live sessions. Admin → Integrations → Zoom.
9. **DocuSign** — if students sign enrollment contracts.
10. **Twilio** — if you send SMS notifications.

## Phase 4 — Team
11. **Invite admins and instructors** — Settings → Users → Invite User. Pick the right role for each person.

## Phase 5 — Your first course
12. **Grading scale** — Admin → Grading → Scales. Create a scale (e.g., A-F) and grade ranges.
13. **Course** — Admin → LMS → Courses → Create Course. Build the module/lesson tree.
14. **Product** — Admin → Payments → Products → Create Product. Wrap the course in a sellable product with a payment plan.
15. **Test the public enrollment** — open the product's public enrollment URL in incognito mode and complete a test enrollment with a Stripe test card.

## When you're done
Your platform is ready. Send the public enrollment URL to your first real student.
$body$),
  ('first-time-setup', 'he', 'רשימת בדיקה להגדרה ראשונית',
   'התחלה', 1,
   ARRAY[]::text[],
   ARRAY['settings-organization', 'settings-theme', 'integrations-overview', 'users-and-roles', 'lms-create-course', 'payments-products']::text[],
$body$עקוב אחר רשימה זו לפי הסדר. כל שלב לוקח 2-15 דקות. סך כל ההגדרה הראשונית בדרך כלל 1-2 שעות.

## שלב 1 — זהות (התחל מכאן)
1. **פרטי הארגון** — הגדרות ← ארגון. הזן שם, כתובת, מייל קשר, מדינה, שפה, מטבע, אזור זמן. זה מופיע בכל מייל, חשבונית וקבלה.
2. **מיתוג** — הגדרות ← ערכת נושא. העלה לוגו, הגדר צבע ראשי, בחר ברירת מחדל בהיר/כהה.
3. **שפות** — קונפיגורציה ← שפות. הפעל את השפות הרלוונטיות (אנגלית ו/או עברית).

## שלב 2 — תשתית כספית
4. **Stripe** — ניהול ← שילובים ← Stripe. הדבק מפתחות API. בלי זה לא ניתן לגבות תשלומים.
5. **מייל** — ניהול ← שילובים ← מייל (Brevo/SMTP). בלי זה לא נשלחים מיילים — אפילו לא איפוס סיסמה.
6. **תבנית קבלת PDF** — ניהול ← תשלומים ← תבנית PDF. הגדר איך הקבלות נראות.

## שלב 3 — שילובים אופציונליים
7. **Keap** — אם אתה משתמש ב-Keap ל-CRM/אוטומציה. ניהול ← שילובים ← Keap.
8. **Zoom** — אם אתה מלמד שיעורים חיים. ניהול ← שילובים ← Zoom.
9. **DocuSign** — אם סטודנטים חותמים על חוזים.
10. **Twilio** — אם אתה שולח התראות SMS.

## שלב 4 — צוות
11. **הזמן מנהלים ומרצים** — הגדרות ← משתמשים ← הזמן משתמש. בחר את התפקיד הנכון לכל אחד.

## שלב 5 — הקורס הראשון שלך
12. **סקלת ציונים** — ניהול ← ציונים ← סקלות. צור סקלה (למשל A-F) וטווחי ציון.
13. **קורס** — ניהול ← מערכת לימוד ← קורסים ← צור קורס. בנה את עץ המודולים/שיעורים.
14. **מוצר** — ניהול ← תשלומים ← מוצרים ← צור מוצר. עטוף את הקורס במוצר שניתן למכור עם תכנית תשלום.
15. **בדוק את ההרשמה הציבורית** — פתח את כתובת ההרשמה הציבורית של המוצר במצב גלישה בסתר והשלם הרשמת בדיקה עם כרטיס Stripe לבדיקה.

## כשסיימת
הפלטפורמה שלך מוכנה. שלח את כתובת ההרשמה הציבורית לסטודנט האמיתי הראשון שלך.
$body$);

  -- =============================================================
  -- admin-overview (rewrite)
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('admin-overview', 'en', 'Admin Panel Tour',
   'Getting Started', 2,
   ARRAY['admin-dashboard']::text[],
   ARRAY['first-time-setup', 'settings-overview', 'users-and-roles']::text[],
$body$The admin panel is organized around what you actually do day-to-day: enroll students, deliver courses, get paid, communicate.

## The top header
- **Logo / Organization name** — click to return to the dashboard.
- **(?)** — opens this help drawer for whichever page you're on.
- **Theme** — toggle light/dark.
- **Language** — switch UI between English and Hebrew. RTL flips automatically in Hebrew.
- **Profile** — your account, billing, sign out.

## The sidebar (everything is grouped by domain)
- **Dashboard** — at-a-glance stats: revenue, recent enrollments, active courses.
- **Enrollments** — every active and past enrollment.
- **Payments** — products, payment plans, transactions, disputes, reports.
- **LMS** — courses, programs, attendance.
- **Grading** — grading scales (tenant-wide settings).
- **Emails** — templates, triggers, queue, analytics.
- **CRM / Keap** — sync state, tag management.
- **Settings** — organization, theme, users, integrations.
- **Config** — languages, translations, navigation editor, feature flags.

## Daily admin routines
- **Morning**: Dashboard → check overnight enrollments and failed payments.
- **Weekly**: Payments → Reports → review revenue trends. Audit Log → spot anything unusual.
- **Per term**: Grading → enter grades in the gradebook. Send progress emails via Email Triggers.

## Tips
- The sidebar is **customizable** — Settings → Navigation lets you reorder, hide, or nest items per tenant.
- Most lists support search and filtering at the top.
- The Save button at the bottom of forms is **always frozen** in place — you don't need to scroll to save.
$body$),
  ('admin-overview', 'he', 'סיור בפאנל הניהול',
   'התחלה', 2,
   ARRAY['admin-dashboard']::text[],
   ARRAY['first-time-setup', 'settings-overview', 'users-and-roles']::text[],
$body$פאנל הניהול מאורגן סביב מה שאתה עושה יום-יום: רישום סטודנטים, העברת קורסים, קבלת תשלום, תקשורת.

## הסרגל העליון
- **לוגו / שם הארגון** — לחיצה מחזירה ללוח הבקרה.
- **(?)** — פותח את חלון העזרה לדף הנוכחי.
- **ערכת נושא** — מצב בהיר/כהה.
- **שפה** — מחליף בין אנגלית לעברית. הממשק עובר ל-RTL בעברית אוטומטית.
- **פרופיל** — חשבון, חיוב, התנתקות.

## סרגל הצד (הכל מאורגן לפי תחום)
- **לוח בקרה** — סקירת נתונים: הכנסה, הרשמות אחרונות, קורסים פעילים.
- **הרשמות** — כל הרשמה פעילה ועברית.
- **תשלומים** — מוצרים, תכניות תשלום, עסקאות, מחלוקות, דוחות.
- **מערכת לימוד** — קורסים, תכניות, נוכחות.
- **ציונים** — סקלות ציונים (הגדרות לכל הארגון).
- **מיילים** — תבניות, טריגרים, תור, אנליטיקה.
- **CRM / Keap** — מצב סנכרון, ניהול תגיות.
- **הגדרות** — ארגון, ערכת נושא, משתמשים, שילובים.
- **קונפיגורציה** — שפות, תרגומים, עורך ניווט, דגלי תכונות.

## שגרות יומיות
- **בוקר**: לוח בקרה ← בדוק הרשמות לילה ותשלומים שנכשלו.
- **שבועי**: תשלומים ← דוחות ← סקור מגמות הכנסה. לוג ביקורת ← אתר חריגות.
- **לפי תקופה**: ציונים ← הזן ציונים בגליון. שלח מיילי התקדמות דרך טריגרי מייל.

## טיפים
- סרגל הצד **ניתן להתאמה** — הגדרות ← ניווט מאפשר לסדר מחדש, להסתיר או לקנן פריטים לכל ארגון.
- רוב הרשימות תומכות בחיפוש וסינון בראש.
- כפתור השמירה בתחתית טפסים **תמיד מוקפא** במקום — אין צורך לגלול לשמור.
$body$);

  -- =============================================================
  -- settings-organization
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('settings-organization', 'en', 'Organization Settings',
   'Settings', 5,
   ARRAY['settings-organization']::text[],
   ARRAY['settings-theme', 'settings-overview', 'first-time-setup']::text[],
$body$Organization settings define your tenant's identity. The values here appear on every customer-facing email, invoice, receipt, and contract.

## When to set this
**As your very first step** after creating your tenant. Most fields are referenced by other features later (e.g., your timezone affects lesson schedules; your currency affects every product price).

## How to fill it in

1. Open **Settings → Organization**.
2. **Basic Information**:
   - **Name** — what students see at the top of every email.
   - **Slug** — the subdomain identifier (read-only after creation).
   - **Contact email** — replies to your transactional emails come here.
3. **Address & Country** — appears on invoices/receipts for tax compliance.
4. **Locale & Timezone** — affects date/time formatting everywhere.
5. **Currency** — the default currency for products. Each product can override.
6. **Logo / Favicon** — uploaded once, used in headers, emails, and PDF receipts.
7. Click **Save Changes**.

## What gets affected
- Every transactional email's header/footer.
- Stripe customer billing address.
- PDF receipts.
- Invoice line items (tax region).
- The public enrollment wizard's "Powered by" footer.

## Common pitfalls
- **Wrong timezone** — lesson reminders fire at the wrong hour. Verify before scheduling your first lesson.
- **Currency mismatch with Stripe** — your Stripe account currency must match (or be convertible to) the platform default currency.
- **Logo too large** — keep under 500KB and at least 200px wide for crisp rendering.
$body$),
  ('settings-organization', 'he', 'הגדרות ארגון',
   'הגדרות', 5,
   ARRAY['settings-organization']::text[],
   ARRAY['settings-theme', 'settings-overview', 'first-time-setup']::text[],
$body$הגדרות הארגון מגדירות את זהות הארגון שלך. הערכים כאן מופיעים בכל מייל, חשבונית, קבלה וחוזה הפונים ללקוח.

## מתי להגדיר זאת
**כצעד הראשון** אחרי יצירת הארגון שלך. רוב השדות משמשים תכונות אחרות בהמשך (למשל אזור הזמן משפיע על לוחות הזמנים של שיעורים; המטבע משפיע על כל מחיר מוצר).

## איך למלא

1. פתח **הגדרות ← ארגון**.
2. **מידע בסיסי**:
   - **שם** — מה שסטודנטים רואים בראש כל מייל.
   - **Slug** — מזהה תת-הדומיין (לקריאה בלבד אחרי יצירה).
   - **מייל קשר** — תגובות למיילים הטרנזקציוניים שלך מגיעות לכאן.
3. **כתובת ומדינה** — מופיע בחשבוניות/קבלות לציות מס.
4. **שפה ואזור זמן** — משפיע על עיצוב תאריך/זמן בכל מקום.
5. **מטבע** — מטבע ברירת המחדל למוצרים. כל מוצר יכול לעקוף.
6. **לוגו / Favicon** — מועלים פעם אחת, משמשים בכותרות, מיילים וקבלות PDF.
7. לחץ **שמור שינויים**.

## מה מושפע
- כותרת/תחתית של כל מייל טרנזקציוני.
- כתובת חיוב של לקוח Stripe.
- קבלות PDF.
- פריטי שורה בחשבונית (אזור מס).
- כיתוב "מופעל על ידי" באשף ההרשמה הציבורי.

## טעויות נפוצות
- **אזור זמן שגוי** — תזכורות שיעור מופעלות בשעה הלא נכונה. ודא לפני תזמון השיעור הראשון.
- **חוסר התאמה במטבע עם Stripe** — מטבע חשבון Stripe שלך חייב להתאים (או להיות ניתן להמרה) למטבע ברירת המחדל של הפלטפורמה.
- **לוגו גדול מדי** — שמור מתחת ל-500KB ולפחות 200px רוחב לרינדור חד.
$body$);

  -- =============================================================
  -- settings-theme
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('settings-theme', 'en', 'Theme & Branding',
   'Settings', 6,
   ARRAY['settings-theme']::text[],
   ARRAY['settings-organization', 'settings-overview']::text[],
$body$Theme settings control the visual look of your platform — colors, fonts, dark/light mode preferences. Changes apply to both the admin panel and the student-facing experience.

## How to brand the platform

1. Open **Settings → Theme**.
2. **Primary color** — the main brand color. Used for buttons, links, badges, and highlights.
3. **Accent color** — secondary highlight (e.g., for promotional buttons).
4. **Font family** — pick from available system + Google fonts. Hebrew uses a separate font option.
5. **Default mode** — light or dark for new visitors. Each user can override individually.
6. **Border radius** — corners. Square (0px), soft (8px), or rounded (16px).
7. Click **Save**.

## Live preview
Changes are visible immediately on the next page load. You don't need to log out.

## What inherits the theme
- Admin panel chrome (sidebar, headers, buttons).
- Public enrollment wizard.
- Student dashboard.
- Email templates (primary color is injected into HTML email templates as the brand color).
- PDF receipts (logo + primary color in header).

## Tips
- Pick a primary color that has enough contrast against white AND dark backgrounds (the same color is used in both modes).
- The favicon is set under Settings → Organization, not here.
- For full theme overhauls (custom CSS), contact platform support — only color/font are customizable in-app.
$body$),
  ('settings-theme', 'he', 'ערכת נושא ומיתוג',
   'הגדרות', 6,
   ARRAY['settings-theme']::text[],
   ARRAY['settings-organization', 'settings-overview']::text[],
$body$הגדרות ערכת הנושא שולטות במראה הוויזואלי של הפלטפורמה — צבעים, גופנים, העדפות מצב בהיר/כהה. השינויים חלים על פאנל הניהול ועל חוויית הסטודנט.

## איך למתג את הפלטפורמה

1. פתח **הגדרות ← ערכת נושא**.
2. **צבע ראשי** — צבע המותג העיקרי. משמש לכפתורים, קישורים, תגיות והדגשות.
3. **צבע משני** — הדגשה משנית (למשל לכפתורי קידום).
4. **משפחת גופנים** — בחר מגופני מערכת + Google Fonts. עברית משתמשת באפשרות גופן נפרדת.
5. **מצב ברירת מחדל** — בהיר או כהה למבקרים חדשים. כל משתמש יכול לעקוף בנפרד.
6. **רדיוס פינה** — פינות. ריבועי (0px), רך (8px) או מעוגל (16px).
7. לחץ **שמור**.

## תצוגה מקדימה חיה
שינויים נראים מיידית בטעינת הדף הבא. אין צורך להתנתק.

## מה יורש את ערכת הנושא
- מסגרת פאנל הניהול (סרגל צד, כותרות, כפתורים).
- אשף ההרשמה הציבורי.
- לוח הבקרה של הסטודנט.
- תבניות מייל (הצבע הראשי מוזרק לתבניות HTML של מיילים כצבע המותג).
- קבלות PDF (לוגו + צבע ראשי בכותרת).

## טיפים
- בחר צבע ראשי שיש לו ניגודיות מספקת מול לבן וגם רקע כהה (אותו צבע משמש בשני המצבים).
- ה-favicon מוגדר תחת הגדרות ← ארגון, לא כאן.
- לשיפוצי ערכת נושא מלאים (CSS מותאם), צור קשר עם תמיכת הפלטפורמה — רק צבע/גופן ניתנים להתאמה באפליקציה.
$body$);

  -- =============================================================
  -- settings-overview
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('settings-overview', 'en', 'Platform Settings',
   'Settings', 7,
   ARRAY['settings-overview', 'settings-organization', 'settings-theme']::text[],
   ARRAY['users-and-roles', 'admin-overview', 'integrations-overview', 'config-navigation']::text[],
$body$All platform configuration is split between three top-level sections: **Settings**, **Config**, and **Integrations**.

## Settings (the basics)
- **Organization** — name, address, currency, timezone, logo. Set first.
- **Theme** — colors, fonts, light/dark default.
- **Users** — invite team members, manage roles.
- **Integrations** — connect Stripe, Keap, Zoom, etc.

## Config (advanced platform behavior)
- **Languages** — enable which UI languages students and admins can pick.
- **Translations** — override any individual translation key (e.g., rename "Course" to "Class" everywhere).
- **Navigation** — reorder the admin sidebar, hide unused sections, group items.
- **Features** — feature flags (turn experimental features on/off per tenant).
- **Platform Settings** — currency display preferences, default behaviors.

## How changes propagate
- Most changes apply immediately on the next page load.
- Theme color: requires hard refresh (Ctrl+Shift+R) in some browsers.
- Translation overrides: cached for 60 seconds — wait up to a minute to see edits.

## Tips for new admins
- Don't touch **Config → Features** unless you know what a flag does.
- Always edit **Config → Translations** with caution — typos in translation values show up everywhere.
- **Settings → Navigation** is the safest place to start customizing — it's purely cosmetic and reversible.
$body$),
  ('settings-overview', 'he', 'הגדרות פלטפורמה',
   'הגדרות', 7,
   ARRAY['settings-overview', 'settings-organization', 'settings-theme']::text[],
   ARRAY['users-and-roles', 'admin-overview', 'integrations-overview', 'config-navigation']::text[],
$body$כל קונפיגורציית הפלטפורמה מחולקת בין שלושה סעיפים: **הגדרות**, **קונפיגורציה** ו**שילובים**.

## הגדרות (הבסיס)
- **ארגון** — שם, כתובת, מטבע, אזור זמן, לוגו. הגדר ראשון.
- **ערכת נושא** — צבעים, גופנים, ברירת מחדל בהיר/כהה.
- **משתמשים** — הזמן חברי צוות, נהל תפקידים.
- **שילובים** — חבר את Stripe, Keap, Zoom וכו'.

## קונפיגורציה (התנהגות פלטפורמה מתקדמת)
- **שפות** — הפעל אילו שפות ממשק סטודנטים ומנהלים יכולים לבחור.
- **תרגומים** — עקוף כל מפתח תרגום בודד (למשל שינוי "קורס" ל"כיתה" בכל מקום).
- **ניווט** — סדר מחדש את סרגל הצד של הניהול, הסתר סעיפים לא בשימוש, קבץ פריטים.
- **תכונות** — דגלי תכונות (הפעל/כבה תכונות ניסיוניות לכל ארגון).
- **הגדרות פלטפורמה** — העדפות תצוגת מטבע, התנהגויות ברירת מחדל.

## איך שינויים מתפשטים
- רוב השינויים חלים מיידית בטעינת הדף הבא.
- צבע ערכת נושא: דורש רענון קשה (Ctrl+Shift+R) בחלק מהדפדפנים.
- עקיפות תרגום: נשמרות במטמון 60 שניות — חכה עד דקה לראות עריכות.

## טיפים למנהלים חדשים
- אל תיגע ב**קונפיגורציה ← תכונות** אלא אם אתה יודע מה עושה דגל.
- ערוך תמיד **קונפיגורציה ← תרגומים** בזהירות — שגיאות הקלדה בערכי תרגום מופיעות בכל מקום.
- **הגדרות ← ניווט** הוא המקום הבטוח ביותר להתחיל להתאים — זה קוסמטי בלבד וניתן להפיכה.
$body$);

  RAISE NOTICE 'Help articles seed (file 1/6): Getting Started + Setup — 6 articles × 2 locales = 12 rows.';
END $$;
