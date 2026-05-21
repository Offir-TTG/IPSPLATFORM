-- Comprehensive help seed — File 6 of 6: Enrollments, Communication, Config, CRM.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'enrollments-overview',
    'enrollment-create-manual',
    'emails-overview',
    'emails-templates',
    'emails-triggers',
    'emails-queue',
    'notifications',
    'config-navigation',
    'config-translations',
    'crm-tags'
  );

  -- =============================================================
  -- enrollments-overview
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('enrollments-overview', 'en', 'Managing Enrollments',
   'Enrollments', 60,
   ARRAY['enrollments']::text[],
   ARRAY['enrollment-create-manual', 'payments-products', 'payments-plans']::text[],
$body$Enrollments connect a student to a product (a course, program, or lecture) along with a payment plan. This is the central record that drives billing, course access, and reporting.

## Two ways an enrollment is created

1. **Public enrollment wizard** — student self-enrolls from a marketing CTA. Fills info, pays via Stripe, account auto-created.
2. **Manual admin enrollment** — admin creates on behalf of a student (e.g., they paid by check). See "Create Manual Enrollment" article.

## What an enrollment carries

- **Product** — what they're enrolling in.
- **Payment plan** — full payment, deposit + installments, or subscription.
- **Status** — Pending / Active / Paused / Completed / Cancelled / Past Due.
- **Linked user** — the `users` row tied to the enrollment.
- **Stripe data** — customer ID, payment method, schedule, subscription ID if applicable.

## Status meanings

- **Pending** — created but payment not yet captured.
- **Active** — paid (or on schedule), course access granted.
- **Paused** — payment temporarily paused (manual intervention).
- **Past Due** — installment failed; retry sequence running.
- **Completed** — course ended; access may or may not remain (configurable).
- **Cancelled** — admin or customer cancelled; access revoked.

## Operations on an enrollment

Click any enrollment row → opens the detail page:

- **Edit** — change details (carefully; some fields drive Stripe sync).
- **Send Contract** — DocuSign-powered enrollment agreement.
- **Refund** — issue a refund (also see Transactions).
- **Cancel** — stop future payments; optionally revoke course access.
- **Re-send Welcome Email** — useful if the original landed in spam.
- **View Payment Schedule** — see upcoming installments.
- **View Audit Trail** — every change made to this enrollment.

## Filtering and search

The list has filters at the top:
- **Status** dropdown.
- **Product** dropdown.
- **Date range**.
- **Search** by user name, email, or product.

Export the filtered set to CSV via the **Export** button (top right).
$body$),
  ('enrollments-overview', 'he', 'ניהול הרשמות',
   'הרשמות', 60,
   ARRAY['enrollments']::text[],
   ARRAY['enrollment-create-manual', 'payments-products', 'payments-plans']::text[],
$body$הרשמות מקשרות סטודנט למוצר (קורס, תכנית או הרצאה) יחד עם תכנית תשלום. זוהי הרשומה המרכזית שמניעה חיוב, גישה לקורס ודיווח.

## שתי דרכים שהרשמה נוצרת

1. **אשף הרשמה ציבורי** — סטודנט נרשם בעצמו מקישור שיווקי. ממלא פרטים, משלם דרך Stripe, חשבון נוצר אוטומטית.
2. **הרשמה ידנית על ידי מנהל** — מנהל יוצר עבור סטודנט (למשל הוא שילם בצ'ק). ראה מאמר "צור הרשמה ידנית".

## מה כוללת הרשמה

- **מוצר** — למה הוא נרשם.
- **תכנית תשלום** — תשלום מלא, מקדמה + תשלומים, או מנוי.
- **סטטוס** — ממתין / פעיל / מושהה / הושלם / בוטל / באיחור.
- **משתמש מקושר** — שורת `users` המקושרת להרשמה.
- **נתוני Stripe** — מזהה לקוח, אמצעי תשלום, לוח זמנים, מזהה מנוי אם רלוונטי.

## משמעות סטטוסים

- **ממתין** — נוצר אך תשלום עדיין לא נקלט.
- **פעיל** — שולם (או בלוח זמנים), גישה לקורס ניתנה.
- **מושהה** — תשלום הושהה זמנית (התערבות ידנית).
- **באיחור** — תשלום נכשל; רצף ניסיונות חוזרים פועל.
- **הושלם** — הקורס הסתיים; הגישה עשויה להישאר או לא (ניתן להגדרה).
- **בוטל** — מנהל או לקוח ביטלו; הגישה נשללה.

## פעולות על הרשמה

לחץ על כל שורת הרשמה ← פותח את דף הפרטים:

- **ערוך** — שנה פרטים (בזהירות; חלק מהשדות מניעים סנכרון Stripe).
- **שלח חוזה** — הסכם הרשמה מבוסס DocuSign.
- **החזר** — בצע החזר (ראה גם עסקאות).
- **בטל** — עצור תשלומים עתידיים; אופציונלית שלול גישה לקורס.
- **שלח שוב מייל ברוכים הבאים** — שימושי אם המקורי נחת בספאם.
- **צפה בלוח תשלומים** — ראה תשלומים עתידיים.
- **צפה במסלול ביקורת** — כל שינוי שנעשה בהרשמה זו.

## סינון וחיפוש

לרשימה יש סננים בראש:
- תפריט נפתח **סטטוס**.
- תפריט נפתח **מוצר**.
- **טווח תאריכים**.
- **חיפוש** לפי שם משתמש, מייל או מוצר.

ייצא את הסט המסונן ל-CSV דרך כפתור **ייצא** (פינה ימנית עליונה).
$body$);

  -- =============================================================
  -- enrollment-create-manual
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('enrollment-create-manual', 'en', 'Create Manual Enrollment',
   'Enrollments', 61,
   ARRAY['create-manual-enrollment']::text[],
   ARRAY['enrollments-overview', 'payments-products', 'payments-plans']::text[],
$body$Manual enrollment is for when a student pays outside the platform (cash, check, bank transfer) or when you want to grant access without payment (scholarships, comped seats).

## When to use this

- A student paid you by check.
- A staff or VIP gets a free seat.
- Migration from another platform — you're recreating historical enrollments.
- Testing — you want to enroll yourself as a fake student to QA the experience.

## Step by step

1. Go to **Admin → Enrollments**.
2. Click **Create Enrollment** (top right).
3. **Step 1 — Student details**:
   - Pick an existing user OR
   - Create a new user (email, first/last name).
4. **Step 2 — Pick product and plan**:
   - Product dropdown — pick which one.
   - Plan dropdown — pick which payment plan.
5. **Step 3 — Payment handling**:
   - **Mark as Paid** — no payment captured; you note "paid externally". Use for cash/check/comp.
   - **Charge via Stripe** — uses a saved payment method or asks the student to add one.
   - **Send payment link** — emails the student a checkout link; they pay themselves.
6. **Step 4 — Review and confirm**:
   - Verify everything looks right.
   - Toggle "Send welcome email" if you want them to know about it.
7. Click **Create Enrollment**.

## After creation

- The user is granted course access immediately.
- An audit entry is logged with the admin who created it + payment notes.
- The customer is emailed (if you toggled it) with their login credentials and a link to the course.

> [!WARNING]
> If you marked it as paid externally but the student didn't actually pay, you'll need to reconcile manually (refund them when they DO pay, or remember to log the payment elsewhere). The platform trusts your "marked as paid" decision.

## Common pitfalls

- **Duplicate users** — the form checks email; if it matches an existing user, it'll link to them. Don't create a second user with the same email.
- **Wrong product** — the enrollment locks the product on creation. To "change product," cancel and re-create.
$body$),
  ('enrollment-create-manual', 'he', 'צור הרשמה ידנית',
   'הרשמות', 61,
   ARRAY['create-manual-enrollment']::text[],
   ARRAY['enrollments-overview', 'payments-products', 'payments-plans']::text[],
$body$הרשמה ידנית היא למקרים שבהם סטודנט משלם מחוץ לפלטפורמה (מזומן, צ'ק, העברה בנקאית) או כשאתה רוצה להעניק גישה ללא תשלום (מלגות, מקומות מתנה).

## מתי להשתמש בזה

- סטודנט שילם לך בצ'ק.
- חבר צוות או VIP מקבל מקום בחינם.
- הגירה מפלטפורמה אחרת — אתה משחזר הרשמות היסטוריות.
- בדיקה — אתה רוצה לרשום את עצמך כסטודנט מזויף כדי לבדוק את החוויה.

## שלב אחר שלב

1. עבור ל**ניהול ← הרשמות**.
2. לחץ **צור הרשמה** (פינה ימנית עליונה).
3. **שלב 1 — פרטי סטודנט**:
   - בחר משתמש קיים או
   - צור משתמש חדש (מייל, שם פרטי/משפחה).
4. **שלב 2 — בחר מוצר ותכנית**:
   - תפריט מוצר — בחר איזה.
   - תפריט תכנית — בחר איזו תכנית תשלום.
5. **שלב 3 — טיפול בתשלום**:
   - **סמן כשולם** — לא נקלט תשלום; אתה רושם "שולם חיצונית". השתמש למזומן/צ'ק/מתנה.
   - **חייב דרך Stripe** — משתמש באמצעי תשלום שמור או מבקש מהסטודנט להוסיף אחד.
   - **שלח קישור תשלום** — שולח לסטודנט קישור קופה במייל; הוא משלם בעצמו.
6. **שלב 4 — סקירה ואישור**:
   - ודא שהכל נראה נכון.
   - הפעל "שלח מייל ברוכים הבאים" אם אתה רוצה שהוא ידע.
7. לחץ **צור הרשמה**.

## אחרי היצירה

- המשתמש מקבל גישה לקורס מיידית.
- ערך ביקורת נרשם עם המנהל שיצר + הערות תשלום.
- הלקוח מקבל מייל (אם הפעלת) עם אישורי הכניסה שלו וקישור לקורס.

> [!WARNING]
> אם סימנת ששולם חיצונית אבל הסטודנט לא באמת שילם, תצטרך ליישב ידנית (החזר לו כשהוא ישלם, או זכור לרשום את התשלום במקום אחר). הפלטפורמה סומכת על החלטת "סמן כשולם" שלך.

## טעויות נפוצות

- **משתמשים כפולים** — הטופס בודק מייל; אם הוא תואם משתמש קיים, יקושר אליו. אל תיצור משתמש שני עם אותו מייל.
- **מוצר שגוי** — ההרשמה נועלת את המוצר ביצירה. כדי "לשנות מוצר", בטל וצור מחדש.
$body$);

  -- =============================================================
  -- emails-overview
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('emails-overview', 'en', 'Email System Overview',
   'Communication', 70,
   ARRAY['emails-page']::text[],
   ARRAY['emails-templates', 'emails-triggers', 'emails-queue', 'integrations-overview']::text[],
$body$Every email the platform sends — welcome messages, password resets, payment receipts, lesson reminders — flows through the same pipeline.

## The pipeline

```
Event happens (enrollment, payment, etc.)
  └─ Trigger matches → fires
        └─ Template rendered with variables
              └─ Email queued
                    └─ Cron processes queue every 2 minutes
                          └─ SMTP/Brevo sends
                                └─ Result tracked in analytics
```

## Where to manage each layer

- **Admin → Emails → Templates** — the HTML/text of each email type.
- **Admin → Emails → Triggers** — when each template fires (e.g., "send Welcome 5 minutes after enrollment").
- **Admin → Emails → Queue** — what's waiting to be sent + recent send history.
- **Admin → Emails → Analytics** — open rates, click rates, bounces.
- **Admin → Emails → Settings** — sender name, reply-to address.

## Required for emails to send

- Email integration connected (Brevo or SMTP — see Integrations → Email).
- Sender domain verified in your email provider (otherwise emails go to spam).
- Cron `/api/cron/process-email-queue` running (every 2 min on Vercel).

## Variables available in templates

Every template can use variables like `{{user.first_name}}`, `{{product.name}}`, `{{enrollment.payment_plan_name}}`. The available variables depend on the template type — the editor shows them as you type.

## Multi-language emails

Each template has an English version and a Hebrew version. The platform picks the language based on the recipient's locale preference (or falls back to the tenant default).
$body$),
  ('emails-overview', 'he', 'סקירת מערכת המיילים',
   'תקשורת', 70,
   ARRAY['emails-page']::text[],
   ARRAY['emails-templates', 'emails-triggers', 'emails-queue', 'integrations-overview']::text[],
$body$כל מייל שהפלטפורמה שולחת — הודעות ברוכים הבאים, איפוסי סיסמה, קבלות תשלום, תזכורות שיעור — זורם דרך אותו צינור.

## הצינור

```
אירוע קורה (הרשמה, תשלום וכו')
  └─ טריגר מתאים ← מופעל
        └─ תבנית מרונדרת עם משתנים
              └─ מייל נכנס לתור
                    └─ Cron מעבד תור כל 2 דקות
                          └─ SMTP/Brevo שולח
                                └─ תוצאה נמדדת באנליטיקה
```

## איפה לנהל כל שכבה

- **ניהול ← מיילים ← תבניות** — ה-HTML/טקסט של כל סוג מייל.
- **ניהול ← מיילים ← טריגרים** — מתי כל תבנית מופעלת (למשל "שלח ברוכים הבאים 5 דקות אחרי הרשמה").
- **ניהול ← מיילים ← תור** — מה ממתין לשליחה + היסטוריית שליחה אחרונה.
- **ניהול ← מיילים ← אנליטיקה** — שיעורי פתיחה, שיעורי לחיצה, החזרות.
- **ניהול ← מיילים ← הגדרות** — שם שולח, כתובת מענה.

## נדרש לשליחת מיילים

- שילוב מייל מחובר (Brevo או SMTP — ראה שילובים ← מייל).
- דומיין שולח מאומת בספק המייל שלך (אחרת מיילים מגיעים לספאם).
- Cron `/api/cron/process-email-queue` פועל (כל 2 דקות ב-Vercel).

## משתנים זמינים בתבניות

כל תבנית יכולה להשתמש במשתנים כמו `{{user.first_name}}`, `{{product.name}}`, `{{enrollment.payment_plan_name}}`. המשתנים הזמינים תלויים בסוג התבנית — העורך מציג אותם תוך כדי הקלדה.

## מיילים רב-לשוניים

לכל תבנית יש גרסה אנגלית וגרסה עברית. הפלטפורמה בוחרת את השפה לפי העדפת הלוקאל של הנמען (או חוזרת לברירת המחדל של הארגון).
$body$);

  -- =============================================================
  -- emails-templates
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('emails-templates', 'en', 'Edit Email Templates',
   'Communication', 71,
   ARRAY['emails-templates']::text[],
   ARRAY['emails-overview', 'emails-triggers']::text[],
$body$Templates define the content of every email. The platform ships with templates for every standard event (welcome, receipt, lesson reminder, etc.). You can edit any of them.

## Editing a template

1. Go to **Admin → Emails → Templates**.
2. Click the template you want to edit (e.g., "Welcome Email").
3. The editor shows:
   - **Subject line** — supports variables.
   - **HTML body** — rich editor with formatting + variable insertion.
   - **Plain text body** — fallback for clients that don't render HTML (usually auto-generated from HTML; manually edit for fine control).
   - **From name** (optional override of tenant default).
4. Click variables in the right sidebar to insert them at the cursor position.
5. Click **Preview** — opens a popup with rendered sample data.
6. Click **Save**.

## Variable syntax

Variables are wrapped in `{{double_braces}}`. Example: `Hello {{user.first_name}}, your enrollment in {{product.name}} is confirmed.`

If a variable is missing data at send time, it renders as empty (not as `{{user.first_name}}`).

## Category

Each template has a category — Transactional, Marketing, Notification, etc. The category controls:
- Which `unsubscribe` link is shown.
- Whether unsubscribed users get this template (Marketing skips them; Transactional always sends).

## Multi-language

Each template has two language versions in tabs. Edit both. The platform picks based on recipient language.

## Reverting to default

Click **Reset to Default** to discard your edits and restore the platform's built-in template. Useful if you made a mess.

> [!TIP]
> Always send a test email to yourself (Send Test button) after editing. Variables render and bugs surface — much cheaper than catching them in customer inboxes.
$body$),
  ('emails-templates', 'he', 'ערוך תבניות מייל',
   'תקשורת', 71,
   ARRAY['emails-templates']::text[],
   ARRAY['emails-overview', 'emails-triggers']::text[],
$body$תבניות מגדירות את התוכן של כל מייל. הפלטפורמה מגיעה עם תבניות לכל אירוע סטנדרטי (ברוכים הבאים, קבלה, תזכורת שיעור וכו'). אתה יכול לערוך כל אחת מהן.

## עריכת תבנית

1. עבור ל**ניהול ← מיילים ← תבניות**.
2. לחץ על התבנית שאתה רוצה לערוך (למשל "מייל ברוכים הבאים").
3. העורך מציג:
   - **שורת נושא** — תומכת במשתנים.
   - **גוף HTML** — עורך עשיר עם עיצוב + הכנסת משתנים.
   - **גוף טקסט רגיל** — חלופה ללקוחות שלא מרנדרים HTML (בדרך כלל נוצר אוטומטית מ-HTML; ערוך ידנית לשליטה מדויקת).
   - **שם שולח** (עקיפה אופציונלית של ברירת המחדל של הארגון).
4. לחץ על משתנים בסרגל הצד הימני להכניס אותם בנקודת הסמן.
5. לחץ **תצוגה מקדימה** — פותח חלון עם נתונים מדומים מרונדרים.
6. לחץ **שמור**.

## תחביר משתנים

משתנים עטופים ב-`{{סוגריים כפולים}}`. דוגמה: `שלום {{user.first_name}}, ההרשמה שלך ל-{{product.name}} אושרה.`

אם משתנה חסר נתונים בזמן שליחה, הוא מרונדר כריק (לא כ-`{{user.first_name}}`).

## קטגוריה

לכל תבנית יש קטגוריה — טרנזקציוני, שיווקי, התראה וכו'. הקטגוריה שולטת ב:
- איזה קישור `unsubscribe` מוצג.
- האם משתמשים שביטלו מנוי מקבלים את התבנית הזו (שיווקי מדלג עליהם; טרנזקציוני תמיד שולח).

## רב-לשוני

לכל תבנית יש שתי גרסאות שפה בלשוניות. ערוך את שתיהן. הפלטפורמה בוחרת לפי שפת הנמען.

## חזרה לברירת מחדל

לחץ **אפס לברירת מחדל** כדי לזרוק את העריכות שלך ולשחזר את התבנית המובנית של הפלטפורמה. שימושי אם עשית בלגן.

> [!TIP]
> תמיד שלח מייל בדיקה לעצמך (כפתור שלח בדיקה) אחרי עריכה. משתנים מרונדרים ובאגים מתגלים — הרבה יותר זול מאשר לתפוס אותם בתיבות הדואר של הלקוחות.
$body$);

  -- =============================================================
  -- emails-triggers
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('emails-triggers', 'en', 'Email Triggers',
   'Communication', 72,
   ARRAY['emails-triggers']::text[],
   ARRAY['emails-overview', 'emails-templates']::text[],
$body$Triggers define WHEN each email template fires. The platform ships with defaults for every event; customize timing if you need different cadence.

## Common triggers (built in)

- **Enrollment Complete** — sends Welcome immediately.
- **Payment Successful** — sends Receipt immediately.
- **Payment Failed** — sends Retry Notice immediately.
- **Lesson Scheduled** — sends Reminder 24h before + 30m before.
- **Course Completed** — sends Congratulations.
- **Subscription Renewing** — sends Heads Up 3 days before.

## Creating a trigger

1. Go to **Admin → Emails → Triggers**.
2. Click **Add Trigger**.
3. **Basic** tab:
   - **Name** — internal label.
   - **Event** — pick from the list (Enrollment Complete, Payment Failed, etc.).
   - **Template** — pick which template to send.
   - **Active** — toggle on to enable.
4. **Timing** tab:
   - **Send immediately** OR
   - **Delay** — N minutes/hours/days after the event.
5. **Advanced** tab:
   - **Conditions** — only fire if certain criteria match (e.g., "only for products in category X").
   - **Recipient override** — by default sends to the user the event is about; override to send to admin/instructor.
6. Click **Save**.

## Trigger order

If multiple triggers match the same event, they ALL fire (in the order they were created). To send multiple emails for one event, that's how — create multiple triggers.

## Disabling a trigger

Toggle **Active** off. The trigger row stays but won't fire. Useful for seasonal pauses or testing.

> [!TIP]
> The lesson reminder cron runs every 15 minutes. So if your trigger says "30 min before lesson", the actual send happens 30-45 minutes before. Don't set ultra-precise timings; round to 15-min granularity.
$body$),
  ('emails-triggers', 'he', 'טריגרים של מיילים',
   'תקשורת', 72,
   ARRAY['emails-triggers']::text[],
   ARRAY['emails-overview', 'emails-templates']::text[],
$body$טריגרים מגדירים מתי כל תבנית מייל מופעלת. הפלטפורמה מגיעה עם ברירות מחדל לכל אירוע; התאם תזמון אם אתה צריך קצב שונה.

## טריגרים נפוצים (מובנים)

- **הרשמה הושלמה** — שולח ברוכים הבאים מיידית.
- **תשלום הצליח** — שולח קבלה מיידית.
- **תשלום נכשל** — שולח הודעת ניסיון חוזר מיידית.
- **שיעור מתוזמן** — שולח תזכורת 24 שעות לפני + 30 דקות לפני.
- **קורס הושלם** — שולח ברכות.
- **מנוי מתחדש** — שולח התראה 3 ימים לפני.

## יצירת טריגר

1. עבור ל**ניהול ← מיילים ← טריגרים**.
2. לחץ **הוסף טריגר**.
3. לשונית **בסיסי**:
   - **שם** — תווית פנימית.
   - **אירוע** — בחר מהרשימה (הרשמה הושלמה, תשלום נכשל וכו').
   - **תבנית** — בחר איזו תבנית לשלוח.
   - **פעיל** — הפעל כדי להפעיל.
4. לשונית **תזמון**:
   - **שלח מיידית** או
   - **השהיה** — N דקות/שעות/ימים אחרי האירוע.
5. לשונית **מתקדם**:
   - **תנאים** — מופעל רק אם קריטריונים מסוימים תואמים (למשל "רק למוצרים בקטגוריה X").
   - **עקיפת נמען** — כברירת מחדל שולח למשתמש שהאירוע מתייחס אליו; עקוף לשלוח למנהל/מרצה.
6. לחץ **שמור**.

## סדר טריגרים

אם מספר טריגרים מתאימים לאותו אירוע, כולם מופעלים (לפי סדר היצירה). כדי לשלוח מספר מיילים לאירוע אחד, זו הדרך — צור מספר טריגרים.

## השבתת טריגר

כבה את **פעיל**. שורת הטריגר נשארת אך לא מופעלת. שימושי להשהיות עונתיות או בדיקה.

> [!TIP]
> ה-cron של תזכורות שיעור רץ כל 15 דקות. אז אם הטריגר אומר "30 דקות לפני שיעור", השליחה בפועל קורית 30-45 דקות לפני. אל תגדיר תזמונים מדויקים במיוחד; עגל לגרנולריות של 15 דקות.
$body$);

  -- =============================================================
  -- emails-queue
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('emails-queue', 'en', 'Email Queue & Troubleshooting',
   'Communication', 73,
   ARRAY['emails-queue']::text[],
   ARRAY['emails-overview', 'emails-templates', 'integrations-overview']::text[],
$body$The email queue is where every outgoing email waits before being sent. The cron `process-email-queue` runs every 2 minutes and drains the queue.

## What you see

Each row is one email with:
- **Recipient** — who it's going to.
- **Subject** — final rendered subject.
- **Status** — Pending / Sending / Sent / Failed.
- **Priority** — High / Normal / Low.
- **Created** — when the email was queued (event time).
- **Sent** — when it actually went out (after cron run + SMTP delivery).

## Debugging "no emails arriving"

If a student says they didn't get an email:

1. Filter the queue by their email.
2. Check status:
   - **Pending or Sending** stuck for >5 min — cron may not be running. Verify cron is configured (`vercel.json` has `process-email-queue` cron).
   - **Failed** — click the row to see the error. Usually invalid SMTP credentials, bounced address, or spam filter rejection.
   - **Sent** but they say no — check their spam folder; ask them to add `noreply@yourdomain.com` to contacts.
3. If failed: fix the integration (Brevo/SMTP credentials), then click **Retry Failed** on the queue page.

## Common errors

- **`AUTH FAILED`** — SMTP password is wrong. Refresh credentials in Integrations → Email.
- **`SENDER REJECTED`** — your sender domain is unverified in Brevo/SMTP. Set up DKIM + SPF records.
- **`MAILBOX UNAVAILABLE`** — typo'd address. Contact the user.
- **`RATE LIMIT`** — sending too fast. Brevo free tier caps at 300/day; upgrade or slow down.

## Bulk operations

- **Retry all failed** — re-attempts every Failed row.
- **Cancel pending** — useful before changing a template to prevent old content from sending.
- **Export to CSV** — for support escalation or analysis.

> [!WARNING]
> Cancelling a Pending email doesn't undo the event that triggered it. If you cancel a Welcome email, the student still got enrolled — they just won't get the welcome message.
$body$),
  ('emails-queue', 'he', 'תור מיילים ופתרון בעיות',
   'תקשורת', 73,
   ARRAY['emails-queue']::text[],
   ARRAY['emails-overview', 'emails-templates', 'integrations-overview']::text[],
$body$תור המיילים הוא איפה כל מייל יוצא ממתין לפני שליחה. ה-cron `process-email-queue` רץ כל 2 דקות ומרוקן את התור.

## מה אתה רואה

כל שורה היא מייל אחד עם:
- **נמען** — למי הוא מיועד.
- **נושא** — נושא מרונדר סופי.
- **סטטוס** — ממתין / שולח / נשלח / נכשל.
- **עדיפות** — גבוה / רגיל / נמוך.
- **נוצר** — מתי המייל נכנס לתור (זמן האירוע).
- **נשלח** — מתי הוא בפועל יצא (אחרי הפעלת cron + מסירת SMTP).

## איתור באגים "מיילים לא מגיעים"

אם סטודנט אומר שלא קיבל מייל:

1. סנן את התור לפי המייל שלו.
2. בדוק סטטוס:
   - **ממתין או שולח** תקוע >5 דקות — cron אולי לא רץ. ודא שה-cron מוגדר (`vercel.json` כולל `process-email-queue` cron).
   - **נכשל** — לחץ על השורה לראות את השגיאה. בדרך כלל אישורי SMTP לא תקפים, כתובת חזרה, או דחיית מסנן ספאם.
   - **נשלח** אבל הוא אומר שלא — בדוק את תיקיית הספאם שלו; בקש ממנו להוסיף את `noreply@yourdomain.com` לאנשי קשר.
3. אם נכשל: תקן את השילוב (אישורי Brevo/SMTP), ואז לחץ **נסה שוב נכשלים** בדף התור.

## שגיאות נפוצות

- **`AUTH FAILED`** — סיסמת SMTP שגויה. רענן אישורים בשילובים ← מייל.
- **`SENDER REJECTED`** — דומיין השולח שלך לא מאומת ב-Brevo/SMTP. הגדר רשומות DKIM + SPF.
- **`MAILBOX UNAVAILABLE`** — שגיאת הקלדה בכתובת. צור קשר עם המשתמש.
- **`RATE LIMIT`** — שולח מהר מדי. שכבת חינם של Brevo מוגבלת ל-300/יום; שדרג או האט.

## פעולות בכמות

- **נסה שוב את כל הנכשלים** — מנסה שוב כל שורה שנכשלה.
- **בטל ממתינים** — שימושי לפני שינוי תבנית כדי למנוע שליחת תוכן ישן.
- **ייצא ל-CSV** — להסלמת תמיכה או ניתוח.

> [!WARNING]
> ביטול מייל ממתין לא מבטל את האירוע שהפעיל אותו. אם תבטל מייל ברוכים הבאים, הסטודנט עדיין נרשם — הוא פשוט לא יקבל את הודעת ברוכים הבאים.
$body$);

  -- =============================================================
  -- notifications
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('notifications', 'en', 'Notifications',
   'Communication', 74,
   ARRAY['admin-notifications']::text[],
   ARRAY['emails-overview', 'integrations-overview']::text[],
$body$Notifications are in-app messages shown in the bell icon at the top right of every page. They're separate from emails — students see them whether or not they open their email.

## What gets notified

- New enrollment in your course (instructor view).
- Payment received / failed (admin view).
- Grade posted (student view).
- Lesson starting soon (student view).
- System messages (e.g., "maintenance window tomorrow").

## Composing a custom notification

1. Go to **Admin → Notifications**.
2. Click **Create Notification**.
3. **Recipient** — pick one of:
   - All users in tenant.
   - Users with a specific role.
   - Users enrolled in a specific course/product.
   - Specific user(s) by email.
4. **Title** + **Body** — short message. Markdown supported in body.
5. **Action button** (optional) — label + URL.
6. **Expires** — when the notification disappears from inboxes (default 30 days).
7. **Channels** — in-app only, or also email/SMS (if Twilio is connected).
8. Click **Send**.

## How students see notifications

The bell icon shows an unread count. Clicking opens a dropdown with recent notifications. Each has:
- Title + timestamp.
- Body text.
- Optional action button.
- Mark as read on click.

## Auto-vs-manual notifications

The system creates auto-notifications for routine events (enrollment confirmations, etc.). You typically only use the Create Notification flow for announcements ("class moved to next week").
$body$),
  ('notifications', 'he', 'התראות',
   'תקשורת', 74,
   ARRAY['admin-notifications']::text[],
   ARRAY['emails-overview', 'integrations-overview']::text[],
$body$התראות הן הודעות בתוך האפליקציה המוצגות באייקון הפעמון בפינה הימנית העליונה של כל דף. הן נפרדות ממיילים — סטודנטים רואים אותן בין אם הם פותחים את המייל או לא.

## מה מקבל התראה

- הרשמה חדשה לקורס שלך (תצוגת מרצה).
- תשלום התקבל / נכשל (תצוגת מנהל).
- ציון פורסם (תצוגת סטודנט).
- שיעור מתחיל בקרוב (תצוגת סטודנט).
- הודעות מערכת (למשל "חלון תחזוקה מחר").

## חיבור התראה מותאמת

1. עבור ל**ניהול ← התראות**.
2. לחץ **צור התראה**.
3. **נמען** — בחר אחד מ:
   - כל המשתמשים בארגון.
   - משתמשים עם תפקיד ספציפי.
   - משתמשים רשומים בקורס/מוצר ספציפי.
   - משתמשים ספציפיים לפי מייל.
4. **כותרת** + **גוף** — הודעה קצרה. Markdown נתמך בגוף.
5. **כפתור פעולה** (אופציונלי) — תווית + URL.
6. **פג תוקף** — מתי ההתראה נעלמת מתיבות הדואר (ברירת מחדל 30 ימים).
7. **ערוצים** — באפליקציה בלבד, או גם מייל/SMS (אם Twilio מחובר).
8. לחץ **שלח**.

## איך סטודנטים רואים התראות

אייקון הפעמון מציג ספירה לא נקראה. לחיצה פותחת תפריט נפתח עם התראות אחרונות. לכל אחת:
- כותרת + חותמת זמן.
- טקסט גוף.
- כפתור פעולה אופציונלי.
- סמן כנקרא בלחיצה.

## התראות אוטו לעומת ידני

המערכת יוצרת התראות אוטומטיות לאירועי שגרה (אישורי הרשמה וכו'). בדרך כלל אתה משתמש בזרם צור התראה רק להכרזות ("השיעור עבר לשבוע הבא").
$body$);

  -- =============================================================
  -- config-navigation
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('config-navigation', 'en', 'Customize the Admin Sidebar',
   'Configuration', 80,
   ARRAY['config-navigation']::text[],
   ARRAY['settings-overview', 'admin-overview']::text[],
$body$The Config → Navigation page lets you customize the admin sidebar — reorder items, hide what you don't use, group related items into collapsible sections.

## What you can do

- **Reorder** — drag items up and down.
- **Nest** — drag an item into another to make it a child (creates a collapsible group).
- **Hide** — toggle visibility off; the item won't appear in any admin's sidebar.
- **Rename** — override the default label.
- **Group** — create a top-level section with children nested under it.

## Step by step

1. Go to **Admin → Config → Navigation**.
2. You see a tree of all sidebar items.
3. **To reorder**: drag an item by its handle (left grip icon) up or down.
4. **To nest**: drag onto another item to make it a child. The parent becomes a collapsible group.
5. **To hide**: toggle the eye icon on a row.
6. **To rename**: click the row → edit label → save.
7. **To delete a custom group**: click the trash icon (only available on empty groups).
8. Click **Save Navigation** at the bottom.

## What's saved

- Custom order.
- Visibility flags.
- Custom labels (override the platform default translations).
- Parent/child nesting.

The default platform items can't be deleted — only hidden. You can't add brand new sidebar items from the UI (that requires code changes).

## Tenant scope

Navigation customization is **per tenant** — your changes don't affect other tenants on the platform.

> [!TIP]
> Reset to default if you mess up: click **Reset to Default** at the top. You'll lose all custom ordering but get the standard layout back.
$body$),
  ('config-navigation', 'he', 'התאם את סרגל הניהול',
   'קונפיגורציה', 80,
   ARRAY['config-navigation']::text[],
   ARRAY['settings-overview', 'admin-overview']::text[],
$body$דף קונפיגורציה ← ניווט מאפשר להתאים את סרגל הניהול — לסדר מחדש פריטים, להסתיר מה שאינך משתמש, לקבץ פריטים קשורים לסעיפים מתקפלים.

## מה אתה יכול לעשות

- **סידור מחדש** — גרור פריטים למעלה ולמטה.
- **קינון** — גרור פריט לתוך אחר כדי להפוך אותו לילד (יוצר קבוצה מתקפלת).
- **הסתרה** — כבה נראות; הפריט לא יופיע בסרגל של אף מנהל.
- **שינוי שם** — עקוף את התווית של ברירת המחדל.
- **קיבוץ** — צור סעיף ברמה עליונה עם ילדים מקוננים תחתיו.

## שלב אחר שלב

1. עבור ל**ניהול ← קונפיגורציה ← ניווט**.
2. אתה רואה עץ של כל פריטי הסרגל.
3. **לסדר מחדש**: גרור פריט באמצעות הידית (אייקון אחיזה משמאל) למעלה או למטה.
4. **לקנן**: גרור על פריט אחר כדי להפוך אותו לילד. ההורה הופך לקבוצה מתקפלת.
5. **להסתיר**: כבה את אייקון העין בשורה.
6. **לשנות שם**: לחץ על השורה ← ערוך תווית ← שמור.
7. **למחוק קבוצה מותאמת**: לחץ על אייקון הפח (זמין רק בקבוצות ריקות).
8. לחץ **שמור ניווט** בתחתית.

## מה נשמר

- סדר מותאם.
- דגלי נראות.
- תוויות מותאמות (עוקפות את תרגומי ברירת המחדל של הפלטפורמה).
- קינון הורה/ילד.

פריטי הפלטפורמה המובנים לא ניתנים למחיקה — רק להסתרה. אינך יכול להוסיף פריטי סרגל חדשים לגמרי מהממשק (זה דורש שינויי קוד).

## טווח ארגון

התאמת ניווט היא **לכל ארגון** — השינויים שלך לא משפיעים על ארגונים אחרים בפלטפורמה.

> [!TIP]
> אפס לברירת מחדל אם בלגנת: לחץ **אפס לברירת מחדל** בראש. תאבד את כל הסידור המותאם אך תקבל את הפריסה הסטנדרטית בחזרה.
$body$);

  -- =============================================================
  -- config-translations
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('config-translations', 'en', 'Edit UI Translations',
   'Configuration', 81,
   ARRAY['config-translations']::text[],
   ARRAY['settings-overview', 'config-navigation']::text[],
$body$Translations are every word in the UI — button labels, headers, placeholders, error messages. The platform ships with English + Hebrew defaults; you can override any string per tenant.

## When to use this

- Your school uses different terminology: "Class" instead of "Course", "Tuition" instead of "Payment".
- A platform default is awkward or wrong for your context.
- Adding completely new languages (requires Config → Languages first).

## How translations are organized

Each row is one `translation_key` (an identifier like `admin.payments.title`). The same key has separate rows for each language. Editing one language doesn't affect the other.

## Step by step

1. Go to **Admin → Config → Translations**.
2. Filter by:
   - **Language** — show English or Hebrew rows.
   - **Category** — admin, user, public, etc.
   - **Search** — by key name or current value.
3. Click any row to edit:
   - **Value** — the translated string.
   - Variables like `{count}` should be preserved exactly — they're replaced at runtime.
4. Save.

## Tenant override vs global default

- **Global defaults** ship with the platform (`tenant_id = NULL`).
- **Tenant overrides** sit on top (`tenant_id = your tenant`).
- The UI shows the override if one exists; otherwise the global default.

To revert a tenant override back to the platform default, click **Reset** on the row.

## Cache behavior

Translation lookups are cached for 60 seconds. After saving an edit, wait up to a minute (or force-refresh the page) to see the new text everywhere.

> [!WARNING]
> Edit translations carefully — typos appear EVERYWHERE the key is used. Preview your changes on at least one page before assuming they're right.

## Bulk import/export

The Import/Export buttons let you download all your overrides as JSON or CSV, edit them in a spreadsheet, and re-upload. Useful for working with translators.
$body$),
  ('config-translations', 'he', 'ערוך תרגומי ממשק',
   'קונפיגורציה', 81,
   ARRAY['config-translations']::text[],
   ARRAY['settings-overview', 'config-navigation']::text[],
$body$תרגומים הם כל מילה בממשק — תוויות כפתורים, כותרות, מציני מקום, הודעות שגיאה. הפלטפורמה מגיעה עם ברירות מחדל באנגלית + עברית; אתה יכול לעקוף כל מחרוזת לכל ארגון.

## מתי להשתמש בזה

- בית הספר שלך משתמש בטרמינולוגיה שונה: "כיתה" במקום "קורס", "שכר לימוד" במקום "תשלום".
- ברירת מחדל של הפלטפורמה מסורבלת או שגויה להקשר שלך.
- הוספת שפות חדשות לחלוטין (דורש קונפיגורציה ← שפות תחילה).

## איך תרגומים מאורגנים

כל שורה היא `translation_key` אחד (מזהה כמו `admin.payments.title`). לאותו מפתח יש שורות נפרדות לכל שפה. עריכת שפה אחת לא משפיעה על השנייה.

## שלב אחר שלב

1. עבור ל**ניהול ← קונפיגורציה ← תרגומים**.
2. סנן לפי:
   - **שפה** — הצג שורות אנגלית או עברית.
   - **קטגוריה** — admin, user, public וכו'.
   - **חיפוש** — לפי שם מפתח או ערך נוכחי.
3. לחץ על כל שורה לעריכה:
   - **ערך** — המחרוזת המתורגמת.
   - משתנים כמו `{count}` יש לשמור בדיוק — הם מוחלפים בזמן ריצה.
4. שמור.

## עקיפת ארגון לעומת ברירת מחדל גלובלית

- **ברירות מחדל גלובליות** מגיעות עם הפלטפורמה (`tenant_id = NULL`).
- **עקיפות ארגון** יושבות מעליהן (`tenant_id = הארגון שלך`).
- הממשק מציג את העקיפה אם קיימת; אחרת ברירת המחדל הגלובלית.

כדי לחזור לברירת המחדל של הפלטפורמה, לחץ **אפס** בשורה.

## התנהגות מטמון

חיפושי תרגום נשמרים במטמון 60 שניות. אחרי שמירת עריכה, חכה עד דקה (או רענן את הדף בכוח) לראות את הטקסט החדש בכל מקום.

> [!WARNING]
> ערוך תרגומים בזהירות — שגיאות הקלדה מופיעות בכל מקום שהמפתח משמש. הצג את השינויים שלך בלפחות דף אחד לפני שאתה מניח שהם נכונים.

## ייבוא/ייצוא בכמות

כפתורי הייבוא/ייצוא מאפשרים לך להוריד את כל העקיפות שלך כ-JSON או CSV, לערוך אותן בגיליון, ולהעלות מחדש. שימושי לעבודה עם מתרגמים.
$body$);

  -- =============================================================
  -- crm-tags
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('crm-tags', 'en', 'Manage Keap CRM Tags',
   'CRM', 90,
   ARRAY['crm-tags', 'keap-tags']::text[],
   ARRAY['integrations-keap', 'payments-products']::text[],
$body$The Keap Tags page is a synced view of every tag in your connected Keap account. Use it to organize tags, see usage counts, and assign tags to products in bulk.

## What you can do

- **View all Keap tags** — pulled live from Keap's API.
- **Search & filter** — by tag name or Keap tag category.
- **See usage** — how many products apply each tag.
- **Drill into a product** — click any product → opens its CRM Tags configuration.

## Syncing tags

The list auto-refreshes every time you open the page. To force a fresh pull (e.g., after adding tags in Keap), click **Refresh** in the top right.

> [!NOTE]
> Tags are **read-only here** — you can't create new tags in IPSPlatform. Create them in Keap → Marketing → Tags, then they'll appear here automatically.

## Assigning tags to products

1. Find the product you want (Payments → Products) or pick from this page → click into the product.
2. Open the **CRM Tags** tab.
3. Search and tick the tag(s) you want applied when a student enrolls in this product.
4. Save.

When someone enrolls in that product, the platform calls Keap's API to apply those tags to the buyer's contact. Keap's marketing campaigns can then trigger off those tags.

## Bulk assignment

The Tags page shows a column "Used in N products". Click that number to see which products use the tag. From there you can quickly add/remove the tag across many products.

## Common pitfalls

- **Tag doesn't appear** — refresh the page. If still missing, it may be archived in Keap.
- **Tag applied but Keap campaign doesn't fire** — that's a Keap-side issue. Check the campaign is published and the goal listens for the right tag.
$body$),
  ('crm-tags', 'he', 'ניהול תגיות Keap CRM',
   'CRM', 90,
   ARRAY['crm-tags', 'keap-tags']::text[],
   ARRAY['integrations-keap', 'payments-products']::text[],
$body$דף תגיות Keap הוא תצוגה מסונכרנת של כל תגית בחשבון Keap המחובר. השתמש בו כדי לארגן תגיות, לראות ספירת שימוש ולהקצות תגיות למוצרים בכמות.

## מה אתה יכול לעשות

- **צפה בכל תגיות Keap** — נשלף חי מ-API של Keap.
- **חיפוש וסינון** — לפי שם תגית או קטגוריית תגית של Keap.
- **ראה שימוש** — כמה מוצרים מחילים כל תגית.
- **קדח למוצר** — לחץ על כל מוצר ← פותח את הגדרת תגיות ה-CRM שלו.

## סנכרון תגיות

הרשימה מתרעננת אוטומטית בכל פתיחת הדף. כדי לאלץ משיכה טרייה (למשל אחרי הוספת תגיות ב-Keap), לחץ **רענן** ימין למעלה.

> [!NOTE]
> תגיות **לקריאה בלבד כאן** — אינך יכול ליצור תגיות חדשות ב-IPSPlatform. צור אותן ב-Keap ← Marketing → Tags, ואז הן יופיעו כאן אוטומטית.

## הקצאת תגיות למוצרים

1. מצא את המוצר שאתה רוצה (תשלומים ← מוצרים) או בחר מדף זה ← לחץ למוצר.
2. פתח את לשונית **תגיות CRM**.
3. חפש וסמן את התגית(ות) שאתה רוצה להחיל כשסטודנט נרשם למוצר זה.
4. שמור.

כשמישהו נרשם למוצר ההוא, הפלטפורמה קוראת ל-API של Keap להחיל את התגיות על איש הקשר של הקונה. קמפיינים שיווקיים ב-Keap יכולים אז להפעיל את אותן תגיות.

## הקצאה בכמות

דף התגיות מציג עמודה "בשימוש ב-N מוצרים". לחץ על המספר הזה לראות אילו מוצרים משתמשים בתגית. משם אתה יכול במהירות להוסיף/להסיר את התגית במוצרים רבים.

## טעויות נפוצות

- **תגית לא מופיעה** — רענן את הדף. אם עדיין חסר, אולי הועבר לארכיון ב-Keap.
- **תגית מוחלת אך קמפיין Keap לא מופעל** — זו בעיה בצד Keap. בדוק שהקמפיין מפורסם והמטרה מקשיבה לתגית הנכונה.
$body$);

  RAISE NOTICE 'Help articles seed (file 6/6): Enrollments/Comm/Config/CRM — 10 articles × 2 locales = 20 rows.';
END $$;
