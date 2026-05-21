-- Comprehensive help seed — File 2 of 6: Team + Integrations.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'users-and-roles',
    'invite-team',
    'audit-log',
    'integrations-overview',
    'integrations-stripe',
    'integrations-keap',
    'integrations-zoom'
  );

  -- =============================================================
  -- users-and-roles
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('users-and-roles', 'en', 'Users & Roles',
   'Team', 10,
   ARRAY['settings-users']::text[],
   ARRAY['invite-team', 'audit-log', 'settings-overview']::text[],
$body$Every person who can log into your platform is a `user`. Their role determines what they can see and do.

## Roles in order of privilege
- **Super Admin** — global access across all tenants. Reserved for platform owners.
- **Admin** — full access within their tenant. Can change settings, manage users, create courses, see payments, refund.
- **Instructor** — can teach courses they're assigned to: edit lesson content, take attendance, enter grades. Cannot see payments or other instructors' courses.
- **Student** — sees only their own enrolled courses, grades, attendance, payments, and profile.

## User status (separate from role)
- **Active** — can log in, receives emails normally.
- **Inactive** — can log in but receives no emails or notifications. Use for users on leave.
- **Suspended** — cannot log in. Login attempts show "your account is suspended". The audit trail and historical data stay intact.
- **Invited** — invitation sent, account not yet accepted.

## When to suspend vs delete
- **Suspend** (recommended) — preserves all historical records (enrollments, grades, payments). Reversible.
- **Delete** — destructive. Breaks foreign keys in historical records. Only do this if you've never used the user record for anything.

## Common operations
- **Change role** — edit user → role dropdown → save.
- **Reset password** — opens an admin-initiated password reset.
- **Course access** — link to per-user course access management (see User Access).
- **Send invitation again** — re-send to a user with status "Invited".
$body$),
  ('users-and-roles', 'he', 'משתמשים והרשאות',
   'צוות', 10,
   ARRAY['settings-users']::text[],
   ARRAY['invite-team', 'audit-log', 'settings-overview']::text[],
$body$כל אדם שיכול להתחבר לפלטפורמה הוא `משתמש`. התפקיד שלו קובע מה הוא יכול לראות ולעשות.

## תפקידים לפי סדר הרשאות
- **מנהל-על** — גישה גלובלית לכל הארגונים. שמור לבעלי הפלטפורמה.
- **מנהל** — גישה מלאה בארגון שלו. יכול לשנות הגדרות, לנהל משתמשים, ליצור קורסים, לראות תשלומים, לבצע החזרים.
- **מרצה** — יכול ללמד קורסים שהוקצו לו: עריכת תוכן שיעור, נטילת נוכחות, הזנת ציונים. לא יכול לראות תשלומים או קורסים של מרצים אחרים.
- **סטודנט** — רואה רק את הקורסים, הציונים, הנוכחות, התשלומים והפרופיל שלו.

## סטטוס משתמש (נפרד מתפקיד)
- **פעיל** — יכול להתחבר, מקבל מיילים כרגיל.
- **לא פעיל** — יכול להתחבר אך לא מקבל מיילים או התראות. השתמש למשתמשים בחופשה.
- **מושעה** — לא יכול להתחבר. ניסיונות התחברות מציגים "החשבון שלך הושעה". לוג הביקורת והנתונים ההיסטוריים נשמרים.
- **מוזמן** — הזמנה נשלחה, החשבון טרם התקבל.

## מתי להשעות לעומת למחוק
- **השעיה** (מומלץ) — שומר את כל הרשומות ההיסטוריות (הרשמות, ציונים, תשלומים). הפיך.
- **מחיקה** — הרסני. שובר מפתחות זרים ברשומות היסטוריות. עשה זאת רק אם המשתמש לא שימש לדבר.

## פעולות נפוצות
- **שינוי תפקיד** — ערוך משתמש ← תפריט נפתח של תפקיד ← שמור.
- **איפוס סיסמה** — פותח איפוס סיסמה ביוזמת המנהל.
- **גישה לקורס** — קישור לניהול גישה לקורס לכל משתמש (ראה גישת משתמש).
- **שלח הזמנה שוב** — שלח שוב למשתמש בסטטוס "מוזמן".
$body$);

  -- =============================================================
  -- invite-team
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('invite-team', 'en', 'Invite Team Members',
   'Team', 11,
   ARRAY['invite-user']::text[],
   ARRAY['users-and-roles', 'settings-overview']::text[],
$body$Inviting an admin, instructor, or other team member sends them an email with a one-click signup link.

## Step by step

1. Go to **Settings → Users**.
2. Click **Invite User** (top right).
3. Fill in:
   - **Email** — they'll receive the invitation here.
   - **First name / Last name** — pre-fills their profile.
   - **Role** — pick Admin, Instructor, or Student.
4. Click **Send Invitation**.

## What happens next
- The user receives an email with a signup link valid for 7 days.
- They click the link, set a password, and land on their dashboard with their assigned role.
- If the email already has an account on another tenant, the invitation links their existing user to yours (single user, multi-tenant).

## Tracking pending invitations
On the Users page, filter by status **Invited** to see who hasn't accepted. Each row has:
- **Resend invitation** — sends the email again.
- **Cancel invitation** — withdraws it. The user won't be able to use the link.

## Common pitfalls
- **Email lands in spam** — ensure your sending domain is set up in your email integration (Brevo/SMTP).
- **User says link expired** — the link is valid 7 days. Resend the invitation.
- **Wrong role** — change it after acceptance via Edit User → Role.

## Bulk inviting
For more than 10 users, paste their emails into the Bulk Invite tool (one per line). Same fields, but one form to fill out.
$body$),
  ('invite-team', 'he', 'הזמנת חברי צוות',
   'צוות', 11,
   ARRAY['invite-user']::text[],
   ARRAY['users-and-roles', 'settings-overview']::text[],
$body$הזמנת מנהל, מרצה, או חבר צוות אחר שולחת לו מייל עם קישור הרשמה בלחיצה אחת.

## שלב אחר שלב

1. עבור ל**הגדרות ← משתמשים**.
2. לחץ **הזמן משתמש** (פינה עליונה).
3. מלא:
   - **מייל** — הוא יקבל את ההזמנה לכאן.
   - **שם פרטי / שם משפחה** — ממלא מראש את הפרופיל שלו.
   - **תפקיד** — בחר מנהל, מרצה או סטודנט.
4. לחץ **שלח הזמנה**.

## מה קורה לאחר מכן
- המשתמש מקבל מייל עם קישור הרשמה תקף 7 ימים.
- הוא לוחץ על הקישור, מגדיר סיסמה, ומגיע ללוח הבקרה עם התפקיד שהוקצה לו.
- אם המייל כבר רשום בארגון אחר, ההזמנה מקשרת את המשתמש הקיים שלו לארגון שלך (משתמש אחד, ריבוי ארגונים).

## מעקב אחר הזמנות ממתינות
בדף המשתמשים, סנן לפי סטטוס **מוזמן** כדי לראות מי לא קיבל. כל שורה כוללת:
- **שלח הזמנה שוב** — שולח את המייל שוב.
- **בטל הזמנה** — מבטל אותה. המשתמש לא יוכל להשתמש בקישור.

## טעויות נפוצות
- **המייל מגיע לספאם** — ודא שדומיין השליחה שלך מוגדר בשילוב המייל (Brevo/SMTP).
- **משתמש מדווח על קישור שפג תוקף** — הקישור תקף 7 ימים. שלח הזמנה מחדש.
- **תפקיד שגוי** — שנה אחרי קבלה דרך ערוך משתמש ← תפקיד.

## הזמנה בכמות
ליותר מ-10 משתמשים, הדבק את כתובות המייל שלהם בכלי ההזמנה בכמות (אחת לשורה). אותם שדות, אך טופס אחד למלא.
$body$);

  -- =============================================================
  -- audit-log
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('audit-log', 'en', 'Audit Log',
   'Team', 12,
   ARRAY['audit']::text[],
   ARRAY['users-and-roles']::text[],
$body$The audit log records every meaningful change made by an admin or system process: who did what, to which record, when, and from which IP.

## What gets logged
- User created, updated, role-changed, suspended.
- Course/product/program created, edited, deleted, published.
- Payment refunded.
- Enrollment created, cancelled.
- Settings changed.
- Failed login attempts (security).

## What does NOT get logged
- Page views or reads (intentionally — read events would flood the log).
- Translation key edits (low-risk, audited via DB updated_at).

## How to read an entry
Each row shows:
- **Time** — when it happened (your timezone).
- **User** — who did it (or "System" for cron-driven events).
- **Action** — readable summary (e.g., "Updated Course 'Intro to React'").
- **Resource** — what was affected.
- **Risk level** — Low / Medium / High based on the kind of change.

Click the expand chevron to see the full **before/after** field-by-field diff (only for UPDATE events).

## Filtering
Filters at the top let you narrow by:
- Date range
- User
- Action type (Create / Update / Delete)
- Resource type
- Risk level

Combine filters to investigate a specific incident.

## Retention
Audit events are retained indefinitely. The table grows over time but is indexed for fast querying. No action needed.
$body$),
  ('audit-log', 'he', 'לוג ביקורת',
   'צוות', 12,
   ARRAY['audit']::text[],
   ARRAY['users-and-roles']::text[],
$body$לוג הביקורת מתעד כל שינוי משמעותי שנעשה על ידי מנהל או תהליך מערכת: מי עשה מה, לאיזו רשומה, מתי, ומאיזו כתובת IP.

## מה מתועד
- משתמש נוצר, עודכן, שונה תפקיד, הושעה.
- קורס/מוצר/תכנית נוצר, נערך, נמחק, פורסם.
- תשלום הוחזר.
- הרשמה נוצרה, בוטלה.
- הגדרות שונו.
- ניסיונות התחברות שנכשלו (אבטחה).

## מה לא מתועד
- צפיות בדפים או קריאות (במכוון — אירועי קריאה היו מציפים את הלוג).
- עריכות מפתח תרגום (סיכון נמוך, נסקר דרך updated_at של DB).

## איך לקרוא רשומה
כל שורה מציגה:
- **זמן** — מתי זה קרה (אזור הזמן שלך).
- **משתמש** — מי עשה זאת (או "מערכת" לאירועים מונעי-cron).
- **פעולה** — סיכום קריא (למשל "עודכן קורס 'מבוא ל-React'").
- **משאב** — מה הושפע.
- **רמת סיכון** — נמוך / בינוני / גבוה בהתאם לסוג השינוי.

לחץ על חץ ההרחבה לראות את הdiff המלא של **לפני/אחרי** שדה אחר שדה (רק לאירועי UPDATE).

## סינון
הסננים בראש מאפשרים לצמצם לפי:
- טווח תאריכים
- משתמש
- סוג פעולה (יצירה / עדכון / מחיקה)
- סוג משאב
- רמת סיכון

שלב סננים כדי לחקור אירוע ספציפי.

## שמירה
אירועי ביקורת נשמרים לצמיתות. הטבלה גדלה עם הזמן אך מסודרת באינדקס לשאילתות מהירות. אין צורך בפעולה.
$body$);

  -- =============================================================
  -- integrations-overview
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('integrations-overview', 'en', 'Integrations Overview',
   'Integrations', 20,
   ARRAY['integrations']::text[],
   ARRAY['integrations-stripe', 'integrations-keap', 'integrations-zoom', 'settings-overview', 'first-time-setup']::text[],
$body$Integrations let your platform talk to external services for payments, email, video, CRM, e-signature, and SMS.

## Where they live
**Admin → Integrations** (or **Config → Integrations** depending on your sidebar config). All integrations are on one page with a tab per service.

## Each integration card has
- **Status badge** — Connected / Disconnected / Error.
- **Enable/Disable toggle** — turn the integration on/off without deleting credentials.
- **Credentials section** — API keys, OAuth tokens. Visibility toggle to show/hide secrets.
- **Settings section** — service-specific options (e.g., default Stripe currency).
- **Test Connection** — verifies credentials work.
- **Save Configuration** — persist changes.

## Available integrations
- **Stripe** — payments. **Required** for collecting any money.
- **Email (Brevo or SMTP)** — transactional emails. **Required** for password resets, receipts, etc.
- **Keap (Infusionsoft)** — CRM, tag automation, marketing campaigns.
- **Zoom** — auto-create meeting links per lesson, instructor bridge link.
- **DocuSign** — enrollment contract signing.
- **Twilio** — SMS notifications, WhatsApp.
- **SendGrid** — alternate email provider.

## Authentication patterns
- **API key** (Stripe, SendGrid, Twilio, Brevo) — paste a long secret, save.
- **OAuth** (Keap) — click "Authorize" → redirect → approve → tokens saved automatically.
- **JWT grant** (DocuSign) — paste private key + IDs. Requires one-time consent from a DocuSign admin URL.
- **Server-to-server** (Zoom) — paste client ID/secret + account ID.

## Health check
After saving, always click **Test Connection**. A green check means credentials work; red means something's wrong (usually wrong key or insufficient permissions on the third-party side).
$body$),
  ('integrations-overview', 'he', 'סקירת שילובים',
   'שילובים', 20,
   ARRAY['integrations']::text[],
   ARRAY['integrations-stripe', 'integrations-keap', 'integrations-zoom', 'settings-overview', 'first-time-setup']::text[],
$body$שילובים מאפשרים לפלטפורמה לדבר עם שירותים חיצוניים לתשלומים, מייל, וידאו, CRM, חתימה אלקטרונית ו-SMS.

## איפה הם נמצאים
**ניהול ← שילובים** (או **קונפיגורציה ← שילובים** בהתאם להגדרת סרגל הצד). כל השילובים בדף אחד עם לשונית לכל שירות.

## לכל כרטיס שילוב יש
- **תג סטטוס** — מחובר / מנותק / שגיאה.
- **מתג הפעלה/כיבוי** — הפעל/כבה את השילוב ללא מחיקת אישורים.
- **קטע אישורים** — מפתחות API, טוקני OAuth. מתג נראות להצגה/הסתרה של סודות.
- **קטע הגדרות** — אפשרויות ספציפיות לשירות.
- **בדוק חיבור** — מאמת שהאישורים עובדים.
- **שמור תצורה** — שומר שינויים.

## שילובים זמינים
- **Stripe** — תשלומים. **נדרש** לגביית כסף.
- **מייל (Brevo או SMTP)** — מיילים טרנזקציוניים. **נדרש** לאיפוס סיסמאות, קבלות וכו'.
- **Keap (Infusionsoft)** — CRM, אוטומציית תגיות, קמפיינים שיווקיים.
- **Zoom** — יצירת קישורי פגישה אוטומטית לכל שיעור, קישור גשר למרצה.
- **DocuSign** — חתימת חוזה הרשמה.
- **Twilio** — התראות SMS, WhatsApp.
- **SendGrid** — ספק מייל חלופי.

## דפוסי אימות
- **מפתח API** (Stripe, SendGrid, Twilio, Brevo) — הדבק סוד ארוך, שמור.
- **OAuth** (Keap) — לחץ "אישור" ← הפניה ← אשר ← טוקנים נשמרים אוטומטית.
- **JWT grant** (DocuSign) — הדבק מפתח פרטי + מזהים. דורש הסכמה חד-פעמית מ-URL של מנהל DocuSign.
- **שרת לשרת** (Zoom) — הדבק client ID/secret + מזהה חשבון.

## בדיקת בריאות
אחרי השמירה, תמיד לחץ **בדוק חיבור**. סימן ירוק אומר שאישורים עובדים; אדום אומר שמשהו לא בסדר (בדרך כלל מפתח שגוי או הרשאות לא מספיקות בצד שלישי).
$body$);

  -- =============================================================
  -- integrations-stripe
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('integrations-stripe', 'en', 'Connect Stripe',
   'Integrations', 21,
   ARRAY['integrations-stripe']::text[],
   ARRAY['integrations-overview', 'payments-products', 'payments-transactions']::text[],
$body$Stripe handles every payment on the platform. Without Stripe connected, you cannot sell anything.

## Before you start
You need a Stripe account. Sign up at stripe.com (it's free; they only charge per transaction). Complete Stripe's identity verification before going live — your account starts in "test mode" only.

## Step by step

1. In Stripe Dashboard → **Developers → API keys**, copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`) — click "Reveal" to see it.
2. In IPSPlatform → **Admin → Integrations → Stripe**, paste both:
   - **Publishable Key** → into "Publishable Key" field.
   - **Secret Key** → into "Secret Key" field.
3. Click **Save Configuration**.
4. Click **Test Connection**. Green check = ready.

## Webhook setup (required for installments and refunds)
Stripe pushes events to your platform via a webhook. Without this, installment payments and refund tracking won't update automatically.

1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**: `https://<your-domain>/api/webhooks/stripe`
3. **Events to send**: pick `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `charge.refunded`, `customer.subscription.deleted`.
4. Click **Add endpoint**. Copy the **Signing secret** (starts with `whsec_`).
5. Back in IPSPlatform → Integrations → Stripe → **Webhook Signing Secret** → paste it. Save.

## Test mode vs live mode
The keys starting with `pk_test_` / `sk_test_` route to Stripe's test environment. Use test card `4242 4242 4242 4242` to simulate purchases. When ready, swap to `pk_live_` / `sk_live_` keys.

## Common pitfalls
- **Wrong currency** — Stripe accounts have a fixed currency. If yours is USD but you sell in ILS, you'll need a separate Stripe account or enable multi-currency processing in Stripe.
- **"Invalid API Key"** — copy fresh keys; the older ones may have been rotated.
- **Webhook signing mismatch** — every Stripe webhook endpoint has a different signing secret. Make sure you're using the one from the endpoint pointing at your platform.
$body$),
  ('integrations-stripe', 'he', 'חיבור Stripe',
   'שילובים', 21,
   ARRAY['integrations-stripe']::text[],
   ARRAY['integrations-overview', 'payments-products', 'payments-transactions']::text[],
$body$Stripe מטפל בכל תשלום בפלטפורמה. ללא חיבור Stripe, לא ניתן למכור דבר.

## לפני שמתחילים
דרוש לך חשבון Stripe. הירשם ב-stripe.com (חינם; הם גובים רק לפי עסקה). השלם את אימות הזהות ב-Stripe לפני שאתה עולה לאוויר — החשבון שלך מתחיל ב"מצב בדיקה" בלבד.

## שלב אחר שלב

1. ב-Stripe Dashboard ← **Developers → API keys**, העתק:
   - **Publishable key** (מתחיל ב-`pk_`)
   - **Secret key** (מתחיל ב-`sk_`) — לחץ "Reveal" כדי לראות.
2. ב-IPSPlatform ← **ניהול ← שילובים ← Stripe**, הדבק את שניהם:
   - **Publishable Key** → לשדה "Publishable Key".
   - **Secret Key** → לשדה "Secret Key".
3. לחץ **שמור תצורה**.
4. לחץ **בדוק חיבור**. סימן ירוק = מוכן.

## הגדרת Webhook (נדרש לתשלומים מרובים והחזרים)
Stripe דוחף אירועים לפלטפורמה דרך webhook. ללא זה, תשלומים מרובים ומעקב החזרים לא יעודכנו אוטומטית.

1. ב-Stripe Dashboard ← **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**: `https://<your-domain>/api/webhooks/stripe`
3. **Events to send**: בחר `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `charge.refunded`, `customer.subscription.deleted`.
4. לחץ **Add endpoint**. העתק את ה-**Signing secret** (מתחיל ב-`whsec_`).
5. חזרה ב-IPSPlatform ← שילובים ← Stripe ← **Webhook Signing Secret** ← הדבק אותו. שמור.

## מצב בדיקה לעומת מצב חי
המפתחות המתחילים ב-`pk_test_` / `sk_test_` מנתבים לסביבת הבדיקה של Stripe. השתמש בכרטיס בדיקה `4242 4242 4242 4242` לסימולציית רכישות. כשמוכן, החלף למפתחות `pk_live_` / `sk_live_`.

## טעויות נפוצות
- **מטבע שגוי** — לחשבונות Stripe יש מטבע קבוע. אם שלך USD אבל אתה מוכר ב-ILS, תזדקק לחשבון Stripe נפרד או להפעיל עיבוד רב-מטבעי ב-Stripe.
- **"Invalid API Key"** — העתק מפתחות טריים; הישנים אולי הוחלפו.
- **חוסר התאמת חתימת webhook** — לכל endpoint של Stripe webhook יש signing secret שונה. ודא שאתה משתמש בזה של ה-endpoint המכוון לפלטפורמה שלך.
$body$);

  -- =============================================================
  -- integrations-keap
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('integrations-keap', 'en', 'Connect Keap',
   'Integrations', 22,
   ARRAY['integrations-keap']::text[],
   ARRAY['integrations-overview', 'crm-tags', 'payments-products']::text[],
$body$Keap (formerly Infusionsoft) is a CRM. Connecting it lets the platform automatically apply tags to a Keap contact when a student enrolls, triggering whichever Keap campaign you have configured to listen for that tag.

## What this enables
- **On enrollment**: the buyer's email is added to your Keap database (if not already there) and tagged.
- **In product editor**: pick from your live Keap tag list when configuring which tags fire on purchase.
- **Marketing automation**: Keap campaigns drive welcome emails, follow-up sequences, etc. — fully outside this platform.

## Step by step (one-time setup)

1. In Keap → **Developer settings**, create a new app:
   - Name: "IPSPlatform"
   - Allowed redirect URI: `https://<your-platform-domain>/admin/config/integrations`
   - Scopes: select "full".
2. Keap shows your new **Client ID** and **Client Secret** — copy both.
3. In IPSPlatform → **Admin → Integrations → Keap**:
   - Paste **Client ID** and **Client Secret**.
   - Click **Save Configuration**.
4. Click **Authorize with Keap**. You'll be redirected to Keap, sign in, approve.
5. You'll be sent back; a success toast confirms tokens are saved.

## Tokens are rotating
Keap uses OAuth with **single-use refresh tokens**. Every time the platform refreshes, it consumes the old token and gets a new one. If a refresh ever fails (network glitch, etc.), you'll see "Invalid Refresh Token" — just click **Authorize with Keap** again to mint new tokens. Your existing contacts and tags are preserved.

## Applying tags to enrollments
1. Open any product → **CRM Tags** tab.
2. Search for your Keap tag(s) — the list is pulled live from Keap.
3. Tick the ones to apply when someone enrolls in this product.
4. Save.

When a student completes enrollment, the platform calls Keap's API to apply those tags. The contact in Keap is identified by email.
$body$),
  ('integrations-keap', 'he', 'חיבור Keap',
   'שילובים', 22,
   ARRAY['integrations-keap']::text[],
   ARRAY['integrations-overview', 'crm-tags', 'payments-products']::text[],
$body$Keap (לשעבר Infusionsoft) הוא CRM. חיבור שלו מאפשר לפלטפורמה להחיל אוטומטית תגיות על איש קשר ב-Keap כשסטודנט נרשם, מה שמפעיל קמפיין Keap שמוגדר להאזין לתגית.

## מה זה מאפשר
- **בהרשמה**: המייל של הרוכש מתווסף ל-Keap (אם עדיין לא שם) ומקבל תגית.
- **בעורך מוצר**: בחר מרשימת תגיות Keap החיה בעת הגדרת אילו תגיות מופעלות ברכישה.
- **אוטומציית שיווק**: קמפיינים ב-Keap מניעים מיילי ברוכים הבאים, רצפי מעקב וכו' — לחלוטין מחוץ לפלטפורמה.

## שלב אחר שלב (הגדרה חד-פעמית)

1. ב-Keap ← **Developer settings**, צור אפליקציה חדשה:
   - שם: "IPSPlatform"
   - Allowed redirect URI: `https://<your-platform-domain>/admin/config/integrations`
   - Scopes: בחר "full".
2. Keap מציג את **Client ID** ו-**Client Secret** החדשים — העתק את שניהם.
3. ב-IPSPlatform ← **ניהול ← שילובים ← Keap**:
   - הדבק **Client ID** ו-**Client Secret**.
   - לחץ **שמור תצורה**.
4. לחץ **אישור גישה ל-Keap**. תופנה ל-Keap, התחבר, אשר.
5. תוחזר; הודעת הצלחה מאשרת שטוקנים נשמרו.

## טוקנים מתחלפים
Keap משתמשת ב-OAuth עם **טוקני רענון חד-פעמיים**. בכל פעם שהפלטפורמה מרעננת, היא צורכת את הטוקן הישן ומקבלת חדש. אם רענון נכשל (תקלת רשת וכו'), תראה "טוקן רענון לא תקין" — פשוט לחץ **אישור גישה ל-Keap** שוב כדי להנפיק טוקנים חדשים. אנשי הקשר והתגיות הקיימים שלך נשמרים.

## החלת תגיות על הרשמות
1. פתח מוצר ← לשונית **תגיות CRM**.
2. חפש את תגיות ה-Keap שלך — הרשימה נשלפת חיה מ-Keap.
3. סמן את אלה להחיל כשמישהו נרשם למוצר זה.
4. שמור.

כשסטודנט משלים הרשמה, הפלטפורמה קוראת ל-API של Keap להחיל את התגיות. איש הקשר ב-Keap מזוהה לפי מייל.
$body$);

  -- =============================================================
  -- integrations-zoom
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('integrations-zoom', 'en', 'Connect Zoom',
   'Integrations', 23,
   ARRAY['integrations-zoom']::text[],
   ARRAY['integrations-overview', 'lms-modules-lessons']::text[],
$body$Zoom integration lets you attach a Zoom meeting to any lesson. Students see a "Join meeting" button at the right time; the instructor gets a permanent "bridge" link that auto-routes to whichever meeting is currently active.

## What you'll need from Zoom
A **Server-to-Server OAuth app** (not a user OAuth app). Create it at: marketplace.zoom.us → Build app → Server-to-Server OAuth.

You need three values:
- **Account ID**
- **Client ID**
- **Client Secret**

## Step by step

1. In Zoom Marketplace → your S2S app → **App credentials** tab. Copy Account ID, Client ID, Client Secret.
2. In Zoom → **Scopes** tab, add at minimum:
   - `meeting:write:meeting:admin`
   - `meeting:read:meeting:admin`
   - `user:read:user:admin`
3. **Activate** the app.
4. In IPSPlatform → **Admin → Integrations → Zoom**:
   - Paste Account ID, Client ID, Client Secret.
   - Click **Save Configuration**.
5. Click **Test Connection**. Green = ready.

## Attaching Zoom to a lesson
1. Open a course → drill into a lesson.
2. Add a Topic of type **Zoom Meeting**.
3. Pick a meeting (existing or create new from this dialog).
4. Save. Students enrolled in the course will see the Join button at lesson time.

## Instructor bridge link
On the course detail page there's an **Instructor Access** card. Click "Create bridge link" to generate a permanent URL the instructor can bookmark. Clicking the bridge link auto-routes them to whichever lesson's Zoom meeting is currently active (with a configurable grace period). One link, all their lessons.

## No Zoom account?
You can still teach lessons — just use a generic video link (Topic type: "External Link") and paste a Google Meet / Teams URL.
$body$),
  ('integrations-zoom', 'he', 'חיבור Zoom',
   'שילובים', 23,
   ARRAY['integrations-zoom']::text[],
   ARRAY['integrations-overview', 'lms-modules-lessons']::text[],
$body$שילוב Zoom מאפשר לצרף פגישת Zoom לכל שיעור. סטודנטים רואים כפתור "הצטרף לפגישה" בזמן הנכון; המרצה מקבל קישור "גשר" קבוע שמפנה אוטומטית לפגישה הפעילה.

## מה תזדקק מ-Zoom
**אפליקציית Server-to-Server OAuth** (לא אפליקציית OAuth של משתמש). צור אותה ב: marketplace.zoom.us ← Build app ← Server-to-Server OAuth.

תזדקק לשלושה ערכים:
- **Account ID**
- **Client ID**
- **Client Secret**

## שלב אחר שלב

1. ב-Zoom Marketplace ← אפליקציית ה-S2S שלך ← לשונית **App credentials**. העתק Account ID, Client ID, Client Secret.
2. ב-Zoom ← לשונית **Scopes**, הוסף לפחות:
   - `meeting:write:meeting:admin`
   - `meeting:read:meeting:admin`
   - `user:read:user:admin`
3. **הפעל** את האפליקציה.
4. ב-IPSPlatform ← **ניהול ← שילובים ← Zoom**:
   - הדבק Account ID, Client ID, Client Secret.
   - לחץ **שמור תצורה**.
5. לחץ **בדוק חיבור**. ירוק = מוכן.

## צירוף Zoom לשיעור
1. פתח קורס ← קדח לשיעור.
2. הוסף נושא מסוג **Zoom Meeting**.
3. בחר פגישה (קיימת או צור חדשה מתוך דיאלוג זה).
4. שמור. סטודנטים רשומים לקורס יראו את כפתור ההצטרפות בזמן השיעור.

## קישור גשר למרצה
בדף פרטי הקורס יש כרטיס **גישת מרצה**. לחץ "צור קישור גשר" כדי ליצור URL קבוע שהמרצה יכול לסמן. לחיצה על קישור הגשר מפנה אותו אוטומטית לפגישת Zoom של השיעור הפעיל (עם תקופת חסד ניתנת להגדרה). קישור אחד, כל השיעורים שלו.

## אין חשבון Zoom?
עדיין ניתן ללמד שיעורים — פשוט השתמש בקישור וידאו גנרי (סוג נושא: "External Link") והדבק URL של Google Meet / Teams.
$body$);

  RAISE NOTICE 'Help articles seed (file 2/6): Team + Integrations — 7 articles × 2 locales = 14 rows.';
END $$;
