-- Comprehensive help seed — File 5 of 6: Sales / Products / Payments.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'payments-products',
    'payments-plans',
    'payments-plans-rules',
    'payments-transactions',
    'payments-pdf-template',
    'payments-disputes',
    'payments-reports'
  );

  -- =============================================================
  -- payments-products
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-products', 'en', 'Create Your First Product',
   'Payments', 50,
   ARRAY['payments-products']::text[],
   ARRAY['payments-plans', 'enrollments-overview', 'lms-courses', 'integrations-stripe']::text[],
$body$A **product** is something a student can enroll in: a single course, a multi-course program, or a one-off lecture. Products carry the price and define how students pay.

## Before you start

- Stripe must be connected (Integrations → Stripe).
- The course (or program) you're selling must exist already (LMS → Courses).
- Decide on pricing and payment terms.

## Step by step

1. Go to **Admin → Payments → Products**.
2. Click **Create Product**.
3. **Basic Info** tab:
   - **Name** — e.g., "Intro to React — Winter 2026".
   - **Slug** — URL-safe identifier; appears in the public enrollment URL.
   - **Description** — long-form, shown on the public enrollment page.
   - **Image** — cover (1200×675px).
   - **Type** — Course / Program / Lecture / Custom.
4. **Content** tab:
   - Pick the LMS course or program this product unlocks.
   - For program products, pick the bundle.
5. **Pricing** tab:
   - **Base price** — main price.
   - **Currency** — usually inherits from tenant default.
   - **Payment Plans** — see below.
6. **Email Templates** tab:
   - Which welcome / receipt emails fire on purchase.
7. **CRM Tags** tab (if Keap is connected):
   - Which Keap tags get applied to the buyer on completed enrollment.
8. **Integrations** tab:
   - Stripe product is auto-created on save. You don't need to set anything here.
9. Click **Save**. Toggle **Published** to make the product publicly enrollable.

## The public enrollment URL

After publishing, each product gets a URL like `https://<your-domain>/enroll/<slug>`. Share that URL in your marketing materials — students land there, fill in their info, and pay.

> [!TIP]
> Test the public URL in incognito mode with a Stripe test card (`4242 4242 4242 4242`) before going live. It walks the same flow your students will see.

## Duplicating products

Once you've built a product, duplicate it for next term:
1. Hover the product row → click "Duplicate".
2. Edit name and dates.
3. Re-publish.

