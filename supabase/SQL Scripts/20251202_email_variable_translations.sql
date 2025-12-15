-- Email Template Variable Translations
-- Translates variable descriptions shown in the editor

DO $$
BEGIN
  -- Delete existing variable translations
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'email_variable.%';

  -- Insert variable description translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Common Variables
  (NULL, 'email_variable.userName', 'en', 'User first name', 'admin'),
  (NULL, 'email_variable.userName', 'he', 'שם פרטי של משתמש', 'admin'),

  (NULL, 'email_variable.userFullName', 'en', 'User full name', 'admin'),
  (NULL, 'email_variable.userFullName', 'he', 'שם מלא של משתמש', 'admin'),

  (NULL, 'email_variable.userEmail', 'en', 'User email address', 'admin'),
  (NULL, 'email_variable.userEmail', 'he', 'כתובת אימייל של משתמש', 'admin'),

  -- Product/Course Variables
  (NULL, 'email_variable.productName', 'en', 'Course or program name', 'admin'),
  (NULL, 'email_variable.productName', 'he', 'שם קורס או תוכנית', 'admin'),

  (NULL, 'email_variable.productType', 'en', 'Type of product', 'admin'),
  (NULL, 'email_variable.productType', 'he', 'סוג מוצר', 'admin'),

  (NULL, 'email_variable.courseName', 'en', 'Course name', 'admin'),
  (NULL, 'email_variable.courseName', 'he', 'שם קורס', 'admin'),

  (NULL, 'email_variable.programName', 'en', 'Program name', 'admin'),
  (NULL, 'email_variable.programName', 'he', 'שם תוכנית', 'admin'),

  -- Enrollment Variables
  (NULL, 'email_variable.enrollmentDate', 'en', 'Enrollment date', 'admin'),
  (NULL, 'email_variable.enrollmentDate', 'he', 'תאריך הרשמה', 'admin'),

  (NULL, 'email_variable.enrollmentUrl', 'en', 'Enrollment link URL', 'admin'),
  (NULL, 'email_variable.enrollmentUrl', 'he', 'קישור URL להרשמה', 'admin'),

  (NULL, 'email_variable.expiresIn', 'en', 'Days until expiration', 'admin'),
  (NULL, 'email_variable.expiresIn', 'he', 'ימים עד תפוגה', 'admin'),

  -- Date Variables
  (NULL, 'email_variable.startDate', 'en', 'Course start date', 'admin'),
  (NULL, 'email_variable.startDate', 'he', 'תאריך התחלת קורס', 'admin'),

  (NULL, 'email_variable.endDate', 'en', 'Course end date', 'admin'),
  (NULL, 'email_variable.endDate', 'he', 'תאריך סיום קורס', 'admin'),

  (NULL, 'email_variable.lessonDate', 'en', 'Lesson date', 'admin'),
  (NULL, 'email_variable.lessonDate', 'he', 'תאריך שיעור', 'admin'),

  (NULL, 'email_variable.lessonTime', 'en', 'Lesson time', 'admin'),
  (NULL, 'email_variable.lessonTime', 'he', 'שעת שיעור', 'admin'),

  -- Payment Variables
  (NULL, 'email_variable.totalAmount', 'en', 'Total enrollment cost', 'admin'),
  (NULL, 'email_variable.totalAmount', 'he', 'עלות הרשמה כוללת', 'admin'),

  (NULL, 'email_variable.amount', 'en', 'Payment amount', 'admin'),
  (NULL, 'email_variable.amount', 'he', 'סכום תשלום', 'admin'),

  (NULL, 'email_variable.currency', 'en', 'Currency code', 'admin'),
  (NULL, 'email_variable.currency', 'he', 'קוד מטבע', 'admin'),

  (NULL, 'email_variable.paymentDate', 'en', 'Payment date', 'admin'),
  (NULL, 'email_variable.paymentDate', 'he', 'תאריך תשלום', 'admin'),

  (NULL, 'email_variable.paymentMethod', 'en', 'Payment method', 'admin'),
  (NULL, 'email_variable.paymentMethod', 'he', 'אמצעי תשלום', 'admin'),

  (NULL, 'email_variable.paymentPlanName', 'en', 'Payment plan name', 'admin'),
  (NULL, 'email_variable.paymentPlanName', 'he', 'שם תוכנית תשלום', 'admin'),

  (NULL, 'email_variable.transactionId', 'en', 'Transaction ID', 'admin'),
  (NULL, 'email_variable.transactionId', 'he', 'מזהה עסקה', 'admin'),

  (NULL, 'email_variable.receiptUrl', 'en', 'Link to receipt', 'admin'),
  (NULL, 'email_variable.receiptUrl', 'he', 'קישור לקבלה', 'admin'),

  -- Lesson Variables
  (NULL, 'email_variable.lessonTitle', 'en', 'Lesson title', 'admin'),
  (NULL, 'email_variable.lessonTitle', 'he', 'כותרת שיעור', 'admin'),

  (NULL, 'email_variable.lessonLocation', 'en', 'Lesson location', 'admin'),
  (NULL, 'email_variable.lessonLocation', 'he', 'מיקום שיעור', 'admin'),

  (NULL, 'email_variable.lessonDescription', 'en', 'Lesson description', 'admin'),
  (NULL, 'email_variable.lessonDescription', 'he', 'תיאור שיעור', 'admin'),

  (NULL, 'email_variable.instructorName', 'en', 'Instructor name', 'admin'),
  (NULL, 'email_variable.instructorName', 'he', 'שם מדריך', 'admin'),

  -- Organization Variables
  (NULL, 'email_variable.organizationName', 'en', 'Organization name', 'admin'),
  (NULL, 'email_variable.organizationName', 'he', 'שם ארגון', 'admin'),

  (NULL, 'email_variable.supportEmail', 'en', 'Support email address', 'admin'),
  (NULL, 'email_variable.supportEmail', 'he', 'כתובת אימייל תמיכה', 'admin'),

  -- URL Variables
  (NULL, 'email_variable.dashboardUrl', 'en', 'Link to user dashboard', 'admin'),
  (NULL, 'email_variable.dashboardUrl', 'he', 'קישור ללוח משתמש', 'admin'),

  (NULL, 'email_variable.courseUrl', 'en', 'Link to course page', 'admin'),
  (NULL, 'email_variable.courseUrl', 'he', 'קישור לדף קורס', 'admin'),

  (NULL, 'email_variable.loginUrl', 'en', 'Link to login page', 'admin'),
  (NULL, 'email_variable.loginUrl', 'he', 'קישור לדף התחברות', 'admin'),

  -- Parent Report Variables
  (NULL, 'email_variable.studentName', 'en', 'Student name', 'admin'),
  (NULL, 'email_variable.studentName', 'he', 'שם תלמיד', 'admin'),

  (NULL, 'email_variable.reportPeriod', 'en', 'Reporting period', 'admin'),
  (NULL, 'email_variable.reportPeriod', 'he', 'תקופת דיווח', 'admin'),

  (NULL, 'email_variable.progressSummary', 'en', 'Progress summary', 'admin'),
  (NULL, 'email_variable.progressSummary', 'he', 'סיכום התקדמות', 'admin'),

  (NULL, 'email_variable.attendanceRate', 'en', 'Attendance rate', 'admin'),
  (NULL, 'email_variable.attendanceRate', 'he', 'אחוז נוכחות', 'admin');

END $$;
