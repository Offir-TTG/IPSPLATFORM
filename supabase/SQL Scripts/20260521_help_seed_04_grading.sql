-- Comprehensive help seed — File 4 of 6: Grading.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'grading-system',
    'grading-scales',
    'grading-categories',
    'grading-items',
    'gradebook'
  );

  -- =============================================================
  -- grading-system
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('grading-system', 'en', 'How Grading Works',
   'Grading', 40,
   ARRAY['grading-overview']::text[],
   ARRAY['grading-scales', 'grading-categories', 'grading-items', 'gradebook']::text[],
$body$The grading system is built in five layers, each one a building block for the next.

## The hierarchy

1. **Grading Scale** (per tenant) — defines how percentages convert to letters: e.g., 90-100 = A.
2. **Grade Ranges** (per scale) — the rows inside a scale.
3. **Grade Categories** (per course) — weighted groups like "Homework 20%", "Exams 65%". Must total 100%.
4. **Grade Items** (per category) — assignments, quizzes, exams. Each has `max_points`.
5. **Student Grades** — one row per `(student × grade item)` with the actual score.

> [!TIP]
> Set up your default grading scale once at the tenant level. Every new course inherits it. Override only when a course truly needs different rules.

## How the final grade is calculated

For each category:
1. Average the percentages of items in that category.
2. Optionally drop the N lowest scores (`drop_lowest`).
3. Multiply by the category weight.

Sum across categories → final percentage. The letter grade is **looked up at display time** from the scale's ranges (never stored).

## Special flags

- **Extra Credit** items add to earned points but not to max possible — they can push grades above 100%.
- **Excused** items are skipped entirely — neither counted toward average nor item count.
- **Drop Lowest N** removes the N lowest scores in a category before averaging.

## End-to-end setup sequence

Follow this order when setting up grading for a brand new course:

1. **Tenant-level**: Create a Grading Scale at Admin → Grading → Scales. Add ranges (90-100=A, etc.).
2. **Course-level**: Open the course → Grading → Categories. Add weighted groups that sum to 100%.
3. **Course-level**: Open Grading → Items. Add each assignment under its category.
4. **As work comes in**: Open the Gradebook. Type scores into cells. Save.

Students see their percentage + letter + per-item feedback on their **Grades** page.
$body$),
  ('grading-system', 'he', 'איך עובדת מערכת הציונים',
   'ציונים', 40,
   ARRAY['grading-overview']::text[],
   ARRAY['grading-scales', 'grading-categories', 'grading-items', 'gradebook']::text[],
$body$מערכת הציונים בנויה מחמש שכבות, כל אחת אבן בניין לבאה.

## ההיררכיה

1. **סקלת ציונים** (לארגון) — מגדירה איך אחוזים מומרים לאותיות: למשל 90-100 = A.
2. **טווחי ציון** (בסקלה) — השורות בתוך סקלה.
3. **קטגוריות ציון** (לקורס) — קבוצות משוקללות כמו "שיעורי בית 20%", "מבחנים 65%". סך הכל חייב להיות 100%.
4. **פריטי ציון** (לקטגוריה) — מטלות, בחנים, מבחנים. לכל אחד יש `max_points`.
5. **ציוני סטודנט** — שורה לכל `(סטודנט × פריט ציון)` עם הציון בפועל.

> [!TIP]
> הגדר את סקלת ברירת המחדל פעם אחת ברמת הארגון. כל קורס חדש יורש אותה. עקוף רק כשקורס באמת זקוק לכללים שונים.

## איך הציון הסופי מחושב

לכל קטגוריה:
1. ממוצע אחוזים של פריטים בקטגוריה.
2. אופציונלית השמט N הציונים הנמוכים (`drop_lowest`).
3. הכפל במשקל הקטגוריה.

סכום על פני קטגוריות ← אחוז סופי. ציון האותיות **נשלף בזמן ההצגה** מטווחי הסקלה (אף פעם לא מאוחסן).

## דגלים מיוחדים

- פריטי **בונוס** מוסיפים לנקודות שהושגו אך לא למקסימום האפשרי — יכולים לדחוף ציונים מעל 100%.
- פריטים **מוצדקים** מדולגים לחלוטין — לא נספרים בממוצע ולא בספירת פריטים.
- **השמטת N הנמוכים** מסירה את N הציונים הנמוכים בקטגוריה לפני החישוב.

## רצף הגדרה מקצה לקצה

עקוב אחרי הסדר הזה בעת הגדרת ציונים לקורס חדש:

1. **רמת ארגון**: צור סקלת ציונים ב-ניהול ← ציונים ← סקלות. הוסף טווחים (90-100=A וכו').
2. **רמת קורס**: פתח את הקורס ← ציונים ← קטגוריות. הוסף קבוצות משוקללות שמסתכמות ל-100%.
3. **רמת קורס**: פתח ציונים ← פריטים. הוסף כל מטלה תחת הקטגוריה שלה.
4. **כשהעבודה מגיעה**: פתח את הגליון. הקלד ציונים לתאים. שמור.

סטודנטים רואים את האחוז + האות שלהם + משוב לכל פריט בדף **הציונים** שלהם.
$body$);

  -- =============================================================
  -- grading-scales
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('grading-scales', 'en', 'Create a Grading Scale',
   'Grading', 41,
   ARRAY['grading-scales-list', 'grading-scale-detail']::text[],
   ARRAY['grading-system', 'grading-categories']::text[],
$body$A grading scale defines how percentages map to letter grades. Each tenant typically has one default scale (A-F) that all courses inherit; create additional scales only for special cases like pass/fail labs.

## Scale types

- **Letter** — A, B, C, D, F (with +/- variants).
- **Numeric** — pure percentages, no letter conversion.
- **Pass/Fail** — two outcomes only.
- **Custom** — define your own labels.

## Create the scale

1. Go to **Admin → Grading → Scales**.
2. Click **Add Scale**.
3. Fill in:
   - **Name** — e.g., "Standard A-F".
   - **Scale Type** — pick from the four above.
   - **Set as Default** — every new course will inherit this scale.
   - **Active** — toggle off to retire a scale without deleting it.
4. Click **Create**. You land on the scale detail page.

## Add grade ranges

Each range is one row of the lookup table.

1. Click **Add Grade Range**.
2. Fill in:
   - **Grade Label** — e.g., "A", "B+", "Pass".
   - **Min % / Max %** — the range (90-100 for A).
   - **GPA Value** — optional, used in transcripts (e.g., 4.0 for A).
   - **Display Order** — controls the order shown.
   - **Color** — visual cue in the gradebook/student view.
   - **Passing Grade** — toggle on if this letter counts as "passed".
3. Repeat for every grade.

> [!WARNING]
> Ranges must cover 0-100% with no gaps and no overlaps. The validator at the top of the page shows red if your ranges are inconsistent.

## Sample A-F setup
- A: 90-100, GPA 4.0, passing
- B: 80-89, GPA 3.0, passing
- C: 70-79, GPA 2.0, passing
- D: 60-69, GPA 1.0, passing
- F: 0-59, GPA 0.0, NOT passing
$body$),
  ('grading-scales', 'he', 'צור סקלת ציונים',
   'ציונים', 41,
   ARRAY['grading-scales-list', 'grading-scale-detail']::text[],
   ARRAY['grading-system', 'grading-categories']::text[],
$body$סקלת ציונים מגדירה איך אחוזים מומרים לציוני אותיות. בדרך כלל לכל ארגון יש סקלה אחת כברירת מחדל (A-F) שכל הקורסים יורשים; צור סקלות נוספות רק למקרים מיוחדים כמו עבר/נכשל.

## סוגי סקלות

- **אותיות** — A, B, C, D, F (עם וריאציות +/-).
- **מספרי** — אחוזים בלבד, ללא המרה לאותיות.
- **עבר/נכשל** — שתי תוצאות בלבד.
- **מותאם אישית** — הגדר תוויות משלך.

## יצירת הסקלה

1. עבור ל**ניהול ← ציונים ← סקלות**.
2. לחץ **הוסף סקלה**.
3. מלא:
   - **שם** — למשל "A-F סטנדרטי".
   - **סוג סקלה** — בחר מהארבעה לעיל.
   - **קבע כברירת מחדל** — כל קורס חדש יירש את הסקלה הזו.
   - **פעיל** — כבה כדי לפרוש סקלה ללא מחיקה.
4. לחץ **צור**. אתה מגיע לדף פרטי הסקלה.

## הוספת טווחי ציון

כל טווח הוא שורה אחת בטבלת ההמרה.

1. לחץ **הוסף טווח ציון**.
2. מלא:
   - **תווית ציון** — למשל "A", "B+", "עבר".
   - **מינ % / מקס %** — הטווח (90-100 ל-A).
   - **ערך GPA** — אופציונלי, משמש בגיליונות ציונים (למשל 4.0 ל-A).
   - **סדר תצוגה** — שולט בסדר ההצגה.
   - **צבע** — רמז ויזואלי בגליון/תצוגת סטודנט.
   - **ציון עובר** — הפעל אם האות הזו נחשבת כ"עבר".
3. חזור על כל ציון.

> [!WARNING]
> הטווחים חייבים לכסות 0-100% ללא פערים וללא חפיפות. המאמת בראש הדף מציג אדום אם הטווחים שלך אינם עקביים.

## דוגמה להגדרת A-F
- A: 90-100, GPA 4.0, עובר
- B: 80-89, GPA 3.0, עובר
- C: 70-79, GPA 2.0, עובר
- D: 60-69, GPA 1.0, עובר
- F: 0-59, GPA 0.0, לא עובר
$body$);

  -- =============================================================
  -- grading-categories
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('grading-categories', 'en', 'Grade Categories',
   'Grading', 42,
   ARRAY['grading-categories']::text[],
   ARRAY['grading-system', 'grading-items', 'gradebook']::text[],
$body$Categories let you weight different kinds of work differently. Without categories, every grade item counts equally — usually not what you want.

## A typical setup

- Homework — 20%
- Quizzes — 15%
- Exams — 65%

The **Total Weight** badge at the top must equal **100%** for accurate calculations.

## Creating a category

1. Open the course → **Grading → Categories**.
2. Click **Add Category**.
3. Fill in:
   - **Name** — e.g., "Homework".
   - **Description** — optional.
   - **Weight (%)** — this category's contribution to the final grade.
   - **Drop Lowest** — number of lowest scores to drop in this category. Set 0 to disable.
   - **Display Order** — visual order.
   - **Color** — visual cue.
4. Click **Create**.

## Drop Lowest example

If a category has 4 homework items and **Drop Lowest = 1**, the lowest score is discarded before averaging. This gives students one bad-day buffer.

> [!NOTE]
> If **Drop Lowest** exceeds the number of items, the system silently keeps all items (it never throws an error or drops everything).

## Common pitfalls

- **Weights don't sum to 100%** — the calculator normalizes proportionally, but the warning banner shows. Fix immediately.
- **Category with no items** — its weight is still applied as zero contribution. Either remove the category or add items.
- **Items with no category** — they're skipped entirely in weighted-average mode. Always categorize.
$body$),
  ('grading-categories', 'he', 'קטגוריות ציון',
   'ציונים', 42,
   ARRAY['grading-categories']::text[],
   ARRAY['grading-system', 'grading-items', 'gradebook']::text[],
$body$קטגוריות מאפשרות לשקלל סוגי עבודה שונים. ללא קטגוריות, כל פריט ציון נחשב באופן שווה — בדרך כלל לא מה שאתה רוצה.

## הגדרה טיפוסית

- שיעורי בית — 20%
- בחנים — 15%
- מבחנים — 65%

תג **משקל כולל** בראש הדף חייב להיות שווה ל-**100%** לחישובים מדויקים.

## יצירת קטגוריה

1. פתח את הקורס ← **ציונים ← קטגוריות**.
2. לחץ **הוסף קטגוריה**.
3. מלא:
   - **שם** — למשל "שיעורי בית".
   - **תיאור** — אופציונלי.
   - **משקל (%)** — תרומת הקטגוריה הזו לציון הסופי.
   - **השמט נמוכים** — מספר הציונים הנמוכים להשמטה בקטגוריה הזו. הגדר 0 לכיבוי.
   - **סדר תצוגה** — סדר ויזואלי.
   - **צבע** — רמז ויזואלי.
4. לחץ **צור**.

## דוגמה להשמטת נמוכים

אם בקטגוריה יש 4 פריטי שיעורי בית ו**השמט נמוכים = 1**, הציון הנמוך ביותר מודח לפני החישוב. זה נותן לסטודנטים חיץ של יום אחד גרוע.

> [!NOTE]
> אם **השמט נמוכים** עולה על מספר הפריטים, המערכת בשקט שומרת את כל הפריטים (אף פעם לא זורקת שגיאה או מסירה הכל).

## טעויות נפוצות

- **משקלים לא מסתכמים ל-100%** — המחשבון מנרמל באופן יחסי, אך באנר אזהרה מוצג. תקן מיד.
- **קטגוריה ללא פריטים** — המשקל שלה עדיין מיושם כתרומת אפס. או הסר את הקטגוריה או הוסף פריטים.
- **פריטים ללא קטגוריה** — הם מדולגים לחלוטין במצב ממוצע משוקלל. תמיד קטגוריזה.
$body$);

  -- =============================================================
  -- grading-items
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('grading-items', 'en', 'Grade Items (Assignments)',
   'Grading', 43,
   ARRAY['grading-items']::text[],
   ARRAY['grading-categories', 'gradebook', 'grading-system']::text[],
$body$Grade items are the actual things students get graded on — assignments, quizzes, midterms, finals, papers. Each item belongs to a category and has a maximum point value.

## Creating an item

1. Open the course → **Grading → Items**.
2. Click **Add Item**.
3. Fill in:
   - **Name** — student-facing label (e.g., "Homework 3").
   - **Description** — optional context.
   - **Category** — pick which weighted group this counts toward.
   - **Max Points** — total possible (e.g., 100, or 50 for a short quiz).
   - **Due Date** — when it's due (shown to students).
   - **Available From / Until** — when the item is visible/submittable.
   - **Published** — students see published items only.
   - **Extra Credit** — points count but don't count toward max possible.
   - **Allow Late Submission** — flag; instructor still sets final points.
   - **Display Order** — visual order in the student's grade list.
4. Click **Create**.

## Workflow

1. Create the item, leave **Published** off.
2. When you're ready for students to see it, publish.
3. Students submit work (outside the platform — by email, in class, etc.).
4. Enter scores in the **Gradebook**.

> [!TIP]
> For extra credit, set **Extra Credit** to true. The points are added to earned but not to max — so students can score above 100%.

## Bulk operations

- **Duplicate item** — useful for repeating items like "Homework 1, 2, 3...".
- **Reorder** — drag and drop in the items list.
- **Move to different category** — edit item → change category dropdown.
$body$),
  ('grading-items', 'he', 'פריטי ציון (מטלות)',
   'ציונים', 43,
   ARRAY['grading-items']::text[],
   ARRAY['grading-categories', 'gradebook', 'grading-system']::text[],
$body$פריטי ציון הם הדברים שעליהם סטודנטים מקבלים ציון — מטלות, בחנים, מבחני אמצע, מבחנים, עבודות. כל פריט שייך לקטגוריה ויש לו ערך נקודות מקסימלי.

## יצירת פריט

1. פתח את הקורס ← **ציונים ← פריטים**.
2. לחץ **הוסף פריט**.
3. מלא:
   - **שם** — תווית הנראית לסטודנט (למשל "שיעורי בית 3").
   - **תיאור** — הקשר אופציונלי.
   - **קטגוריה** — בחר באיזו קבוצה משוקללת זה נספר.
   - **נקודות מקסימום** — סך כל האפשרי (למשל 100, או 50 לבוחן קצר).
   - **תאריך יעד** — מתי זה אמור להיות (מוצג לסטודנטים).
   - **זמין מ-/ עד** — מתי הפריט גלוי/ניתן להגשה.
   - **מפורסם** — סטודנטים רואים רק פריטים מפורסמים.
   - **בונוס** — נקודות נספרות אך לא נספרות במקסימום האפשרי.
   - **אפשר הגשה מאוחרת** — דגל; המורה עדיין מגדיר את הנקודות הסופיות.
   - **סדר תצוגה** — סדר ויזואלי ברשימת הציונים של הסטודנט.
4. לחץ **צור**.

## תהליך עבודה

1. צור את הפריט, השאר **מפורסם** כבוי.
2. כשאתה מוכן לסטודנטים לראות, פרסם.
3. סטודנטים מגישים עבודה (מחוץ לפלטפורמה — במייל, בכיתה וכו').
4. הזן ציונים ב**גליון הציונים**.

> [!TIP]
> לבונוס, הגדר **בונוס** ל-true. הנקודות מתווספות להושגו אך לא למקסימום — כך סטודנטים יכולים לצבור מעל 100%.

## פעולות בכמות

- **שכפול פריט** — שימושי לפריטים חוזרים כמו "שיעורי בית 1, 2, 3...".
- **סידור מחדש** — גרור ושחרר ברשימת הפריטים.
- **העברה לקטגוריה אחרת** — ערוך פריט ← שנה תפריט קטגוריה.
$body$);

  -- =============================================================
  -- gradebook
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('gradebook', 'en', 'The Gradebook',
   'Grading', 44,
   ARRAY['gradebook']::text[],
   ARRAY['grading-system', 'grading-items', 'grading-categories']::text[],
$body$The gradebook is a spreadsheet-style view: students in rows, grade items in columns. This is where you enter scores in bulk.

## Layout

- **Sticky Student column** — pinned to the left while you scroll horizontally.
- **Grade item columns** — one per assignment, in the order set by Display Order.
- **Sticky Total column** — pinned to the right, showing each student's running total + letter grade.

## Entering grades

1. Click any cell. The cell becomes an editable input.
2. Type the points earned. The percentage auto-calculates and is shown below the input.
3. Move to the next cell with Tab (or arrow keys).
4. Edited cells get a **yellow highlight** so you can see what changed since the last save.

> [!TIP]
> The **Save** button at the top shows `(N)` — that's how many cells you've changed. Click it to save them all at once.

## What gets saved

- Only **changed cells** are sent on save (not the whole grid).
- Existing grades are upserted: new rows inserted, existing rows updated.
- Each save stores `graded_by` (you) and `graded_at` (now).

## Special cell states

- **Empty** — student hasn't been graded yet. Doesn't count toward average.
- **0** — student got zero. Counts toward average as a real grade.
- **Excused** — right-click cell → Mark Excused. The grade is skipped entirely.

> [!WARNING]
> Empty vs 0 is meaningful. Leaving a cell empty means "haven't graded yet" (which doesn't lower the average); typing 0 means "got it wrong" (which does). Be intentional.

## On mobile

The gradebook switches to a **card-per-student** view. Each card shows all grade items for that student vertically. Same yellow highlight + Save behavior.

## Bulk operations

- **Import grades from CSV** — coming soon.
- **Mark all unsubmitted as zero** — quick action under the Actions menu (use carefully).
- **Export gradebook to CSV** — download for offline analysis or sharing.
$body$),
  ('gradebook', 'he', 'גליון הציונים',
   'ציונים', 44,
   ARRAY['gradebook']::text[],
   ARRAY['grading-system', 'grading-items', 'grading-categories']::text[],
$body$הגליון הוא תצוגה דמוית גיליון: סטודנטים בשורות, פריטי ציון בעמודות. כאן אתה מזין ציונים בכמות.

## פריסה

- **עמודת סטודנט דביקה** — מעוגנת בצד תוך כדי גלילה אופקית.
- **עמודות פריטי ציון** — אחת לכל מטלה, בסדר שנקבע על ידי סדר תצוגה.
- **עמודת סה"כ דביקה** — מעוגנת בצד השני, מציגה את הסכום הרץ של כל סטודנט + ציון אותיות.

## הזנת ציונים

1. לחץ על כל תא. התא הופך לקלט הניתן לעריכה.
2. הקלד את הנקודות שהושגו. האחוז מחשב אוטומטית ומוצג מתחת לקלט.
3. עבור לתא הבא עם Tab (או מקשי החצים).
4. תאים שנערכו מקבלים **הדגשה צהובה** כדי שתוכל לראות מה השתנה מאז השמירה האחרונה.

> [!TIP]
> כפתור **שמור** בראש מציג `(N)` — זה כמה תאים שינית. לחץ כדי לשמור את כולם בבת אחת.

## מה נשמר

- רק **תאים שהשתנו** נשלחים בשמירה (לא כל הרשת).
- ציונים קיימים מועלים: שורות חדשות מוכנסות, שורות קיימות מעודכנות.
- כל שמירה שומרת `graded_by` (אתה) ו-`graded_at` (עכשיו).

## מצבי תא מיוחדים

- **ריק** — הסטודנט עוד לא קיבל ציון. לא נחשב בממוצע.
- **0** — הסטודנט קיבל אפס. נחשב בממוצע כציון אמיתי.
- **מוצדק** — לחיצה ימנית על תא ← סמן כמוצדק. הציון מדולג לחלוטין.

> [!WARNING]
> ריק לעומת 0 משמעותי. השארת תא ריק אומרת "טרם ניתן ציון" (שלא מוריד את הממוצע); הקלדת 0 אומרת "טעה" (שכן). היה מכוון.

## במובייל

הגליון עובר לתצוגת **כרטיס לכל סטודנט**. כל כרטיס מציג את כל פריטי הציון של אותו סטודנט אנכית. אותה הדגשה צהובה והתנהגות שמירה.

## פעולות בכמות

- **ייבוא ציונים מ-CSV** — בקרוב.
- **סמן הכל לא הוגש כאפס** — פעולה מהירה בתפריט הפעולות (השתמש בזהירות).
- **ייצא גליון ל-CSV** — הורד לניתוח לא מקוון או שיתוף.
$body$);

  RAISE NOTICE 'Help articles seed (file 4/6): Grading — 5 articles × 2 locales = 10 rows.';
END $$;