Stripe products are independent — duplicating doesn't carry over Stripe IDs.
$body$),
  ('payments-products', 'he', 'צור את המוצר הראשון שלך',
   'תשלומים', 50,
   ARRAY['payments-products']::text[],
   ARRAY['payments-plans', 'enrollments-overview', 'lms-courses', 'integrations-stripe']::text[],
$body$**מוצר** הוא משהו שסטודנט יכול להירשם אליו: קורס בודד, תכנית רב-קורסים, או הרצאה חד-פעמית. מוצרים נושאים את המחיר ומגדירים איך סטודנטים משלמים.

## לפני שמתחילים

- Stripe חייב להיות מחובר (שילובים ← Stripe).
- הקורס (או התכנית) שאתה מוכר חייב להתקיים כבר (מערכת לימוד ← קורסים).
- החלט על תמחור ותנאי תשלום.

## שלב אחר שלב

1. עבור ל**ניהול ← תשלומים ← מוצרים**.
2. לחץ **צור מוצר**.
3. לשונית **מידע בסיסי**:
   - **שם** — למשל "מבוא ל-React — חורף 2026".
   - **Slug** — מזהה ידידותי-URL; מופיע בכתובת ההרשמה הציבורית.
   - **תיאור** — ארוך, מוצג בדף ההרשמה הציבורי.
   - **תמונה** — כיסוי (1200×675px).
   - **סוג** — קורס / תכנית / הרצאה / מותאם אישית.
4. לשונית **תוכן**:
   - בחר את הקורס או התכנית שהמוצר הזה פותח.
5. לשונית **תמחור**:
   - **מחיר בסיס** — המחיר העיקרי.
   - **מטבע** — בדרך כלל יורש מברירת המחדל של הארגון.
   - **תכניות תשלום** — ראה למטה.
6. לשונית **תבניות מייל**:
   - אילו מיילי ברוכים הבאים / קבלה מופעלים ברכישה.
7. לשונית **תגיות CRM** (אם Keap מחובר):
   - אילו תגיות Keap מוחלות על הרוכש בהשלמת הרשמה.
8. לשונית **שילובים**:
   - מוצר Stripe נוצר אוטומטית בשמירה. אין צורך להגדיר כלום כאן.
9. לחץ **שמור**. הפעל **מפורסם** כדי להפוך את המוצר לזמין להרשמה ציבורית.

## כתובת ההרשמה הציבורית

אחרי פרסום, כל מוצר מקבל URL כמו `https://<your-domain>/enroll/<slug>`. שתף את ה-URL בחומרי השיווק — סטודנטים מגיעים לשם, ממלאים את פרטיהם, ומשלמים.

> [!TIP]
> בדוק את ה-URL הציבורי במצב גלישה בסתר עם כרטיס בדיקה של Stripe (`4242 4242 4242 4242`) לפני שאתה עולה לאוויר. הוא עובר את אותו זרם שסטודנטים יראו.

## שכפול מוצרים

אחרי שבנית מוצר, שכפל אותו לתקופה הבאה:
1. רחף מעל שורת המוצר ← לחץ "שכפל".
2. ערוך שם ותאריכים.
3. פרסם מחדש.

מוצרי Stripe עצמאיים — שכפול לא מעביר מזהי Stripe.
$body$);

  -- =============================================================
  -- payments-plans
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-plans', 'en', 'Payment Plans',
   'Payments', 51,
   ARRAY['payments-plans']::text[],
   ARRAY['payments-products', 'payments-plans-rules', 'enrollments-overview']::text[],
$body$Payment plans define HOW a student pays for a product. The same product can offer multiple plans (e.g., "full payment OR 6-month installments"). The student picks at checkout.

## Plan types

- **Full Payment** — pay everything upfront. Simplest.
- **Deposit + Installments** — pay a deposit now, then N installments on a schedule.
- **Subscription** — recurring billing on a fixed interval (monthly, yearly). For memberships.

## Creating a plan

1. Go to **Admin → Payments → Plans**.
2. Click **Create Plan**.
3. Fill in:
   - **Plan Name** — student-facing label (e.g., "Pay in 6 monthly installments").
   - **Plan Type** — pick from the three above.
   - **Total Amount** — what the student ultimately pays.
   - **Deposit Amount** — only for deposit+installments.
   - **Number of Installments** — how many follow-up payments after the deposit.
   - **Billing Interval** — for subscriptions only (monthly, weekly, yearly).
   - **First Charge Date** — when the first installment runs (relative to enrollment date).
4. Click **Create**.

## Linking a plan to a product

A plan exists on its own; attach it to one or more products:

1. Open a product → **Pricing** tab.
2. Under "Available Payment Plans", click **Add Plan**.
3. Pick the plan from the dropdown.
4. Optionally mark one plan as **Default** — pre-selected in the public enrollment wizard.
5. Save.

## How installments work behind the scenes

For deposit + installments:
1. At enrollment, Stripe charges the deposit immediately.
2. The platform schedules N future invoices in Stripe.
3. Each scheduled date, Stripe automatically charges the customer's saved payment method.
4. Webhooks report each charge result back to the platform.
5. Failed charges trigger an automatic retry (configurable in Plans → Rules).

