-- Comprehensive help seed — File 7 of 7: additional Configuration articles
-- (config-languages, config-features). Filling gaps left by files 1-6.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'config-languages',
    'config-features'
  );

  -- =============================================================
  -- config-languages
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('config-languages', 'en', 'Languages',
   'Configuration', 79,
   ARRAY['config-languages']::text[],
   ARRAY['config-translations', 'settings-overview', 'config-navigation']::text[],
$body$The Languages page controls which UI languages your tenant supports. Enabled languages appear in the language switcher in the header; admins and students can pick any of them.

## What ships out of the box

- **English** — always available, default for all tenants.
- **Hebrew** — available, RTL-aware (the entire UI flips automatically when selected).

You can disable Hebrew if your school is English-only, or vice versa.

## Configuring a language

1. Go to **Admin → Config → Languages**.
2. Each language card shows:
   - **Language name** (English / Hebrew / ...)
   - **Code** (`en`, `he`)
   - **Direction** (LTR / RTL)
   - **Currency / Symbol / Position** — used for price formatting in this language.
   - **Active** toggle — shown in the switcher when enabled.
   - **Default for admin** toggle — pre-selected for new admin users.
   - **Default for user** toggle — pre-selected for new students.
3. Edit any field, click **Save**.

## Currency display per language

Each language has its own currency display preference. Example:
- English uses `$` before the number — `$1,234.56`.
- Hebrew uses `₪` after the number — `1,234.56 ₪`.

This is purely a display formatting choice; the **actual currency code** is set per product (or tenant default).

## Adding a brand new language

Adding a language code that doesn't ship by default (e.g., Spanish) requires:
1. Adding the language row here.
2. Translating every UI key under **Config → Translations** — you can bulk-import a JSON file from a translator.
3. Toggling the language **Active**.

Without translations, the new language would show English fallback for every label.

> [!TIP]
> Test a new language thoroughly before exposing it to students. Open every major page in the new language and look for untranslated labels — those need to be filled in under Config → Translations.

## Common pitfalls

- **Default toggle ignored** — only ONE language can be default-for-admin and ONE default-for-user. Setting a second one auto-clears the first.
- **Disabling the default** — the system prevents this. Switch the default to a different language first, then disable the old one.
$body$),
  ('config-languages', 'he', 'שפות',
   'קונפיגורציה', 79,
   ARRAY['config-languages']::text[],
   ARRAY['config-translations', 'settings-overview', 'config-navigation']::text[],
$body$דף השפות שולט באילו שפות ממשק הארגון שלך תומך. שפות מופעלות מופיעות במחליף השפה בכותרת; מנהלים וסטודנטים יכולים לבחור כל אחת מהן.

## מה מגיע מוכן

- **אנגלית** — תמיד זמינה, ברירת מחדל לכל הארגונים.
- **עברית** — זמינה, מודעת RTL (הממשק כולו מתהפך אוטומטית כשנבחר).

ניתן להשבית עברית אם בית הספר שלך באנגלית בלבד, או להפך.

## הגדרת שפה

1. עבור ל**ניהול ← קונפיגורציה ← שפות**.
2. כל כרטיס שפה מציג:
   - **שם שפה** (אנגלית / עברית / ...)
   - **קוד** (`en`, `he`)
   - **כיוון** (LTR / RTL)
   - **מטבע / סמל / מיקום** — משמש לעיצוב מחירים בשפה זו.
   - מתג **פעיל** — מוצג במחליף כאשר מופעל.
   - מתג **ברירת מחדל למנהל** — נבחר מראש למשתמשי מנהל חדשים.
   - מתג **ברירת מחדל למשתמש** — נבחר מראש לסטודנטים חדשים.
3. ערוך כל שדה, לחץ **שמור**.

## תצוגת מטבע לכל שפה

לכל שפה יש העדפת תצוגת מטבע משלה. דוגמה:
- אנגלית משתמשת ב-`$` לפני המספר — `$1,234.56`.
- עברית משתמשת ב-`₪` אחרי המספר — `1,234.56 ₪`.

זוהי בחירת עיצוב תצוגה בלבד; **קוד המטבע בפועל** מוגדר לכל מוצר (או ברירת מחדל של הארגון).

## הוספת שפה חדשה לחלוטין

הוספת קוד שפה שלא מגיע כברירת מחדל (למשל ספרדית) דורשת:
1. הוספת שורת השפה כאן.
2. תרגום כל מפתח ממשק תחת **קונפיגורציה ← תרגומים** — ניתן לייבא קובץ JSON ממתרגם בכמות.
3. הפעלת **פעיל** של השפה.

ללא תרגומים, השפה החדשה תציג את ברירת המחדל באנגלית עבור כל תווית.

> [!TIP]
> בדוק שפה חדשה ביסודיות לפני חשיפתה לסטודנטים. פתח כל דף עיקרי בשפה החדשה וחפש תוויות לא מתורגמות — צריך למלא אותן תחת קונפיגורציה ← תרגומים.

## טעויות נפוצות

- **מתג ברירת מחדל מתעלמים** — רק שפה אחת יכולה להיות ברירת-מחדל-למנהל ואחת ברירת-מחדל-למשתמש. הגדרת שנייה מנקה אוטומטית את הראשונה.
- **השבתת ברירת המחדל** — המערכת מונעת זאת. החלף את ברירת המחדל לשפה אחרת תחילה, ואז השבת את הישנה.
$body$);

  -- =============================================================
  -- config-features
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('config-features', 'en', 'Feature Flags',
   'Configuration', 82,
   ARRAY['config-features']::text[],
   ARRAY['settings-overview', 'config-navigation']::text[],
$body$Feature flags let you turn parts of the platform on or off for your tenant. Use them to gradually adopt new functionality, run experiments, or hide features you don't use.

## When to touch this

- A new platform feature has shipped and you want to opt in (or out).
- You want to hide a sidebar section that doesn't apply to your school (e.g., disable Programs if you only sell single courses).
- You're running an A/B-style experiment.

## How flags work

Each flag has a name (e.g., `enable_lectures`) and a boolean value. The UI checks the flag before showing certain pages, menu items, or buttons. Disabled flags hide the feature; enabled flags show it.

## Editing a flag

1. Go to **Admin → Config → Features**.
2. Find the flag in the list.
3. Toggle it on or off.
4. Click **Save**.

Most flags take effect immediately on the next page load. A few require a hard refresh (Ctrl+Shift+R).

## Reading the descriptions

Each flag shows:
- **Key** — the internal name (`enable_lectures`, `show_advanced_reports`).
- **Description** — what turning it on/off does.
- **Default value** — what it ships as for new tenants.
- **Affects** — which pages or features change when toggled.

> [!WARNING]
> Don't toggle flags you don't understand. Some control payment processing, email delivery, or other critical paths. If a description is missing, leave the flag alone or ask platform support.

## Common flags

- `enable_lectures` — show/hide single-session lecture products.
- `enable_programs` — show/hide multi-course programs.
- `show_advanced_reports` — show experimental reports under Payments → Reports.
- `enable_zoom_bridge` — show/hide the instructor bridge link feature.

## Auditing flag changes

Every flag change is logged to the audit log (Admin → Audit). Useful for debugging "this feature suddenly disappeared".
$body$),
  ('config-features', 'he', 'דגלי תכונות',
   'קונפיגורציה', 82,
   ARRAY['config-features']::text[],
   ARRAY['settings-overview', 'config-navigation']::text[],
$body$דגלי תכונות מאפשרים להפעיל או לכבות חלקים בפלטפורמה לארגון שלך. השתמש בהם כדי לאמץ בהדרגה פונקציונליות חדשה, להריץ ניסויים, או להסתיר תכונות שאינך משתמש.

## מתי לגעת בזה

- תכונה חדשה הופעלה בפלטפורמה ואתה רוצה להצטרף (או לא).
- אתה רוצה להסתיר סעיף בסרגל שלא רלוונטי לבית הספר שלך (למשל השבת תכניות אם אתה מוכר רק קורסים בודדים).
- אתה מריץ ניסוי בסגנון A/B.

## איך דגלים עובדים

לכל דגל יש שם (למשל `enable_lectures`) וערך בוליאני. הממשק בודק את הדגל לפני הצגת דפים, פריטי תפריט או כפתורים מסוימים. דגלים מושבתים מסתירים את התכונה; דגלים מופעלים מציגים אותה.

## עריכת דגל

1. עבור ל**ניהול ← קונפיגורציה ← תכונות**.
2. מצא את הדגל ברשימה.
3. הפעל או כבה אותו.
4. לחץ **שמור**.

רוב הדגלים נכנסים לתוקף מיידית בטעינת הדף הבא. כמה דורשים רענון קשה (Ctrl+Shift+R).

## קריאת התיאורים

כל דגל מציג:
- **מפתח** — השם הפנימי (`enable_lectures`, `show_advanced_reports`).
- **תיאור** — מה הפעלה/כיבוי שלו עושה.
- **ערך ברירת מחדל** — מה הוא מגיע עבור ארגונים חדשים.
- **משפיע על** — אילו דפים או תכונות משתנים בהפעלה.

> [!WARNING]
> אל תפעיל דגלים שאינך מבין. חלקם שולטים בעיבוד תשלומים, מסירת מיילים או מסלולים קריטיים אחרים. אם תיאור חסר, השאר את הדגל לבד או שאל את תמיכת הפלטפורמה.

## דגלים נפוצים

- `enable_lectures` — הצג/הסתר מוצרי הרצאה חד-מפגשיים.
- `enable_programs` — הצג/הסתר תכניות רב-קורסים.
- `show_advanced_reports` — הצג דוחות ניסיוניים תחת תשלומים ← דוחות.
- `enable_zoom_bridge` — הצג/הסתר תכונת קישור גשר מרצה.

## ביקורת שינויי דגלים

כל שינוי דגל נרשם בלוג הביקורת (ניהול ← ביקורת). שימושי לאיתור באגים של "התכונה הזאת פתאום נעלמה".
$body$);

  RAISE NOTICE 'Help articles seed (file 7/7): Config extras — 2 articles × 2 locales = 4 rows.';
END $$;
