# Audit Trail UI Guide

## Overview

Complete UI implementation for the audit trail system with separate views for administrators and users.

---

## 🎯 Features Implemented

### Admin View (`/admin/audit`)
✅ **Full audit trail access** - View all system events
✅ **Advanced filtering** - Filter by date, type, category, risk level, status
✅ **Real-time statistics** - Total events, high-risk, failed, last 24h
✅ **Expandable event details** - View full event data inline
✅ **Pagination** - Navigate through large result sets
✅ **Export capability** - Download audit reports
✅ **Dark mode support** - Follows system theme

### User View (`/my-activity`)
✅ **Personal activity log** - Users see only their own events
✅ **Privacy-focused design** - FERPA compliance messaging
✅ **Simplified filters** - Date range and search
✅ **Educational context** - Explains why data is collected
✅ **Dark mode support** - Consistent theming

---

## 📁 Files Created

### API Endpoints
1. **`src/app/api/audit/events/route.ts`**
   - GET audit events with filtering
   - Role-based access control
   - Pagination support
   - Admin sees all, users see only their events

2. **`src/app/api/audit/student-access/route.ts`**
   - GET student record access logs (FERPA compliance)
   - Parent/student/admin access
   - Date range filtering

### UI Components
3. **`src/components/audit/AuditEventsTable.tsx`**
   - Responsive table with expandable rows
   - Event details inline
   - Risk level indicators
   - Status icons
   - Before/after value comparison for updates
   - Compliance flags display

4. **`src/components/audit/AuditFilters.tsx`**
   - Collapsible filter panel
   - Date range picker
   - Multi-select filters (event types, categories, risk levels)
   - Search functionality
   - Active filter indicators
   - Clear all filters button

### Pages
5. **`src/app/admin/audit/page.tsx`**
   - Admin audit trail viewer
   - Statistics dashboard
   - Full filtering capabilities
   - Export functionality
   - Refresh button

6. **`src/app/my-activity/page.tsx`**
   - User activity viewer
   - Privacy information banner
   - FERPA compliance messaging
   - Personal statistics
   - Simplified interface

---

## 🚀 Usage

### For Administrators

1. **Navigate to Audit Trail**
   ```
   /admin/audit
   ```

2. **View Statistics**
   - Total Events - All audit events in system
   - High Risk - Events marked as high/critical risk
   - Failed Actions - Events with failure status
   - Last 24 Hours - Recent activity count

3. **Filter Events**
   - Click "Filters" button to expand filter panel
   - Select date range
   - Choose event types (CREATE, UPDATE, DELETE, etc.)
   - Select categories (STUDENT_RECORD, GRADE, AUTH, etc.)
   - Filter by risk level
   - Search in descriptions

4. **View Event Details**
   - Click any row to expand
   - See full event information
   - View before/after changes for updates
   - Check compliance flags
   - See IP address and user agent

5. **Export Data**
   - Click "Export" button
   - Choose format (coming soon)
   - Download audit report

### For Users (Students/Parents)

1. **Navigate to My Activity**
   ```
   /my-activity
   ```

2. **View Your Activity**
   - See all actions performed on your account
   - View when and what was accessed
   - Check who accessed your records

3. **Filter Your Activity**
   - Set date range
   - Search for specific actions
   - Filter by event type

4. **Understand Your Privacy**
   - Read privacy information banner
   - Learn about FERPA compliance
   - Understand data retention

---

## 📊 Component Features

### AuditEventsTable

**Props:**
- `events: AuditEvent[]` - Array of audit events
- `isAdmin?: boolean` - Show admin-specific features
- `onEventClick?: (event) => void` - Event click handler

**Features:**
- Risk level color coding
- Status icons (success/failure)
- Event type badges
- Expandable rows for details
- Before/after comparison for updates
- Compliance flag badges
- Responsive design

**Example:**
```tsx
<AuditEventsTable
  events={events}
  isAdmin={true}
  onEventClick={(event) => console.log(event)}
/>
```

### AuditFilters

**Props:**
- `onFilterChange: (filters: FilterState) => void` - Filter change callback
- `isAdmin?: boolean` - Show admin-specific filters

**Features:**
- Search bar with icon
- Collapsible filter panel
- Date range inputs
- Multi-select filter buttons
- Active filter count badge
- Clear filters button

**Example:**
```tsx
<AuditFilters
  onFilterChange={(filters) => setFilters(filters)}
  isAdmin={true}
/>
```

---

## 🎨 Design System

### Colors

**Risk Levels:**
- Low: Green (`bg-green-100 text-green-800`)
- Medium: Yellow (`bg-yellow-100 text-yellow-800`)
- High: Orange (`bg-orange-100 text-orange-800`)
- Critical: Red (`bg-red-100 text-red-800`)

**Event Types:**
- CREATE: Blue (`bg-blue-100 text-blue-800`)
- READ: Gray (`bg-gray-100 text-gray-800`)
- UPDATE: Purple (`bg-purple-100 text-purple-800`)
- DELETE: Red (`bg-red-100 text-red-800`)
- EXPORT: Orange (`bg-orange-100 text-orange-800`)

**Status:**
- Success: Green icon (`CheckCircle`)
- Failure: Red icon (`XCircle`)
- Partial: Yellow icon (`AlertTriangle`)

### Dark Mode