> [!NOTE]
> If a customer's card fails on an installment, the enrollment goes to "Past Due" status. The customer is emailed; an automatic retry runs at 1 day, 3 days, and 7 days. After 4 failed retries, the enrollment moves to "Cancelled" unless you intervene manually.
$body$),
  ('payments-plans', 'he', 'תכניות תשלום',
   'תשלומים', 51,
   ARRAY['payments-plans']::text[],
   ARRAY['payments-products', 'payments-plans-rules', 'enrollments-overview']::text[],
$body$תכניות תשלום מגדירות איך סטודנט משלם עבור מוצר. אותו מוצר יכול להציע מספר תכניות (למשל "תשלום מלא או 6 תשלומים חודשיים"). הסטודנט בוחר בקופה.

## סוגי תכניות

- **תשלום מלא** — שלם הכל מראש. הפשוט ביותר.
- **מקדמה + תשלומים** — שלם מקדמה עכשיו, ואז N תשלומים בלוח זמנים.
- **מנוי** — חיוב חוזר במרווח קבוע (חודשי, שנתי). לחברויות.

## יצירת תכנית

1. עבור ל**ניהול ← תשלומים ← תכניות**.
2. לחץ **צור תכנית**.
3. מלא:
   - **שם תכנית** — תווית הנראית לסטודנט (למשל "שלם ב-6 תשלומים חודשיים").
   - **סוג תכנית** — בחר מהשלושה לעיל.
   - **סכום כולל** — מה הסטודנט משלם בסופו של דבר.
   - **סכום מקדמה** — רק למקדמה+תשלומים.
   - **מספר תשלומים** — כמה תשלומי המשך אחרי המקדמה.
   - **מרווח חיוב** — למנויים בלבד (חודשי, שבועי, שנתי).
   - **תאריך חיוב ראשון** — מתי התשלום הראשון רץ (יחסי לתאריך ההרשמה).
4. לחץ **צור**.

## קישור תכנית למוצר

תכנית קיימת בפני עצמה; צרף אותה למוצר אחד או יותר:

1. פתח מוצר ← לשונית **תמחור**.
2. תחת "תכניות תשלום זמינות", לחץ **הוסף תכנית**.
3. בחר את התכנית מהתפריט הנפתח.
4. אופציונלית סמן תכנית אחת כ**ברירת מחדל** — נבחרת מראש באשף ההרשמה הציבורי.
5. שמור.

## איך תשלומים עובדים מאחורי הקלעים

למקדמה + תשלומים:
1. בהרשמה, Stripe גובה את המקדמה מיידית.
2. הפלטפורמה מתזמנת N חשבוניות עתידיות ב-Stripe.
3. בכל תאריך מתוזמן, Stripe גובה אוטומטית את אמצעי התשלום השמור של הלקוח.
4. Webhooks מדווחים את תוצאת כל חיוב בחזרה לפלטפורמה.
5. חיובים שנכשלו מפעילים ניסיון חוזר אוטומטי (ניתן להגדרה בתכניות ← כללים).

> [!NOTE]
> אם כרטיס לקוח נכשל בתשלום, ההרשמה עוברת לסטטוס "באיחור". הלקוח מקבל מייל; ניסיון חוזר אוטומטי רץ ביום 1, 3 ו-7. אחרי 4 ניסיונות כושלים, ההרשמה עוברת ל"בוטל" אלא אם תתערב ידנית.
$body$);

  -- =============================================================
  -- payments-plans-rules
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-plans-rules', 'en', 'Auto-Detection Rules',
   'Payments', 52,
   ARRAY['payments-plans-rules']::text[],
   ARRAY['payments-plans', 'payments-products']::text[],
$body$Auto-detection rules let the public enrollment wizard pre-select the right payment plan based on attributes of the customer: country, product type, total cart value, etc. This is for shops that want different defaults for different audiences.

## When you might use this

- "Customers in EU pay in EUR with the 6-installment plan; everyone else USD with full payment."
- "Bundle products auto-select the 12-month installment plan."
- "First-time customers see a discount plan."

## Creating a rule

1. Go to **Admin → Payments → Plans → Rules**.
2. Click **Add Rule**.
3. **Conditions** — combine any of:
   - Product type (Course / Program / Lecture / Custom)
   - Product slug pattern
   - Customer country (from address)
   - Cart total (greater than / less than)
   - Existing customer (yes/no)
