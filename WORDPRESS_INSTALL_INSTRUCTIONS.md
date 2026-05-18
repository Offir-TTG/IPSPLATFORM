# הוראות התקנה - דף יום פתוח ב-WordPress עם Elementor

## שיטה 1: שימוש ב-HTML Widget (מומלץ - הכי פשוט)

### שלב 1: הכנת העמוד
1. היכנסו ל-WordPress Dashboard
2. לחצו על **Pages > Add New**
3. תנו לעמוד שם: "יום פתוח - הכשרה בהדרכת הורים"
4. לחצו על **Edit with Elementor**

### שלב 2: הגדרות עמוד
1. לחצו על ⚙️ (הגדרות עמוד) בפינה השמאלית התחתונה
2. **Page Layout**: בחרו **Elementor Canvas** (זה מסיר את ה-header וה-footer)
3. שמרו

### שלב 3: הוספת התוכן
1. מחקו את כל הסעיפים הקיימים (אם יש)
2. גררו **HTML Widget** לעמוד
3. פתחו את הקובץ `wordpress-elementor-code.html`
4. **העתיקו את כל התוכן** (Ctrl+A, Ctrl+C)
5. **הדביקו** ב-HTML Widget (Ctrl+V)
6. לחצו **Update**

### שלב 4: הוספת CSS
1. עברו ל: **Appearance > Customize**
2. לחצו על **Additional CSS**
3. פתחו את הקובץ `wordpress-custom-css.css`
4. **העתיקו את כל התוכן**
5. **הדביקו** בשדה Additional CSS
6. לחצו **Publish**

### שלב 5: הגדרות נוספות
1. ודאו שהאתר מוגדר ל-RTL:
   - **Settings > General > Site Language**: עברית
2. בדקו את העמוד במובייל:
   - Elementor > Responsive Mode > Mobile

### שלב 6: עדכון קישור ההרשמה
1. חזרו ל-Elementor
2. מצאו את הכפתור "הרשמה ליום הפתוח"
3. בקוד, חפשו: `href="#registration-form"`
4. החליפו ל-URL של טופס ההרשמה שלכם
5. לחצו **Update**

---

## שיטה 2: בניה ידנית ב-Elementor (יותר גמישות)

אם אתם רוצים יותר שליטה ויכולת עריכה:

### צעדים כלליים:
1. צרו עמוד חדש ב-Elementor
2. לכל סעיף, צרו **Section** חדש
3. השתמשו ב-widgets הבאים:
   - **Heading Widget** - לכותרות
   - **Text Editor Widget** - לפסקאות
   - **Icon List Widget** - לרשימות עם סימנים
   - **Button Widget** - לכפתור ההרשמה

### הגדרות צבעים לכל סעיף:
- **Hero Section**: רקע Gradient (#2c5f7d ל-#4a8fb0)
- **ניווט**: רקע #1e4456
- **סעיפים זוגיים**: רקע #f8f9fa
- **כותרות**: #2c5f7d
- **כפתור CTA**: Gradient (#ff8c42 ל-#ffa94d)

### הגדרות Typography:
- כותרת H1: 45px, Bold
- כותרת H2: 35px, Bold
- טקסט רגיל: 18px
- פונט: Heebo (ניתן להוסיף ב-Elementor > Settings > Style)

---

## שיטה 3: שימוש בקוד HTML עצמאי

אם אתם רוצים להשתמש בדף ללא Elementor:

1. פתחו את `wordpress-open-day-landing-page.html`
2. זה קובץ HTML עצמאי מלא
3. אפשר להעלות אותו כ-Static Page או להטמיע ב-WordPress Template

---

## בדיקות חשובות אחרי ההתקנה

### ✅ Checklist:
- [ ] הדף נראה טוב בדסקטופ
- [ ] הדף נראה טוב במובייל (Responsive)
- [ ] הניווט עובד (לחיצה על קישור מגללת לסעיף)
- [ ] כפתור ההרשמה מוביל לטופס הנכון
- [ ] הצבעים תואמים (כחול וכתום)
- [ ] הטקסט בעברית ו-RTL
- [ ] Smooth scroll עובד

---

## פתרון בעיות נפוצות

### הסעיפים לא full-width:
```css
/* הוסף ל-Additional CSS: */
.elementor-widget-html {
    width: 100% !important;
}
```

### הניווט לא sticky:
```css
.od-nav {
    position: sticky !important;
    top: 0 !important;
    z-index: 1000 !important;
}
```

### הצבעים לא עובדים:
- ודא שה-CSS נוסף ב-Additional CSS
- נסה לרענן את המטמון (Cache)
- בדוק שאין CSS סותר מהתבנית

### הגופן לא עברית:
1. Elementor > Settings > Style > Fonts
2. הוסף: **Heebo** או **Assistant**
3. הגדר כגופן ברירת מחדל

---

## קבצים במארז

1. **wordpress-elementor-code.html** - קוד HTML מוכן להדבקה
2. **wordpress-custom-css.css** - CSS להוספה ב-Customizer
3. **wordpress-open-day-landing-page.html** - דף HTML עצמאי מלא
4. **WORDPRESS_INSTALL_INSTRUCTIONS.md** - המדריך הזה

---

## תמיכה נוספת

אם יש בעיה:
1. ודא ש-Elementor מעודכן לגרסה אחרונה
2. נסה לנקות מטמון (Cache) של WordPress
3. בדוק שאין Plugins סותרים
4. נסה במצב Incognito של הדפדפן

---

**בהצלחה! 🎉**

אם הכל עובד, העמוד אמור להיראות מקצועי וזהה לעיצוב המבוקש.