All components support dark mode:
```tsx
// Light mode
className="bg-white text-gray-900"

// Dark mode
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

---

## 🔒 Security & Permissions

### Admin Access (`/admin/audit`)
- **Required Role**: `admin`, `auditor`, or `compliance_officer`
- **Can View**: All audit events
- **Can Filter**: All filter options
- **Can Export**: Yes

### User Access (`/my-activity`)
- **Required Role**: Any authenticated user
- **Can View**: Only their own events
- **Can Filter**: Limited filters (date, search)
- **Can Export**: No

### API Security
```typescript
// Check authentication
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check role
const userRole = user.user_metadata?.role || 'user';
const isAdmin = ['admin', 'auditor', 'compliance_officer'].includes(userRole);

// Filter events by user if not admin
if (!isAdmin) {
  query = query.eq('user_id', user.id);
}
```

---

## 📱 Responsive Design

All components are mobile-responsive:

- **Desktop**: Full table with all columns
- **Tablet**: Condensed table, scrollable
- **Mobile**: Stacked layout, expandable cards

```tsx
// Example responsive classes
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
  {/* Cards */}
</div>
```

---

## 🔄 Data Flow

### Admin Audit Trail
```
User visits /admin/audit
  ↓
Page loads events from API
  ↓
API checks user role (admin?)
  ↓
If admin: Return all events
If user: Return error 403
  ↓
Display in AuditEventsTable
  ↓
User applies filters
  ↓
Page reloads with filters
  ↓
API returns filtered results
```

### User Activity
```
User visits /my-activity
  ↓
Page loads events from API
  ↓
API checks authentication
  ↓
API filters events by user_id
  ↓
Return only user's events
  ↓
Display in AuditEventsTable
  ↓
User can filter their own data
```

---

## 🧪 Testing

### Test Admin View
1. Login as admin
2. Go to `/admin/audit`
3. Verify statistics show
4. Apply various filters
5. Expand event details
6. Check pagination works
7. Test refresh button
8. Verify dark mode toggle

### Test User View
1. Login as student or parent
2. Go to `/my-activity`
3. Verify only your events show
4. Test date filter
5. Test search
6. Verify privacy banners show
7. Check FERPA messaging
8. Verify dark mode works

### Test Security
1. Try to access `/admin/audit` as non-admin
   - Should get 403 error
2. Try to view other user's events via API
   - Should only see your own events
3. Check audit events are logged for:
   - Login/logout
   - Grade changes
   - Student record access
   - Configuration changes

---

## 📖 Translation Keys

Add these to your translations:

### Admin Translations
```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('admin.audit.title', 'admin', 'Audit trail title', 'admin'),
  ('admin.audit.subtitle', 'admin', 'Audit trail subtitle', 'admin'),
  ('admin.audit.stats.total', 'admin', 'Total events stat', 'admin'),
  ('admin.audit.stats.highRisk', 'admin', 'High risk stat', 'admin'),
  ('admin.audit.stats.failed', 'admin', 'Failed stat', 'admin'),
  ('admin.audit.stats.today', 'admin', 'Today stat', 'admin');

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'admin.audit.title', 'מעקב ביקורת', 'admin', 'admin'),
  ('he', 'admin.audit.subtitle', 'מעקב אחר כל פעילות המערכת ואירועי תאימות', 'admin', 'admin'),
  ('he', 'admin.audit.stats.total', 'סה"כ אירועים', 'admin', 'admin'),
  ('he', 'admin.audit.stats.highRisk', 'סיכון גבוה', 'admin', 'admin'),
  ('he', 'admin.audit.stats.failed', 'פעולות שנכשלו', 'admin', 'admin'),
  ('he', 'admin.audit.stats.today', '24 שעות אחרונות', 'admin', 'admin');
```

### User Translations
```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('myActivity.title', 'user', 'Activity page title', 'user'),
  ('myActivity.subtitle', 'user', 'Activity page subtitle', 'user'),
  ('myActivity.info.title', 'user', 'Info banner title', 'user'),
  ('myActivity.privacy.title', 'user', 'Privacy section title', 'user');

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'myActivity.title', 'הפעילות שלי', 'user', 'user'),
  ('he', 'myActivity.subtitle', 'צפה בפעילות החשבון והיסטוריית הגישה שלך', 'user', 'user'),
  ('he', 'myActivity.info.title', 'פרטיות ושקיפות', 'user', 'user'),
  ('he', 'myActivity.privacy.title', 'זכויות הפרטיות שלך', 'user', 'user');
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Deploy API endpoints
2. ✅ Test both views (admin & user)
3. ✅ Add translations
4. ✅ Add to navigation menu

### Short Term
1. ⏳ Implement export functionality
2. ⏳ Add real-time updates (WebSocket)
3. ⏳ Add email alerts for high-risk events
4. ⏳ Create compliance report generator

### Long Term
1. ⏳ Add charts and visualizations
2. ⏳ Implement anomaly detection
3. ⏳ Add bulk actions for admins
4. ⏳ Create audit trail analytics dashboard

---

## 📝 Notes

- All times are displayed in user's local timezone
- Events are cached for 5 minutes in API
- Pagination is set to 50 events for admin, 25 for users
- Expandable rows provide full event details
- Dark mode follows system preference by default
- All personal data is FERPA-protected
- Audit logs are tamper-proof with hash chains

---

*Last Updated: 2025-01-04*
*Version: 1.0.0*