4. **Action** — pick which plan to auto-select.
5. **Priority** — rules are evaluated in priority order (lowest number first). The first matching rule wins.
6. **Active** — toggle off to disable without deleting.
7. Click **Save**.

## Testing rules

The **Test Detection** button (top right of the Rules page) opens a tester:
- Pick a product.
- Set a fake country.
- Click "Test".
- The matching rule (if any) is highlighted.

This is how you verify your rules behave correctly before going live.

> [!WARNING]
> If no rule matches, the wizard falls back to the product's default plan. Always set a sensible default; don't rely solely on rules.
$body$),
  ('payments-plans-rules', 'he', 'כללי זיהוי אוטומטי',
   'תשלומים', 52,
   ARRAY['payments-plans-rules']::text[],
   ARRAY['payments-plans', 'payments-products']::text[],
$body$כללי זיהוי אוטומטי מאפשרים לאשף ההרשמה הציבורי לבחור מראש את תכנית התשלום הנכונה לפי תכונות הלקוח: מדינה, סוג מוצר, ערך עגלה כולל וכו'. זה לחנויות שרוצות ברירות מחדל שונות לקהלים שונים.

## מתי אתה עשוי להשתמש בזה

- "לקוחות באירופה משלמים ב-EUR עם תכנית 6 תשלומים; כל השאר ב-USD עם תשלום מלא."
- "מוצרי חבילה בוחרים אוטומטית את תכנית 12 התשלומים."
- "לקוחות חדשים רואים תכנית הנחה."

## יצירת כלל

1. עבור ל**ניהול ← תשלומים ← תכניות ← כללים**.
2. לחץ **הוסף כלל**.
3. **תנאים** — שלב כל אחד מ:
   - סוג מוצר (קורס / תכנית / הרצאה / מותאם אישית)
   - דפוס slug של מוצר
   - מדינת לקוח (מהכתובת)
   - סך עגלה (גדול מ / קטן מ)
   - לקוח קיים (כן/לא)
4. **פעולה** — בחר איזו תכנית לבחור אוטומטית.
5. **עדיפות** — כללים מוערכים בסדר עדיפות (מספר הנמוך ראשון). הכלל המתאים הראשון מנצח.
6. **פעיל** — כבה כדי להשבית ללא מחיקה.
7. לחץ **שמור**.

## בדיקת כללים

כפתור **בדוק זיהוי** (ימין למעלה בדף כללים) פותח בודק:
- בחר מוצר.
- הגדר מדינה מזויפת.
- לחץ "בדוק".
- הכלל המתאים (אם יש) מודגש.

כך אתה מוודא שהכללים שלך מתנהגים נכון לפני שאתה עולה לאוויר.

> [!WARNING]
> אם אף כלל לא מתאים, האשף חוזר לתכנית ברירת המחדל של המוצר. תמיד הגדר ברירת מחדל סבירה; אל תסתמך רק על כללים.
$body$);

  -- =============================================================
  -- payments-transactions
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-transactions', 'en', 'Transactions & Refunds',
   'Payments', 53,
   ARRAY['payments-transactions']::text[],
   ARRAY['payments-plans', 'enrollments-overview', 'payments-disputes']::text[],
$body$The Transactions page lists every individual payment attempt — successful, failed, refunded, or pending. One enrollment can produce many transactions over its lifetime.

## Status meanings

- **Completed** — money in your Stripe account.
- **Pending** — Stripe is processing.
- **Failed** — card declined. The system retries automatically (1 day, 3 days, 7 days).
- **Refunded** — money returned to the customer.

## Filtering

Filters at the top let you narrow by:
- Status
- Date range
- Payment method (card, bank, etc.)
- Customer
- Search by user name / email / product name

The Export button downloads a CSV of the filtered set.

## Issuing a refund

1. Find the transaction in the list.
2. Click the row to view details, OR click the **rotate icon** (↻) on the row.
3. Choose:
   - **Full refund** — refunds the entire transaction amount.
   - **Partial refund** — specify the amount.
