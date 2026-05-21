-- Comprehensive help seed — File 8: setup-sequence flagship + dependency wiring.
--
-- Adds one new flagship article (`setup-sequence`) that lays out the whole
-- platform's setup as a dependency graph, and back-fills `prerequisites` /
-- `next_steps` on key existing articles so the drawer can render
-- "do this first" / "do this next" cards above and below each body.

DO $$
BEGIN
  -- =============================================================
  -- New: setup-sequence (the dependency map for the whole platform)
  -- =============================================================
  DELETE FROM public.help_articles WHERE slug = 'setup-sequence';

  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs,
     prerequisites, next_steps,
     related_slugs, body_markdown)
  VALUES
  ('setup-sequence', 'en', 'Setup Sequence (Dependency Map)',
   'Getting Started', 2,
   ARRAY[]::text[],
   ARRAY['welcome']::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
$body$Each feature depends on something else being set up first. Follow this graph top-to-bottom — every step assumes the steps above it are done.

## Phase 1 — Identity (no dependencies)

```
Settings → Organization     name, address, currency, timezone, logo
        ↓ (every other feature uses these defaults)
Settings → Theme            primary color, fonts, light/dark
Config → Languages          enable EN / HE / other (drives every locale-aware label)
```

> [!NOTE]
> Skip this and currency, timezone, and language defaults will be wrong everywhere. Always do Phase 1 first.

## Phase 2 — Money plumbing (depends on Phase 1)

```
Integrations → Stripe       paste keys → Test Connection → green
        ↓
Integrations → Email        Brevo or SMTP → Test Connection → green
        ↓
Payments → PDF Template     receipt branding
```

Without Stripe you can't take any money. Without Email you can't deliver a single receipt or password reset.

## Phase 3 — Optional integrations (parallel, any order)

```
Integrations → Keap (CRM)      enables product → CRM tag flow
Integrations → Zoom            enables Zoom topics on lessons
Integrations → DocuSign        enables enrollment contracts
Integrations → Twilio          enables SMS notifications
```

## Phase 4 — Team (depends on Phase 1)

```
Settings → Users → Invite User    admins + instructors
        ↓
(instructors are needed when you assign them to courses in Phase 6)
```

## Phase 5 — Grading framework (one-time, tenant-wide)

```
Grading → Scales                       e.g., "Standard A-F"
        ↓
Open the scale → add Grade Ranges      90-100=A, 80-89=B, …, mark "Passing"
        ↓
(every course's grading inherits this scale)
```

## Phase 6 — LMS / Course content (depends on Phase 5)

```
LMS → Courses → Create Course
        ↓
Pick a Grading Scale (from Phase 5)
Pick an Instructor (from Phase 4)
        ↓
Add Modules → add Lessons → add Topics (video / PDF / text / Zoom / quiz)
        ↓
(optional) Grading → Categories → Items   weighted grade structure for THIS course
```

## Phase 7 — Sales (depends on Phases 2, 5, 6)

```
Payments → Plans → Create Plan         Full Payment / Deposit+Installments / Subscription
        ↓
Payments → Products → Create Product   Link a Course (Phase 6) + Payment Plan (above)
        ↓
Publish the product
        ↓
Share the public URL (`/enroll/<slug>`) with marketing
```

## Phase 8 — Communications (depends on Phase 2)

```
Emails → Templates              edit Welcome, Receipt, Reminder, …
        ↓
Emails → Triggers               when each template fires (immediately / N min delay)
        ↓
Emails → Queue (monitor only)   verify cron is draining the queue
```

## Phase 9 — Operating (after enrollments start coming in)

```
Enrollments → list                 incoming students
        ↓
Payments → Transactions           track / refund / dispute
        ↓
Grading → Gradebook (per course)  enter scores as work comes in
        ↓
LMS → Attendance (per course)     mark presence per lesson
```

## How to use this map in the drawer

Every article in this manual has **Prerequisites** (cards at the top) and **What's next** (cards at the bottom). They mirror the arrows above. If you're ever lost, open this article — it's the single map covering the whole platform.
$body$),
  ('setup-sequence', 'he', 'רצף ההגדרה (מפת תלויות)',
   'התחלה', 2,
   ARRAY[]::text[],
   ARRAY['welcome']::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
   ARRAY['first-time-setup', 'admin-overview']::text[],
$body$כל תכונה תלויה במשהו אחר שכבר הוגדר. עקוב אחרי הגרף מלמעלה למטה — כל שלב מניח שהשלבים מעליו כבר נעשו.

## שלב 1 — זהות (ללא תלויות)

```
הגדרות ← ארגון              שם, כתובת, מטבע, אזור זמן, לוגו
        ↓ (כל תכונה אחרת משתמשת בברירות המחדל האלה)
הגדרות ← ערכת נושא          צבע ראשי, גופנים, בהיר/כהה
קונפיגורציה ← שפות          הפעל EN / HE / אחר (מניע כל תווית מודעת-לוקאל)
```

> [!NOTE]
> דלג על זה ומטבע, אזור זמן וברירות מחדל של שפה יהיו שגויים בכל מקום. תמיד עשה שלב 1 ראשון.

## שלב 2 — תשתית כספית (תלוי בשלב 1)

```
שילובים ← Stripe            הדבק מפתחות ← בדוק חיבור ← ירוק
        ↓
שילובים ← מייל              Brevo או SMTP ← בדוק חיבור ← ירוק
        ↓
תשלומים ← תבנית PDF         מיתוג קבלה
```

ללא Stripe לא תוכל לקבל כסף. ללא מייל לא תוכל למסור אפילו קבלה או איפוס סיסמה.

## שלב 3 — שילובים אופציונליים (במקביל, בכל סדר)

```
שילובים ← Keap (CRM)         מאפשר זרימת תגיות מוצר → CRM
שילובים ← Zoom               מאפשר נושאי Zoom בשיעורים
שילובים ← DocuSign           מאפשר חוזי הרשמה
שילובים ← Twilio             מאפשר התראות SMS
```

## שלב 4 — צוות (תלוי בשלב 1)

```
הגדרות ← משתמשים ← הזמן משתמש    מנהלים + מרצים
        ↓
(מרצים נדרשים כשמקצים אותם לקורסים בשלב 6)
```

## שלב 5 — מסגרת ציונים (חד-פעמי, לכל הארגון)

```
ציונים ← סקלות                       למשל "A-F סטנדרטי"
        ↓
פתח את הסקלה ← הוסף טווחי ציון       90-100=A, 80-89=B, …, סמן "עובר"
        ↓
(ציונים של כל קורס יורשים את הסקלה הזו)
```

## שלב 6 — תוכן LMS / קורסים (תלוי בשלב 5)

```
מערכת לימוד ← קורסים ← צור קורס
        ↓
בחר סקלת ציונים (משלב 5)
בחר מרצה (משלב 4)
        ↓
הוסף מודולים ← הוסף שיעורים ← הוסף נושאים (וידאו / PDF / טקסט / Zoom / חידון)
        ↓
(אופציונלי) ציונים ← קטגוריות ← פריטים    מבנה ציון משוקלל לקורס הזה
```

## שלב 7 — מכירות (תלוי בשלבים 2, 5, 6)

```
תשלומים ← תכניות ← צור תכנית         תשלום מלא / מקדמה+תשלומים / מנוי
        ↓
תשלומים ← מוצרים ← צור מוצר          קשר קורס (שלב 6) + תכנית תשלום (לעיל)
        ↓
פרסם את המוצר
        ↓
שתף את ה-URL הציבורי (`/enroll/<slug>`) בשיווק
```

## שלב 8 — תקשורת (תלוי בשלב 2)

```
מיילים ← תבניות                  ערוך ברוכים הבאים, קבלה, תזכורת, …
        ↓
מיילים ← טריגרים                 מתי כל תבנית מופעלת (מיידי / השהיה N דקות)
        ↓
מיילים ← תור (ניטור בלבד)        ודא ש-cron מרוקן את התור
```

## שלב 9 — תפעול (אחרי שהרשמות מתחילות להגיע)

```
הרשמות ← רשימה                       סטודנטים נכנסים
        ↓
תשלומים ← עסקאות                     מעקב / החזר / מחלוקת
        ↓
ציונים ← גליון (לכל קורס)            הזן ציונים כשהעבודה מגיעה
        ↓
מערכת לימוד ← נוכחות (לכל קורס)      סמן נוכחות לכל שיעור
```

## איך להשתמש במפה הזו בחלון העזרה

לכל מאמר במדריך הזה יש **דרישות מוקדמות** (כרטיסים בראש) ו**מה הלאה** (כרטיסים בתחתית). הם משקפים את החיצים למעלה. אם אי פעם תאבד, פתח את המאמר הזה — זו המפה היחידה שמכסה את כל הפלטפורמה.
$body$);

  -- =============================================================
  -- Wire dependency chains on key existing articles
  -- =============================================================
  -- We update prerequisites + next_steps on the major procedural
  -- articles so the drawer renders the dependency cards. Each UPDATE
  -- is locale-aware (both EN and HE rows updated).

  -- first-time-setup → leads to settings-organization
  UPDATE public.help_articles
  SET prerequisites = ARRAY['welcome']::text[],
      next_steps    = ARRAY['settings-organization', 'integrations-overview', 'invite-team']::text[]
  WHERE slug = 'first-time-setup';

  -- settings-organization → next: theme, then integrations
  UPDATE public.help_articles
  SET prerequisites = ARRAY['first-time-setup']::text[],
      next_steps    = ARRAY['settings-theme', 'integrations-overview']::text[]
  WHERE slug = 'settings-organization';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['settings-organization']::text[],
      next_steps    = ARRAY['integrations-overview', 'config-languages']::text[]
  WHERE slug = 'settings-theme';

  -- integrations chain
  UPDATE public.help_articles
  SET prerequisites = ARRAY['settings-organization']::text[],
      next_steps    = ARRAY['integrations-stripe', 'integrations-keap']::text[]
  WHERE slug = 'integrations-overview';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-overview']::text[],
      next_steps    = ARRAY['payments-products', 'payments-plans']::text[]
  WHERE slug = 'integrations-stripe';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-overview']::text[],
      next_steps    = ARRAY['crm-tags']::text[]
  WHERE slug = 'integrations-keap';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-overview']::text[],
      next_steps    = ARRAY['lms-modules-lessons']::text[]
  WHERE slug = 'integrations-zoom';

  -- Team
  UPDATE public.help_articles
  SET prerequisites = ARRAY['settings-organization']::text[],
      next_steps    = ARRAY['invite-team', 'audit-log']::text[]
  WHERE slug = 'users-and-roles';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['users-and-roles']::text[],
      next_steps    = ARRAY['lms-create-course']::text[]
  WHERE slug = 'invite-team';

  -- Grading chain (Scales → Categories → Items → Gradebook)
  UPDATE public.help_articles
  SET prerequisites = ARRAY['setup-sequence']::text[],
      next_steps    = ARRAY['grading-scales', 'grading-categories']::text[]
  WHERE slug = 'grading-system';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['grading-system']::text[],
      next_steps    = ARRAY['grading-categories', 'lms-create-course']::text[]
  WHERE slug = 'grading-scales';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['grading-scales']::text[],
      next_steps    = ARRAY['grading-items']::text[]
  WHERE slug = 'grading-categories';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['grading-categories']::text[],
      next_steps    = ARRAY['gradebook']::text[]
  WHERE slug = 'grading-items';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['grading-items']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'gradebook';

  -- LMS chain
  UPDATE public.help_articles
  SET prerequisites = ARRAY['invite-team', 'grading-scales']::text[],
      next_steps    = ARRAY['lms-create-course', 'lms-modules-lessons']::text[]
  WHERE slug = 'lms-courses';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['grading-scales', 'invite-team']::text[],
      next_steps    = ARRAY['lms-modules-lessons', 'payments-products']::text[]
  WHERE slug = 'lms-create-course';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['lms-create-course']::text[],
      next_steps    = ARRAY['integrations-zoom', 'payments-products']::text[]
  WHERE slug = 'lms-modules-lessons';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['lms-create-course']::text[],
      next_steps    = ARRAY['payments-products']::text[]
  WHERE slug = 'lms-programs';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['lms-create-course']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'lms-attendance';

  -- Sales chain (Plans → Products → Transactions/Disputes)
  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-stripe', 'lms-create-course']::text[],
      next_steps    = ARRAY['payments-plans', 'enrollments-overview']::text[]
  WHERE slug = 'payments-products';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-stripe']::text[],
      next_steps    = ARRAY['payments-products', 'payments-plans-rules']::text[]
  WHERE slug = 'payments-plans';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['payments-plans']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'payments-plans-rules';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['payments-products']::text[],
      next_steps    = ARRAY['payments-disputes']::text[]
  WHERE slug = 'payments-transactions';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['payments-transactions']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'payments-disputes';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['settings-organization']::text[],
      next_steps    = ARRAY['payments-products']::text[]
  WHERE slug = 'payments-pdf-template';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['payments-products']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'payments-reports';

  -- Enrollments
  UPDATE public.help_articles
  SET prerequisites = ARRAY['payments-products', 'payments-plans']::text[],
      next_steps    = ARRAY['enrollment-create-manual', 'payments-transactions']::text[]
  WHERE slug = 'enrollments-overview';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['enrollments-overview']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'enrollment-create-manual';

  -- Email chain (depends on email integration → templates → triggers → queue)
  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-overview']::text[],
      next_steps    = ARRAY['emails-templates', 'emails-triggers']::text[]
  WHERE slug = 'emails-overview';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['emails-overview']::text[],
      next_steps    = ARRAY['emails-triggers']::text[]
  WHERE slug = 'emails-templates';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['emails-templates']::text[],
      next_steps    = ARRAY['emails-queue']::text[]
  WHERE slug = 'emails-triggers';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['emails-triggers']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'emails-queue';

  -- Config
  UPDATE public.help_articles
  SET prerequisites = ARRAY['settings-overview']::text[],
      next_steps    = ARRAY['config-translations']::text[]
  WHERE slug = 'config-languages';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['config-languages']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'config-translations';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['admin-overview']::text[],
      next_steps    = ARRAY[]::text[]
  WHERE slug = 'config-navigation';

  -- CRM
  UPDATE public.help_articles
  SET prerequisites = ARRAY['integrations-keap']::text[],
      next_steps    = ARRAY['payments-products']::text[]
  WHERE slug = 'crm-tags';

  -- Anchors back to welcome → first-time-setup
  UPDATE public.help_articles
  SET prerequisites = ARRAY[]::text[],
      next_steps    = ARRAY['first-time-setup', 'admin-overview']::text[]
  WHERE slug = 'welcome';

  UPDATE public.help_articles
  SET prerequisites = ARRAY['welcome']::text[],
      next_steps    = ARRAY['settings-overview', 'first-time-setup']::text[]
  WHERE slug = 'admin-overview';

  RAISE NOTICE 'Setup-sequence flagship article seeded + dependency chains wired across ~30 articles.';
END $$;
