-- Comprehensive help seed — File 3 of 6: LMS / Course building.

DO $$
BEGIN
  DELETE FROM public.help_articles
  WHERE slug IN (
    'lms-courses',
    'lms-create-course',
    'lms-modules-lessons',
    'lms-programs',
    'lms-attendance'
  );

  -- =============================================================
  -- lms-courses
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('lms-courses', 'en', 'Courses Overview',
   'LMS', 30,
   ARRAY['lms-courses', 'lms-course-detail']::text[],
   ARRAY['lms-create-course', 'lms-modules-lessons', 'lms-programs', 'grading-system', 'payments-products']::text[],
$body$A course is the actual learning experience delivered to enrolled students. Each course is a tree:

```
Course
  └─ Module           (e.g., "Week 1: Foundations")
       └─ Lesson      (e.g., "Day 1 — Intro to React")
             └─ Topic (video, text, link, PDF, Zoom meeting, quiz)
```

## The Courses list page shows
- All courses in your tenant.
- Their published/unpublished status.
- Instructor and student count.
- Quick edit + duplicate buttons.

## What a course owns
- **Title, description, image** — student-facing presentation.
- **Instructor** — the lecturer (defaults to whoever created the course).
- **Grading scale** — overrides the tenant default for this course.
- **Modules and lessons** — the actual content.
- **Enrollment data** — which students are enrolled (read-only here; managed under Enrollments).

## Common operations
- **Create** — click "Create Course" (top right). See "Create your first course" article for the full walkthrough.
- **Edit** — click a course row → opens the course detail page where you manage modules/lessons.
- **Duplicate** — clone an existing course for a new cohort. Modules, lessons, and topics all copy; enrollments do not.
- **Publish/Unpublish** — students only see published courses.
- **Delete** — destructive; only allowed if no enrollments reference the course.

## Linking courses to revenue
Courses don't sell themselves directly. To collect money, wrap a course in a **Product** (Payments → Products) and attach a **Payment Plan**. Students enroll in the *product*; that grants access to the course.

For multi-course offerings, create a **Program** (Programs → Create Program) and put the courses inside it.
$body$),
  ('lms-courses', 'he', 'סקירת קורסים',
   'מערכת לימוד', 30,
   ARRAY['lms-courses', 'lms-course-detail']::text[],
   ARRAY['lms-create-course', 'lms-modules-lessons', 'lms-programs', 'grading-system', 'payments-products']::text[],
$body$קורס הוא חוויית הלמידה בפועל המועברת לסטודנטים רשומים. כל קורס הוא עץ:

```
קורס
  └─ מודול           (למשל "שבוע 1: יסודות")
       └─ שיעור      (למשל "יום 1 — מבוא ל-React")
             └─ נושא (וידאו, טקסט, קישור, PDF, פגישת Zoom, חידון)
```

## דף רשימת הקורסים מציג
- כל הקורסים בארגון שלך.
- סטטוס מפורסם/לא מפורסם.
- מרצה ומספר סטודנטים.
- כפתורי עריכה ושכפול מהירים.

## מה קורס מחזיק
- **כותרת, תיאור, תמונה** — תצוגה לסטודנט.
- **מרצה** — המרצה (ברירת מחדל למי שיצר את הקורס).
- **סקלת ציונים** — עוקפת את ברירת המחדל של הארגון לקורס זה.
- **מודולים ושיעורים** — התוכן בפועל.
- **נתוני הרשמה** — אילו סטודנטים רשומים (לקריאה בלבד כאן; מנוהל תחת הרשמות).

## פעולות נפוצות
- **יצירה** — לחץ "צור קורס" (פינה עליונה). ראה מאמר "צור את הקורס הראשון שלך" להדרכה מלאה.
- **עריכה** — לחץ על שורת קורס ← פותח את דף פרטי הקורס שם מנהלים מודולים/שיעורים.
- **שכפול** — שכפל קורס קיים למחזור חדש. מודולים, שיעורים ונושאים מועתקים; הרשמות לא.
- **פרסום/ביטול פרסום** — סטודנטים רואים רק קורסים מפורסמים.
- **מחיקה** — הרסני; מותר רק אם אין הרשמות שמפנות לקורס.

## קישור קורסים להכנסה
קורסים לא נמכרים ישירות. כדי לגבות כסף, עטוף קורס ב**מוצר** (תשלומים ← מוצרים) וצרף **תכנית תשלום**. סטודנטים נרשמים ל*מוצר*; זה מעניק גישה לקורס.

להצעות רב-קורסיות, צור **תכנית** (תכניות ← צור תכנית) ושים את הקורסים בתוכה.
$body$);

  -- =============================================================
  -- lms-create-course (NEW step-by-step tutorial)
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('lms-create-course', 'en', 'Create Your First Course (Step-by-Step)',
   'LMS', 31,
   ARRAY[]::text[],
   ARRAY['lms-courses', 'lms-modules-lessons', 'grading-system', 'payments-products']::text[],
$body$This is the full walkthrough for building a course from scratch. Plan to spend 30-60 minutes the first time.

## Before you start
- Have your course outline ready (modules and lesson titles).
- A cover image (1200×675px, under 2MB).
- A grading scale (if you'll grade students). If not, create one first at Admin → Grading → Scales.
- Decide if you'll use Zoom. If yes, connect Zoom first (Integrations → Zoom).

## Phase 1 — Create the course shell

1. Go to **Admin → LMS → Courses**.
2. Click **Create Course** (top right).
3. Fill in:
   - **Course Title** — student-facing name (e.g., "Intro to React").
   - **Description** — long-form description shown on the product page.
   - **Course Image** — upload the cover.
   - **Instructor** — pick the user who teaches it. Leave blank to default to yourself.
   - **Grading Scale** — pick one (or leave to inherit tenant default).
   - **Start / End dates** — when the course runs.
4. Leave **Published** off for now (you'll publish at the end).
5. Click **Create**. You're now on the course detail page.

## Phase 2 — Build the module/lesson tree

1. Click **Add Module** → name it (e.g., "Week 1").
2. Inside the module, click **Add Lesson** → name it (e.g., "Day 1 — Setup").
3. Set the lesson's **Date / Start time / Duration** if it's a scheduled live session.
4. Inside the lesson, click **Add Topic**. Pick a type:
   - **Video** — upload or paste a YouTube/Vimeo URL.
   - **Text/Notes** — write content directly with the rich editor.
   - **External Link** — links out to anywhere.
   - **PDF Document** — upload a PDF, students view inline.
   - **Zoom Meeting** — attach a Zoom meeting (requires Zoom integration).
   - **Quiz** — multi-choice quiz with grading (optional).
5. Repeat for every lesson and module.

## Phase 3 — Set up grading (if applicable)

1. Inside the course, go to **Grading → Categories**. Add weighted categories (Homework 20%, Exams 65%, etc.). Total must equal 100%.
2. Go to **Grading → Items**. Add each assignment under its category.
3. Skip the **Gradebook** for now — you'll use it to enter scores as students complete work.

## Phase 4 — Publish & sell

1. Open the course again and toggle **Published** to on. Students with access will see it.
2. To **sell access**, go to **Payments → Products → Create Product**, pick "Course" type, link this course, set a price + payment plan.
3. The product gets a public enrollment URL (e.g., `/enroll/your-course-slug`). Share that link in your marketing.

## Verifying it worked
- Enroll a test student via "Create Manual Enrollment".
- Log in as that student in incognito mode — you should see the course on their dashboard with all modules/lessons visible.
$body$),
  ('lms-create-course', 'he', 'צור את הקורס הראשון שלך (שלב אחר שלב)',
   'מערכת לימוד', 31,
   ARRAY[]::text[],
   ARRAY['lms-courses', 'lms-modules-lessons', 'grading-system', 'payments-products']::text[],
$body$זוהי ההדרכה המלאה לבניית קורס מאפס. תכנן להקדיש 30-60 דקות בפעם הראשונה.

## לפני שמתחילים
- מתווה הקורס מוכן (כותרות מודולים ושיעורים).
- תמונת כיסוי (1200×675px, מתחת ל-2MB).
- סקלת ציונים (אם תיתן ציונים לסטודנטים). אם לא, צור אחת תחילה ב-ניהול ← ציונים ← סקלות.
- החלט אם תשתמש ב-Zoom. אם כן, חבר Zoom תחילה (שילובים ← Zoom).

## שלב 1 — צור את שלד הקורס

1. עבור ל**ניהול ← מערכת לימוד ← קורסים**.
2. לחץ **צור קורס** (פינה עליונה).
3. מלא:
   - **שם הקורס** — שם הנראה לסטודנט (למשל "מבוא ל-React").
   - **תיאור** — תיאור ארוך המוצג בדף המוצר.
   - **תמונת הקורס** — העלה את הכיסוי.
   - **מרצה** — בחר את המשתמש המלמד. השאר ריק לברירת מחדל לעצמך.
   - **סקלת ציונים** — בחר אחת (או השאר לירש מברירת המחדל של הארגון).
   - **תאריכי התחלה / סיום** — מתי הקורס רץ.
4. השאר את **מפורסם** כבוי לעת עתה (תפרסם בסוף).
5. לחץ **צור**. אתה עכשיו בדף פרטי הקורס.

## שלב 2 — בנה את עץ המודולים/שיעורים

1. לחץ **הוסף מודול** ← תן לו שם (למשל "שבוע 1").
2. בתוך המודול, לחץ **הוסף שיעור** ← תן לו שם (למשל "יום 1 — הגדרה").
3. הגדר **תאריך / זמן התחלה / משך** של השיעור אם זה מפגש חי מתוזמן.
4. בתוך השיעור, לחץ **הוסף נושא**. בחר סוג:
   - **וידאו** — העלה או הדבק URL של YouTube/Vimeo.
   - **טקסט/הערות** — כתוב תוכן ישירות עם העורך העשיר.
   - **קישור חיצוני** — מקשר לכל מקום.
   - **מסמך PDF** — העלה PDF, סטודנטים צופים בקובץ.
   - **פגישת Zoom** — צרף פגישת Zoom (דורש שילוב Zoom).
   - **חידון** — חידון רב-ברירה עם ציון (אופציונלי).
5. חזור על כל שיעור ומודול.

## שלב 3 — הגדרת ציונים (אם רלוונטי)

1. בתוך הקורס, עבור ל**ציונים ← קטגוריות**. הוסף קטגוריות משוקללות (שיעורי בית 20%, מבחנים 65% וכו'). הסך הכל חייב להיות 100%.
2. עבור ל**ציונים ← פריטים**. הוסף כל מטלה תחת הקטגוריה שלה.
3. דלג על **גליון ציונים** לעת עתה — תשתמש בו להזין ציונים כשסטודנטים משלימים עבודה.

## שלב 4 — פרסום ומכירה

1. פתח את הקורס שוב והפעל את **מפורסם**. סטודנטים עם גישה יראו אותו.
2. כדי **למכור גישה**, עבור ל**תשלומים ← מוצרים ← צור מוצר**, בחר סוג "קורס", קשר את הקורס הזה, הגדר מחיר + תכנית תשלום.
3. המוצר מקבל URL הרשמה ציבורי (למשל `/enroll/your-course-slug`). שתף את הקישור הזה בשיווק שלך.

## אימות שזה עבד
- רשום סטודנט לבדיקה דרך "צור הרשמה ידנית".
- התחבר כסטודנט זה במצב גלישה בסתר — אתה אמור לראות את הקורס בלוח הבקרה שלו עם כל המודולים/שיעורים גלויים.
$body$);

  -- =============================================================
  -- lms-modules-lessons
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('lms-modules-lessons', 'en', 'Modules, Lessons, and Topics',
   'LMS', 32,
   ARRAY['lms-course-detail']::text[],
   ARRAY['lms-create-course', 'lms-courses', 'integrations-zoom']::text[],
$body$Inside each course is a three-level tree: Module → Lesson → Topic. Plan your hierarchy before you start clicking.

## What goes where
- **Module** — a high-level chunk. Usually a unit, week, or section ("Week 1: Foundations").
- **Lesson** — a single class, day, or session. Has a scheduled date/time if live.
- **Topic** — a single piece of content inside a lesson. A lesson can have many topics.

## Adding a module
1. Open the course detail page.
2. Click **Add Module** (under the course header).
3. Name it. Optional: description.
4. Save.

## Adding a lesson
1. Hover over a module → click **Add Lesson**.
2. Fill in:
   - **Title** — lesson name.
   - **Date / Start Time / Duration** — only if this is a live session.
   - **Timezone** — defaults to the tenant timezone.
   - **Description** — long description shown on the lesson page.
3. Save. The lesson appears nested under its module.

## Adding a topic
1. Open a lesson.
2. Click **Add Topic**.
3. Pick a type and configure:
   - **Video** — paste a video URL (YouTube/Vimeo embed supported) OR upload an MP4 (uses your storage).
   - **Text** — opens a rich-text editor. Headings, bold, bullets, links, embedded images.
   - **External Link** — title + URL. Opens in a new tab.
   - **PDF** — upload a file (max 50MB). Students view inline.
   - **Zoom Meeting** — pick existing or create a new Zoom meeting (requires Zoom integration).
   - **Quiz** — multi-choice. Each question has a question, options, correct answer(s), points.

## Reordering
Drag and drop modules, lessons, and topics into any order. The order is what students see.

## Visibility rules
- A topic in an **unpublished** lesson is invisible to students.
- A lesson in an **unpublished** module is invisible.
- Set publish flags per-level for staged rollouts (e.g., "release week 2 next Monday").

## Lesson reminders
If a lesson has a scheduled date/time, an email reminder fires automatically (24 hours and 30 minutes before, per the email triggers config). Students enrolled in the course receive it. See Email Triggers for customizing the timing.
$body$),
  ('lms-modules-lessons', 'he', 'מודולים, שיעורים ונושאים',
   'מערכת לימוד', 32,
   ARRAY['lms-course-detail']::text[],
   ARRAY['lms-create-course', 'lms-courses', 'integrations-zoom']::text[],
$body$בתוך כל קורס יש עץ תלת-שכבתי: מודול ← שיעור ← נושא. תכנן את ההיררכיה לפני שמתחילים ללחוץ.

## מה הולך איפה
- **מודול** — חלק ברמה גבוהה. בדרך כלל יחידה, שבוע או סעיף ("שבוע 1: יסודות").
- **שיעור** — כיתה, יום או מפגש בודד. יש לו תאריך/זמן מתוזמן אם חי.
- **נושא** — פיסת תוכן בודדת בתוך שיעור. לשיעור יכולים להיות נושאים רבים.

## הוספת מודול
1. פתח את דף פרטי הקורס.
2. לחץ **הוסף מודול** (תחת כותרת הקורס).
3. תן לו שם. אופציונלי: תיאור.
4. שמור.

## הוספת שיעור
1. רחף מעל מודול ← לחץ **הוסף שיעור**.
2. מלא:
   - **כותרת** — שם השיעור.
   - **תאריך / זמן התחלה / משך** — רק אם זה מפגש חי.
   - **אזור זמן** — ברירת מחדל לאזור הזמן של הארגון.
   - **תיאור** — תיאור ארוך המוצג בדף השיעור.
3. שמור. השיעור מופיע מקונן תחת המודול שלו.

## הוספת נושא
1. פתח שיעור.
2. לחץ **הוסף נושא**.
3. בחר סוג והגדר:
   - **וידאו** — הדבק URL של וידאו (תמיכה ב-YouTube/Vimeo embed) או העלה MP4 (משתמש באחסון שלך).
   - **טקסט** — פותח עורך טקסט עשיר. כותרות, מודגש, נקודות, קישורים, תמונות משובצות.
   - **קישור חיצוני** — כותרת + URL. נפתח בכרטיסייה חדשה.
   - **PDF** — העלה קובץ (מקסימום 50MB). סטודנטים צופים בקובץ.
   - **פגישת Zoom** — בחר קיימת או צור פגישת Zoom חדשה (דורש שילוב Zoom).
   - **חידון** — רב-ברירה. לכל שאלה יש שאלה, אפשרויות, תשובה(ות) נכונה(ות), נקודות.

## סידור מחדש
גרור ושחרר מודולים, שיעורים ונושאים לכל סדר. הסדר הוא מה שסטודנטים רואים.

## כללי נראות
- נושא בשיעור **לא מפורסם** אינו נראה לסטודנטים.
- שיעור במודול **לא מפורסם** אינו נראה.
- הגדר דגלי פרסום לכל רמה להשקה הדרגתית (למשל "שחרר שבוע 2 ביום שני הבא").

## תזכורות שיעור
אם לשיעור יש תאריך/זמן מתוזמן, תזכורת מייל נשלחת אוטומטית (24 שעות ו-30 דקות לפני, לפי הגדרת טריגרי מייל). סטודנטים רשומים לקורס מקבלים אותה. ראה טריגרי מייל להתאמת התזמון.
$body$);

  -- =============================================================
  -- lms-programs
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('lms-programs', 'en', 'Programs (Course Bundles)',
   'LMS', 35,
   ARRAY['lms-programs', 'lms-program-detail']::text[],
   ARRAY['lms-courses', 'lms-create-course', 'payments-products']::text[],
$body$A program bundles multiple courses into a single offering. The student enrolls once and gets access to every course in the bundle.

## When to use programs vs. individual products
- **Program** — courses are designed to be taken together. A year-long certificate track, a multi-month bootcamp.
- **Individual products** — courses are independent. A student might buy just one.

## Creating a program

1. Go to **Admin → LMS → Programs**.
2. Click **Create Program**.
3. Fill in:
   - **Name** — student-facing.
   - **Description** — long-form.
   - **Image** — cover.
4. Click **Create**. You're on the program detail page.
5. In the **Courses** tab, click **Add Course**. Pick courses from the dropdown.
6. Drag to reorder — the order is the suggested learning path.
7. Click **Save**.

## Selling a program
Programs don't sell directly — wrap them in a Product just like a single course:

1. Payments → Products → Create Product.
2. Set type to **Program**.
3. Link the program you just created.
4. Set price + payment plan.
5. Publish.

The student sees one product in their dashboard; clicking it reveals all courses in the bundle.

## Student progress on programs
The student's program page shows:
- Progress bar per course (e.g., "Week 1 — 80% complete").
- Overall program progress (average across courses).
- Lesson schedules across all courses in one timeline view.

## Common pitfalls
- **Mixing free and paid courses** — if a program has 5 courses and a student enrolls in the program, all 5 are unlocked. Make sure that's what you want.
- **Different grading scales** — each course's own grading scale still applies. The program doesn't combine grades into a single GPA.
$body$),
  ('lms-programs', 'he', 'תכניות (חבילות קורסים)',
   'מערכת לימוד', 35,
   ARRAY['lms-programs', 'lms-program-detail']::text[],
   ARRAY['lms-courses', 'lms-create-course', 'payments-products']::text[],
$body$תכנית מאגדת מספר קורסים להצעה אחת. הסטודנט נרשם פעם אחת ומקבל גישה לכל קורס בחבילה.

## מתי להשתמש בתכניות לעומת מוצרים בודדים
- **תכנית** — קורסים מתוכננים להילקח יחד. מסלול תעודה שנתי, bootcamp רב-חודשי.
- **מוצרים בודדים** — קורסים עצמאיים. סטודנט עשוי לקנות רק אחד.

## יצירת תכנית

1. עבור ל**ניהול ← מערכת לימוד ← תכניות**.
2. לחץ **צור תכנית**.
3. מלא:
   - **שם** — נראה לסטודנט.
   - **תיאור** — ארוך.
   - **תמונה** — כיסוי.
4. לחץ **צור**. אתה בדף פרטי התכנית.
5. בלשונית **קורסים**, לחץ **הוסף קורס**. בחר קורסים מהתפריט הנפתח.
6. גרור לסידור מחדש — הסדר הוא מסלול הלמידה המוצע.
7. לחץ **שמור**.

## מכירת תכנית
תכניות לא נמכרות ישירות — עטוף אותן במוצר בדיוק כמו קורס בודד:

1. תשלומים ← מוצרים ← צור מוצר.
2. הגדר סוג ל**תכנית**.
3. קשר את התכנית שיצרת.
4. הגדר מחיר + תכנית תשלום.
5. פרסם.

הסטודנט רואה מוצר אחד בלוח הבקרה שלו; לחיצה עליו מציגה את כל הקורסים בחבילה.

## התקדמות סטודנט בתכניות
דף התכנית של הסטודנט מציג:
- פס התקדמות לכל קורס (למשל "שבוע 1 — 80% הושלם").
- התקדמות כללית של התכנית (ממוצע בין הקורסים).
- לוחות זמנים של שיעורים בכל הקורסים בתצוגת ציר זמן אחת.

## טעויות נפוצות
- **ערבוב קורסים חינמיים ובתשלום** — אם לתכנית יש 5 קורסים והסטודנט נרשם לתכנית, כל 5 נפתחים. ודא שזה מה שאתה רוצה.
- **סקלות ציון שונות** — סקלת הציון של כל קורס עדיין חלה. התכנית לא משלבת ציונים ל-GPA יחיד.
$body$);

  -- =============================================================
  -- lms-attendance
  -- =============================================================
  INSERT INTO public.help_articles
    (slug, locale, title, category, display_order, page_slugs, related_slugs, body_markdown)
  VALUES
  ('lms-attendance', 'en', 'Attendance Tracking',
   'LMS', 36,
   ARRAY['lms-course-attendance', 'attendance-reports']::text[],
   ARRAY['lms-courses', 'lms-modules-lessons']::text[],
$body$For live or in-person lessons, you can mark which students attended. This is optional but useful for compliance, parent reports, and grade calculations.

## Where to mark attendance
**Admin → LMS → Courses → [your course] → Attendance** tab.

You'll see:
- One row per enrolled student.
- One column per scheduled lesson.
- Cells: tick to mark **Present**, leave empty for **Absent**, click "L" for **Late**, "E" for **Excused**.

## Marking flow

1. Pick a lesson from the dropdown (or "All lessons" for the matrix view).
2. Tick students who attended.
3. Optionally click a cell for status (Present / Late / Excused / Absent).
4. Click **Save**. Only changed cells are sent.

## Bulk operations
- **Mark all present** — top of the lesson column → "Mark all present".
- **Import from Zoom** — if the lesson has a Zoom meeting attached, click "Import from Zoom participants" to pre-populate based on who joined.

## Reports
**Attendance → Reports** tab shows aggregated statistics:
- Per-student attendance rate.
- Per-lesson attendance count.
- Trends over time.
- Filter by date range, status type.

Reports can be exported as CSV for parent communications or compliance audits.

## Effect on grades (optional)
You can configure a "Participation" grade category that's auto-populated from attendance: Present = 100%, Late = 75%, Excused = no impact, Absent = 0%. Set this up in **Grading → Categories → Auto-calc settings** (advanced).
$body$),
  ('lms-attendance', 'he', 'מעקב נוכחות',
   'מערכת לימוד', 36,
   ARRAY['lms-course-attendance', 'attendance-reports']::text[],
   ARRAY['lms-courses', 'lms-modules-lessons']::text[],
$body$לשיעורים חיים או פרונטליים, ניתן לסמן אילו סטודנטים נכחו. זה אופציונלי אך שימושי לציות, דוחות להורים וחישובי ציון.

## איפה לסמן נוכחות
**ניהול ← מערכת לימוד ← קורסים ← [הקורס שלך] ← לשונית נוכחות**.

תראה:
- שורה לכל סטודנט רשום.
- עמודה לכל שיעור מתוזמן.
- תאים: סמן ל**נוכח**, השאר ריק ל**נעדר**, לחץ "L" ל**איחור**, "E" ל**מוצדק**.

## תהליך סימון

1. בחר שיעור מהתפריט הנפתח (או "כל השיעורים" לתצוגת מטריצה).
2. סמן סטודנטים שנכחו.
3. אופציונלית לחץ על תא לסטטוס (נוכח / איחור / מוצדק / נעדר).
4. לחץ **שמור**. רק תאים שהשתנו נשלחים.

## פעולות בכמות
- **סמן הכל נוכח** — ראש עמודת השיעור ← "סמן הכל נוכח".
- **ייבא מ-Zoom** — אם לשיעור מצורפת פגישת Zoom, לחץ "ייבא ממשתתפי Zoom" כדי לאכלס מראש לפי מי שהצטרף.

## דוחות
לשונית **נוכחות ← דוחות** מציגה סטטיסטיקות מצטברות:
- שיעור נוכחות לכל סטודנט.
- מספר נוכחות לכל שיעור.
- מגמות לאורך זמן.
- סנן לפי טווח תאריכים, סוג סטטוס.

ניתן לייצא דוחות כ-CSV לתקשורת עם הורים או לביקורות ציות.

## השפעה על ציונים (אופציונלי)
ניתן להגדיר קטגוריית ציון "השתתפות" המאוכלסת אוטומטית מנוכחות: נוכח = 100%, איחור = 75%, מוצדק = ללא השפעה, נעדר = 0%. הגדר זאת ב**ציונים ← קטגוריות ← הגדרות חישוב אוטומטי** (מתקדם).
$body$);

  RAISE NOTICE 'Help articles seed (file 3/6): LMS — 5 articles × 2 locales = 10 rows.';
END $$;