4. Add a reason (optional but recommended; logged in audit).
5. Click **Issue Refund**.

The refund processes through Stripe, takes 5-10 business days to land back on the customer's card. The transaction row is marked "Refunded" and the customer is emailed.

> [!WARNING]
> Refunds are NOT automatic enrollment cancellations. If a refunded customer should also lose course access, manually cancel their enrollment in the Enrollments page.

## Common pitfalls

- **"Already refunded" error** — you can only refund the same transaction once. Subsequent installments are separate transactions.
- **Partial refund > original amount** — Stripe rejects; the dialog validates this client-side.
- **Refunds for very old transactions** — Stripe has a 180-day refund window. After that, you'd issue a manual refund off-platform.
$body$),
  ('payments-transactions', 'he', 'עסקאות והחזרים',
   'תשלומים', 53,
   ARRAY['payments-transactions']::text[],
   ARRAY['payments-plans', 'enrollments-overview', 'payments-disputes']::text[],
$body$דף העסקאות מציג כל ניסיון תשלום פרטני — מוצלח, נכשל, הוחזר או ממתין. הרשמה אחת יכולה להפיק עסקאות רבות לאורך חייה.

## משמעות סטטוסים

- **הושלם** — הכסף בחשבון Stripe שלך.
- **ממתין** — Stripe מעבד.
- **נכשל** — כרטיס נדחה. המערכת מנסה שוב אוטומטית (יום 1, 3, 7).
- **הוחזר** — הכסף הוחזר ללקוח.

## סינון

הסננים בראש מאפשרים לצמצם לפי:
- סטטוס
- טווח תאריכים
- אמצעי תשלום (כרטיס, בנק וכו')
- לקוח
- חיפוש לפי שם משתמש / מייל / שם מוצר

כפתור הייצוא מוריד CSV של הסט המסונן.

## ביצוע החזר

1. מצא את העסקה ברשימה.
2. לחץ על השורה לפרטים, או לחץ על **אייקון הסיבוב** (↻) בשורה.
3. בחר:
   - **החזר מלא** — מחזיר את כל סכום העסקה.
   - **החזר חלקי** — ציין את הסכום.
4. הוסף סיבה (אופציונלי אך מומלץ; נרשם בביקורת).
5. לחץ **בצע החזר**.

ההחזר מעובד דרך Stripe, לוקח 5-10 ימי עסקים להגיע בחזרה לכרטיס הלקוח. שורת העסקה מסומנת "הוחזר" והלקוח מקבל מייל.

> [!WARNING]
> החזרים אינם ביטולי הרשמה אוטומטיים. אם לקוח שקיבל החזר אמור גם לאבד גישה לקורס, בטל ידנית את ההרשמה שלו בדף ההרשמות.

## טעויות נפוצות

- **שגיאת "כבר הוחזר"** — אפשר להחזיר את אותה עסקה רק פעם אחת. תשלומים עוקבים הם עסקאות נפרדות.
- **החזר חלקי > סכום מקורי** — Stripe דוחה; הדיאלוג מאמת זאת בצד הלקוח.
- **החזרים לעסקאות ישנות מאוד** — ל-Stripe יש חלון החזר של 180 יום. אחרי זה, היית מבצע החזר ידני מחוץ לפלטפורמה.
$body$);

  -- =============================================================
  -- payments-pdf-template
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-pdf-template', 'en', 'PDF Receipt Template',
   'Payments', 54,
   ARRAY['payments-pdf-template']::text[],
   ARRAY['settings-organization', 'payments-products']::text[],
$body$Every successful enrollment generates a PDF receipt automatically emailed to the customer. The PDF template page is where you customize what appears on it.

## What you can customize

- **Organization Info** — company name, tax ID, address, phone, email.
- **Branding** — logo, primary color, accent color.
- **Footer** — legal text, support email, return policy URL.

## Step by step

1. Go to **Admin → Payments → PDF Template**.
2. **Organization Info** tab:
   - Fill in the company details (defaults to your Settings → Organization).
3. **Branding** tab:
   - Upload the logo that appears in the PDF header.
   - Set primary color (header background) and accent color (line separators).
4. **Footer** tab:
   - Add tax ID, return policy URL, support email.
   - Multi-language footer text (EN + HE).
5. Click **Preview PDF** to download a sample with placeholder data.
6. Click **Save Changes**.

## When the PDF is generated

- **On successful enrollment** — attached to the welcome email.
- **On installment payment** — attached to each installment receipt email.
- **Manually** — go to the enrollment detail page → "Download PDF Receipt".

> [!TIP]
> Always click **Preview PDF** before saving major changes. The preview shows exactly what your customers will see.

## Multi-language receipts

Each customer receives the receipt in the language they used to enroll. The template auto-detects: if the customer enrolled with Hebrew UI, the PDF renders in Hebrew (RTL); otherwise English. Both versions use the same logo and colors.
$body$),
  ('payments-pdf-template', 'he', 'תבנית קבלת PDF',
   'תשלומים', 54,
   ARRAY['payments-pdf-template']::text[],
   ARRAY['settings-organization', 'payments-products']::text[],
$body$כל הרשמה מוצלחת מייצרת קבלת PDF הנשלחת אוטומטית ללקוח. דף תבנית ה-PDF הוא איפה מתאימים את מה שמופיע בה.

## מה ניתן להתאים

- **פרטי ארגון** — שם חברה, ח.פ., כתובת, טלפון, מייל.
- **מיתוג** — לוגו, צבע ראשי, צבע משני.
- **תחתית** — טקסט משפטי, מייל תמיכה, URL מדיניות החזרים.

## שלב אחר שלב

1. עבור ל**ניהול ← תשלומים ← תבנית PDF**.
2. לשונית **פרטי ארגון**:
   - מלא פרטי חברה (ברירת מחדל מהגדרות ← ארגון).
3. לשונית **מיתוג**:
   - העלה את הלוגו המופיע בכותרת ה-PDF.
   - הגדר צבע ראשי (רקע כותרת) וצבע משני (מפרידי שורה).
4. לשונית **תחתית**:
   - הוסף ח.פ., URL מדיניות החזרים, מייל תמיכה.
   - טקסט תחתית רב-לשוני (EN + HE).
5. לחץ **תצוגה מקדימה PDF** להוריד דוגמה עם נתוני מציין מקום.
6. לחץ **שמור שינויים**.

## מתי ה-PDF נוצר

- **בהרשמה מוצלחת** — מצורף למייל ברוכים הבאים.
- **בתשלום** — מצורף לכל מייל קבלת תשלום.
- **ידנית** — עבור לדף פרטי ההרשמה ← "הורד קבלת PDF".

> [!TIP]
> תמיד לחץ **תצוגה מקדימה PDF** לפני שמירת שינויים גדולים. התצוגה מציגה בדיוק מה שלקוחות יראו.

## קבלות רב-לשוניות

כל לקוח מקבל את הקבלה בשפה שבה השתמש בהרשמה. התבנית מזהה אוטומטית: אם הלקוח נרשם בממשק עברית, ה-PDF מרונדר בעברית (RTL); אחרת אנגלית. שתי הגרסאות משתמשות באותו לוגו וצבעים.
$body$);

  -- =============================================================
  -- payments-disputes
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-disputes', 'en', 'Payment Disputes (Chargebacks)',
   'Payments', 55,
   ARRAY['payments-disputes']::text[],
   ARRAY['payments-transactions']::text[],
