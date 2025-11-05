# Quick Reference Card

## 🚀 Language & Theme System

### Admin Components
```tsx
import { useAdminLanguage } from '@/context/AppContext';

const { t, language, setLanguage } = useAdminLanguage();

// Use translations
<h1>{t('admin.title', 'Title')}</h1>

// Change language (doesn't affect users)
<select onChange={(e) => setLanguage(e.target.value)}>
  {availableLanguages.map(lang => <option value={lang.code}>{lang.native_name}</option>)}
</select>
```

### User Components
```tsx
import { useUserLanguage } from '@/context/AppContext';

const { t, language, setLanguage } = useUserLanguage();

// Use translations
<p>{t('courses.title', 'Courses')}</p>

// Change language (doesn't affect admin)
<select onChange={(e) => setLanguage(e.target.value)}>
  ...
</select>
```

### Dark Mode
```tsx
import { useTheme } from '@/context/AppContext';

const { isDark, toggleTheme, setTheme } = useTheme();

// Simple toggle
<button onClick={toggleTheme}>
  {isDark ? '☀️' : '🌙'}
</button>

// Full control
<select onChange={(e) => setTheme(e.target.value)}>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="system">System</option>
</select>

// Use in styles
<div className="bg-white dark:bg-gray-900">
  ...
</div>
```

---

## 🔍 Audit Trail System

### Log Events
```tsx
import { auditService } from '@/lib/audit';

// Grade change
await auditService.logGradeChange(
  teacherId, studentId, gradeId,
  { grade: 'B' },  // old
  { grade: 'A' }   // new
);

// Student record access
await auditService.logStudentRecordAccess(
  userId, studentId, 'grades', gradeId,
  'Viewed grade report'
);

// Authentication
await auditService.logAuthEvent(userId, 'login');

// Data export
await auditService.logDataExport(
  userId, 'students', 'csv', 100
);
```

### Retrieve Events
```tsx
// Get audit events
const { data } = await auditService.getAuditEvents({
  date_from: '2024-01-01',
  student_ids: [studentId],
  event_types: ['UPDATE'],
  limit: 50
});

// Get student access logs
const { data } = await auditService.getStudentRecordAccess(studentId);

// Get grade changes
const { data } = await auditService.getGradeChanges(studentId);

// Check consent
const hasConsent = await auditService.hasValidConsent(
  studentId,
  'data_collection'
);
```

---

## 🗄️ Database

### Run Migrations
```sql
-- 1. Audit Trail
-- File: src/lib/supabase/audit-trail-schema.sql
-- Run in Supabase SQL Editor

-- 2. Language Context
-- File: src/lib/supabase/context-aware-translations-migration.sql
-- Run in Supabase SQL Editor
```

### Verify Setup
```sql
-- Check audit tables
SELECT * FROM audit_events LIMIT 1;
SELECT * FROM parental_consent_audit LIMIT 1;

-- Check translations context
SELECT key, context FROM translation_keys WHERE key LIKE 'admin.%' LIMIT 5;

-- Test audit function
SELECT log_audit_event(
  p_user_id := auth.uid(),
  p_event_type := 'ACCESS',
  p_event_category := 'DATA',
  p_resource_type := 'test',
  p_action := 'Test event'
);
```

---

## 📝 Adding Translations

### Admin Translation
```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('admin.new.key', 'admin', 'Description', 'admin');

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'admin.new.key', 'תרגום', 'admin', 'admin'),
  ('en', 'admin.new.key', 'Translation', 'admin', 'admin');
```

### User Translation
```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('user.new.key', 'user', 'Description', 'user');

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'user.new.key', 'תרגום', 'user', 'user'),
  ('en', 'user.new.key', 'Translation', 'user', 'user');
```

### Common Translation
```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('common.new.key', 'common', 'Description', 'both');

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'common.new.key', 'תרגום', 'common', 'both'),
  ('en', 'common.new.key', 'Translation', 'common', 'both');
```

---

## 🎨 Dark Mode Styling

### Common Patterns
```tsx
// Backgrounds
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-800
bg-gray-100 dark:bg-gray-700

// Text
text-gray-900 dark:text-gray-100
text-gray-600 dark:text-gray-400
text-gray-500 dark:text-gray-500

// Borders
border border-gray-200 dark:border-gray-700

// Buttons
bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600

// Inputs
bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-white

// Cards
bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm
```

---

## 🔧 Troubleshooting Commands

### Clear Translation Cache
```bash
curl -X POST http://localhost:3000/api/translations
```

### Verify Audit Chain
```sql
SELECT * FROM verify_audit_chain(NOW() - INTERVAL '1 day', NOW());
```

### Check High-Risk Events
```sql
SELECT * FROM audit_high_risk_events WHERE event_timestamp > NOW() - INTERVAL '24 hours';
```

### Check Missing Consent
```sql
SELECT * FROM students_missing_consent WHERE risk_level = 'CRITICAL - COPPA Violation Risk';
```

---

## 📦 File Locations

### Core Files
- **AppContext**: `src/context/AppContext.tsx`
- **Audit Service**: `src/lib/audit/auditService.ts`
- **Audit Types**: `src/lib/audit/types.ts`
- **API**: `src/app/api/translations/route.ts`

### SQL Files
- **Audit Schema**: `src/lib/supabase/audit-trail-schema.sql`
- **Language Migration**: `src/lib/supabase/context-aware-translations-migration.sql`

### Documentation
- **Implementation Summary**: `IMPLEMENTATION-SUMMARY.md`
- **Audit Guide**: `AUDIT-TRAIL-IMPLEMENTATION-GUIDE.md`
- **Language & Theme Guide**: `LANGUAGE-AND-THEME-GUIDE.md`

---

## ⚡ Performance Tips

### Language
- Cache duration: 5 minutes
- Use separate caches for admin/user contexts
- Clear cache after translation updates

### Audit
- Use views for complex queries
- Archive old events monthly
- Index on frequently queried fields

### Dark Mode
- Use system preference when possible
- Avoid inline styles
- Use Tailwind's `dark:` variants

---

## 🎯 Common Tasks

### Change Admin Language (doesn't affect users)
```tsx
const { setLanguage } = useAdminLanguage();
setLanguage('en'); // Admin now in English, users unaffected
```

### Change User Language (doesn't affect admin)
```tsx
const { setLanguage } = useUserLanguage();
setLanguage('he'); // Users now in Hebrew, admin unaffected
```

### Toggle Theme
```tsx
const { toggleTheme } = useTheme();
toggleTheme(); // Switch between light/dark
```

### Log Important Event
```tsx
await auditService.logAuditEvent({
  user_id: userId,
  event_type: 'UPDATE',
  event_category: 'GRADE',
  resource_type: 'grades',
  resource_id: gradeId,
  action: 'Changed grade',
  old_values: { grade: 'B' },
  new_values: { grade: 'A' },
  student_id: studentId,
  risk_level: 'high',
  compliance_flags: ['FERPA'],
});
```

---

## 📊 Key Metrics

### Audit Tables
- 7 main tables
- 25+ indexes
- 17 analytical views
- 7 utility functions

### Language System
- 2 independent contexts (admin/user)
- 3 storage keys
- 4 hooks
- 3 theme modes

### Compliance
- 8 regulations covered
- 7-year retention
- Tamper-proof logs
- Automated reporting

---

*Keep this card handy for quick reference!*