$body$A dispute (also called a chargeback) is when a customer files a complaint with their card issuer to reverse a charge. The card network (Visa/MC) freezes the money and asks you for evidence.

## When disputes happen

- Customer claims unauthorized transaction (stolen card).
- Customer claims they didn't receive the service.
- Customer claims service wasn't as described.
- Subscription billing disputes ("I canceled but you charged me again").

## Where to see disputes

**Admin → Payments → Disputes**. Each row shows:
- The disputed transaction.
- The dispute reason code (from Stripe).
- The amount at risk (Stripe holds this until resolution).
- The evidence due date (usually 7-21 days).
- Current status: Needs Response / Under Review / Won / Lost.

## Responding to a dispute

1. Click the dispute row → opens detail.
2. Click **Submit Evidence**.
3. Upload supporting documents:
   - Enrollment record (PDF receipt).
   - Course access logs (showing the customer actually used the service).
   - Email correspondence with the customer.
   - Refund policy / terms of service.
4. Add a written explanation.
5. Click **Submit to Stripe**. The evidence goes to the card issuer for review.

> [!WARNING]
> Submit evidence BEFORE the due date. After it passes, Stripe auto-loses the dispute and your money is gone permanently.

## Win / lose outcomes

- **Won** — money returns to your Stripe balance. No further action.
- **Lost** — money goes to the customer permanently. Stripe charges you a $15 dispute fee on top.

## Reducing disputes

- Issue refunds quickly when customers ask politely — much cheaper than a lost dispute.
- Make your refund policy visible on the public enrollment page.
- Set descriptive Stripe statement descriptors (Settings → Stripe) so customers recognize the charge on their bank statement.
$body$),
  ('payments-disputes', 'he', 'מחלוקות תשלום (Chargebacks)',
   'תשלומים', 55,
   ARRAY['payments-disputes']::text[],
   ARRAY['payments-transactions']::text[],
$body$מחלוקת (גם נקראת chargeback) היא כשלקוח מגיש תלונה למנפיק הכרטיס שלו להפוך חיוב. רשת הכרטיסים (Visa/MC) מקפיאה את הכסף ומבקשת ממך ראיות.

## מתי מחלוקות קורות

- הלקוח טוען לעסקה לא מורשית (כרטיס גנוב).
- הלקוח טוען שלא קיבל את השירות.
- הלקוח טוען שהשירות לא היה כפי שתואר.
- מחלוקות חיוב מנוי ("ביטלתי אבל חייבתם אותי שוב").

## איפה לראות מחלוקות

**ניהול ← תשלומים ← מחלוקות**. כל שורה מציגה:
- העסקה השנויה במחלוקת.
- קוד סיבת המחלוקת (מ-Stripe).
- הסכום בסיכון (Stripe מחזיק אותו עד להחלטה).
- תאריך יעד לראיות (בדרך כלל 7-21 ימים).
- סטטוס נוכחי: דורש מענה / בבדיקה / זכית / הפסדת.

## תגובה למחלוקת

1. לחץ על שורת המחלוקת ← פותח פרטים.
2. לחץ **הגש ראיות**.
3. העלה מסמכים תומכים:
   - רשומת הרשמה (קבלת PDF).
   - יומני גישה לקורס (שמראים שהלקוח השתמש בפועל בשירות).
   - התכתבות מייל עם הלקוח.
   - מדיניות החזרים / תנאי שירות.
4. הוסף הסבר כתוב.
5. לחץ **הגש ל-Stripe**. הראיות הולכות למנפיק הכרטיס לבדיקה.

> [!WARNING]
> הגש ראיות לפני תאריך היעד. אחרי שהוא עובר, Stripe מפסיד אוטומטית את המחלוקת והכסף נעלם לצמיתות.

## תוצאות זכייה / הפסד

- **זכית** — הכסף חוזר ליתרת ה-Stripe שלך. אין צורך בפעולה נוספת.
- **הפסדת** — הכסף הולך ללקוח לצמיתות. Stripe גובה ממך עמלת מחלוקת של $15.

## הפחתת מחלוקות

- בצע החזרים במהירות כשלקוחות מבקשים בנימוס — הרבה יותר זול ממחלוקת שאבדה.
- הצג את מדיניות ההחזרים שלך בדף ההרשמה הציבורי.
- הגדר מתאר חשבון Stripe תיאורי (הגדרות ← Stripe) כדי שלקוחות יזהו את החיוב בדף הבנק שלהם.
$body$);

  -- =============================================================
  -- payments-reports
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('payments-reports', 'en', 'Payment Reports',
   'Payments', 56,
   ARRAY['payments-reports']::text[],
   ARRAY['payments-transactions', 'payments-products']::text[],
$body$The Reports page shows aggregated payment data: revenue trends, top products, refund rates, geographic distribution, customer lifetime value.

## Available reports

- **Revenue Overview** — gross/net revenue by month, with trend line.
- **By Product** — which products earn the most.
- **By Payment Plan** — which plans get picked most.
- **Refund Analysis** — refund rate per product, total refunded.
- **Failed Payment Trends** — failed installments + retry success rate.
- **Geographic** — revenue by country (from customer billing addresses).
- **Cohort Analysis** — customer lifetime value by enrollment month.

## Filtering

Most reports have:
- **Date range** picker (preset: last 7/30/90 days, custom range).
- **Product filter** (limit to one or several products).
- **Currency filter** (if you sell in multiple currencies).

## Export

Each report has an **Export CSV** button. Use this for:
- Year-end accounting.
- Sharing with bookkeepers or investors.
- Custom analysis in Excel/Google Sheets.

## Reading the dashboards

- **Sparklines** next to each metric show trend at a glance.
- **Comparison vs previous period** is shown in green/red.
- **Charts are interactive** — hover for tooltips, click legend items to toggle series.

> [!TIP]
> Schedule a recurring report email by clicking **Subscribe to Updates** in the top right. You can get a weekly summary in your inbox.
$body$),
  ('payments-reports', 'he', 'דוחות תשלום',
   'תשלומים', 56,
   ARRAY['payments-reports']::text[],
   ARRAY['payments-transactions', 'payments-products']::text[],
$body$דף הדוחות מציג נתוני תשלום מצטברים: מגמות הכנסה, מוצרים מובילים, שיעורי החזר, פיזור גיאוגרפי, ערך חיים של לקוח.

## דוחות זמינים

- **סקירת הכנסה** — הכנסה ברוטו/נטו לפי חודש, עם קו מגמה.
- **לפי מוצר** — אילו מוצרים מרוויחים יותר.
- **לפי תכנית תשלום** — אילו תכניות נבחרות הכי הרבה.
- **ניתוח החזרים** — שיעור החזרים לכל מוצר, סך הוחזר.
- **מגמות תשלום שנכשל** — תשלומים שנכשלו + שיעור הצלחת ניסיון חוזר.
- **גיאוגרפי** — הכנסה לפי מדינה (מכתובות חיוב הלקוח).
- **ניתוח קוהורט** — ערך חיים של לקוח לפי חודש הרשמה.

## סינון

לרוב הדוחות יש:
- בורר **טווח תאריכים** (קביעה מראש: 7/30/90 ימים אחרונים, טווח מותאם).
- **סנן מוצר** (הגבל למוצר אחד או כמה).
- **סנן מטבע** (אם אתה מוכר במספר מטבעות).

## ייצוא

לכל דוח יש כפתור **ייצא CSV**. השתמש בזה ל:
- חשבונאות סוף שנה.
- שיתוף עם רואי חשבון או משקיעים.
- ניתוח מותאם ב-Excel/Google Sheets.

## קריאת לוחות הבקרה

- **Sparklines** ליד כל מדד מציגים מגמה במבט חטוף.
- **השוואה לתקופה הקודמת** מוצגת בירוק/אדום.
- **התרשימים אינטראקטיביים** — רחף לכלי עזר, לחץ על פריטי מקרא להחלפת סדרות.

> [!TIP]
> תזמן מייל דוח חוזר על ידי לחיצה על **הירשם לעדכונים** ימין למעלה. אתה יכול לקבל סיכום שבועי בתיבת הדואר שלך.
$body$);

  RAISE NOTICE 'Help articles seed (file 5/6): Sales/Payments — 7 articles × 2 locales = 14 rows.';
END $$;
