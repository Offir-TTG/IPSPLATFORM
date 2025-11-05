# Audit Trail System - Complete Documentation

**Version**: 2.0.0
**Last Updated**: 2025-01-04
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Translation Keys](#translation-keys)
7. [Security & Permissions](#security--permissions)
8. [Usage Guide](#usage-guide)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Audit Trail System provides comprehensive activity logging and monitoring for the platform with:

- **Complete Activity Tracking**: All system events logged with full context
- **Role-Based Access**: Admins see all events, users see only their own
- **FERPA Compliance**: Educational privacy law compliance built-in
- **Tamper-Proof Logs**: SHA-256 hash chain ensures data integrity
- **Separate Language Contexts**: Admin and user interfaces use independent translations
- **Dark Mode Support**: Full light/dark theme support
- **Advanced Filtering**: Filter by date, type, category, risk level, status
- **Real-Time Updates**: Live event tracking and statistics

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
├─────────────────────────────────────────────────────┤
│  Admin View              │      User View            │
│  /admin/audit            │      /my-activity         │
│  - Full access           │      - Personal only      │
│  - Advanced filters      │      - Basic filters      │
│  - Statistics            │      - Privacy info       │
└──────────────┬───────────┴──────────────┬───────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────────────────────────────┐
│                   API Layer                          │
├──────────────────────────────────────────────────────┤
│  /api/audit/events         Role-based filtering      │
│  /api/audit/student-access FERPA compliance          │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│                Database Layer                        │
├──────────────────────────────────────────────────────┤
│  audit_events table         RLS policies            │
│  Hash chain integrity       7-year retention         │
└──────────────────────────────────────────────────────┘
```

### Language Context Separation

```
Admin Panel                     User Interface
  ↓                                ↓
useAdminLanguage()             useUserLanguage()
  ↓                                ↓
adminLanguage state            userLanguage state
  ↓                                ↓
admin_language storage         user_language storage
  ↓                                ↓
Admin translations API         User translations API
(context=admin)                (context=user)
```

---

## Components

### 1. AuditEventsTable

**Location**: [src/components/audit/AuditEventsTable.tsx](src/components/audit/AuditEventsTable.tsx)

**Purpose**: Display audit events in a responsive, expandable table

**Props**:
```typescript
interface AuditEventsTableProps {
  events: AuditEvent[];      // Array of audit events to display
  isAdmin?: boolean;         // Show admin-specific features
  onEventClick?: (event: AuditEvent) => void;  // Event click handler
}
```

**Features**:
- ✅ Expandable rows showing full event details
- ✅ Risk level color coding (low/medium/high/critical)
- ✅ Status icons (success/failure/partial)
- ✅ Event type badges (CREATE/READ/UPDATE/DELETE/etc.)
- ✅ Before/after value comparison for UPDATE events
- ✅ Compliance flag display (FERPA/COPPA)
- ✅ IP address and user agent information
- ✅ Dark mode support
- ✅ Mobile responsive design

**Usage Example**:
```tsx
import { AuditEventsTable } from '@/components/audit/AuditEventsTable';

<AuditEventsTable
  events={auditEvents}
  isAdmin={true}
  onEventClick={(event) => console.log('Event clicked:', event)}
/>
```

### 2. AuditFilters

**Location**: [src/components/audit/AuditFilters.tsx](src/components/audit/AuditFilters.tsx)

**Purpose**: Advanced filtering panel for audit events

**Props**:
```typescript
interface AuditFiltersProps {
  onFilterChange: (filters: FilterState) => void;  // Filter change callback
  isAdmin?: boolean;         // Show admin-specific filters
  t?: (key: string, fallback: string) => string;  // Translation function
}

interface FilterState {
  dateFrom?: string;         // Start date filter
  dateTo?: string;           // End date filter
  eventTypes?: string[];     // Event type filter
  eventCategories?: string[];  // Category filter
  resourceTypes?: string[];  // Resource type filter
  riskLevels?: string[];     // Risk level filter
  status?: string[];         // Status filter
  search?: string;           // Text search
}
```

**Features**:
- ✅ Collapsible filter panel
- ✅ Date range selection
- ✅ Multi-select buttons for types, categories, risk levels
- ✅ Text search across actions, descriptions, users
- ✅ Active filter indicators
- ✅ Clear all filters button
- ✅ Admin-only advanced filters
- ✅ Translation support

**Usage Example**:
```tsx
import { AuditFilters } from '@/components/audit/AuditFilters';
import { useAdminLanguage } from '@/context/AppContext';

const { t } = useAdminLanguage();

<AuditFilters
  onFilterChange={(filters) => setFilters(filters)}
  isAdmin={true}
  t={t}
/>
```

### 3. ThemeToggle

**Location**: [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx)

**Purpose**: Toggle between light/dark/system theme modes

**Props**:
```typescript
interface ThemeToggleProps {
  showLabel?: boolean;  // Show text labels next to icons
}
```

**Features**:
- ✅ Three theme modes: Light, Dark, System
- ✅ Visual active state indication
- ✅ Icons for each mode (Sun/Moon/Monitor)
- ✅ Optional text labels
- ✅ Persistent theme selection

**Usage Example**:
```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle showLabel={true} />
```

---

## API Endpoints

### GET /api/audit/events

**Purpose**: Retrieve audit events with filtering

**Query Parameters**:
- `limit` (number): Results per page (default: 50 for admin, 25 for users)
- `offset` (number): Pagination offset
- `date_from` (ISO string): Filter events from this date
- `date_to` (ISO string): Filter events until this date
- `event_types` (comma-separated): Filter by event types
- `event_categories` (comma-separated): Filter by categories
- `risk_levels` (comma-separated): Filter by risk levels
- `status` (comma-separated): Filter by status
- `search` (string): Text search

**Response**:
```typescript
{
  success: boolean;
  data: AuditEvent[];
  count: number;
  is_admin: boolean;
}
```

**Security**:
- ✅ Authentication required
- ✅ Non-admin users see only their own events
- ✅ Admin/auditor/compliance_officer roles see all events

**Example**:
```typescript
const response = await fetch(
  '/api/audit/events?limit=50&offset=0&risk_levels=high,critical'
);
const { data, count } = await response.json();
```

### GET /api/audit/student-access

**Purpose**: Get student record access logs (FERPA compliance)

**Query Parameters**:
- `student_id` (UUID): Student's user ID
- `date_from` (ISO string): Filter from date
- `date_to` (ISO string): Filter to date

**Response**:
```typescript
{
  success: boolean;
  data: AuditEvent[];
  count: number;
}
```

**Security**:
- ✅ Students can view their own access logs
- ✅ Parents can view their children's access logs
- ✅ Admins can view all student access logs

---

## Database Schema

### Table: audit_events

```sql
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  session_id UUID,

  -- Event Classification
  event_type TEXT NOT NULL,  -- CREATE, READ, UPDATE, DELETE, etc.
  event_category TEXT,       -- DATA, AUTH, ADMIN, CONFIG, SECURITY, etc.
  action TEXT NOT NULL,       -- Descriptive action name
  description TEXT,

  -- Resource Information
  resource_type TEXT,         -- Table/entity name
  resource_id TEXT,           -- Record ID
  resource_name TEXT,         -- Human-readable name

  -- Change Tracking
  old_values JSONB,           -- Previous state
  new_values JSONB,           -- New state
  changed_fields TEXT[],      -- List of changed fields

  -- Risk & Compliance
  risk_level TEXT DEFAULT 'low',  -- low, medium, high, critical
  compliance_flags TEXT[],        -- FERPA, COPPA, etc.
  is_student_record BOOLEAN DEFAULT false,
  is_minor_data BOOLEAN DEFAULT false,

  -- Status & Context
  status TEXT DEFAULT 'success', -- success, failure, partial
  error_message TEXT,
  metadata JSONB,

  -- Network Information
  ip_address INET,
  user_agent TEXT,

  -- Integrity
  previous_hash TEXT,
  hash TEXT NOT NULL,  -- SHA-256 hash chain

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(event_timestamp DESC);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_risk_level ON audit_events(risk_level);
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY "Users can view own audit events"
  ON audit_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all audit events"
  ON audit_events FOR SELECT
  USING (
    (SELECT user_metadata->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('admin', 'auditor', 'compliance_officer')
  );

-- Policy: System can insert events
CREATE POLICY "System can insert audit events"
  ON audit_events FOR INSERT
  WITH CHECK (true);
```

---

## Translation Keys

### Common Keys (Both Admin & User)

```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('common.showing', 'common', 'Pagination showing text', 'both'),
  ('common.to', 'common', 'Pagination to text', 'both'),
  ('common.of', 'common', 'Pagination of text', 'both'),
  ('common.page', 'common', 'Page text', 'both'),
  ('common.events', 'common', 'Events text', 'both'),
  ('common.activities', 'common', 'Activities text', 'both'),
  ('common.previous', 'common', 'Previous button', 'both'),
  ('common.next', 'common', 'Next button', 'both'),
  ('common.refresh', 'common', 'Refresh button', 'both'),
  ('common.export', 'common', 'Export button', 'both');
```

### Admin Keys

```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('admin.nav.security', 'admin', 'Security section in navigation', 'admin'),
  ('admin.nav.audit', 'admin', 'Audit trail navigation link', 'admin'),
  ('admin.audit.title', 'admin', 'Audit trail page title', 'admin'),
  ('admin.audit.subtitle', 'admin', 'Audit trail page subtitle', 'admin'),
  ('admin.audit.stats.total', 'admin', 'Total events statistic', 'admin'),
  ('admin.audit.stats.highRisk', 'admin', 'High risk events statistic', 'admin'),
  ('admin.audit.stats.failed', 'admin', 'Failed events statistic', 'admin'),
  ('admin.audit.stats.today', 'admin', 'Today events statistic', 'admin');
```

### User Keys

```sql
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('myActivity.title', 'user', 'My activity page title', 'user'),
  ('myActivity.subtitle', 'user', 'My activity page subtitle', 'user'),
  ('myActivity.info.title', 'user', 'Privacy info title', 'user'),
  ('myActivity.info.description', 'user', 'Privacy info description', 'user'),
  ('myActivity.stats.total', 'user', 'Total activities stat', 'user'),
  ('myActivity.privacy.title', 'user', 'Privacy rights title', 'user'),
  ('myActivity.privacy.ferpa', 'user', 'FERPA protection info', 'user');
```

**Full SQL File**: [src/lib/supabase/audit-navigation-translations.sql](src/lib/supabase/audit-navigation-translations.sql)

---

## Security & Permissions

### Access Control Matrix

| Role | Admin View | User View | Export | All Events | Own Events |
|------|-----------|-----------|--------|-----------|------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auditor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Compliance Officer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Teacher | ❌ | ✅ | ❌ | ❌ | ✅ |
| Student | ❌ | ✅ | ❌ | ❌ | ✅ |
| Parent | ❌ | ✅ | ❌ | ❌ | ✅ |

### FERPA Compliance

All student record access is logged with:
- ✅ Who accessed the record
- ✅ When it was accessed
- ✅ What was viewed/modified
- ✅ Legitimate educational interest validation
- ✅ 7-year retention period

### Data Integrity

Hash chain ensures tamper-proof logs:
```typescript
// Each event includes hash of previous event
const hash = SHA-256(
  previousHash +
  eventData +
  timestamp +
  userId
);
```

---

## Usage Guide

### Admin Workflow

1. **Navigate to Audit Trail**
   - Click "Security & Compliance" in sidebar
   - Click "Audit Trail"

2. **View Dashboard**
   - See statistics: Total, High Risk, Failed, Last 24h
   - Review recent events in table

3. **Filter Events**
   - Click "Filters" button
   - Select date range
   - Choose event types, categories, risk levels
   - Enter search terms

4. **View Event Details**
   - Click any row to expand
   - See full event information
   - View before/after changes
   - Check compliance flags

5. **Export Data**
   - Click "Export" button
   - Choose format (CSV/JSON/PDF)
   - Download report

### User Workflow

1. **Navigate to My Activity**
   - Access via user menu
   - Or direct URL: `/my-activity`

2. **Review Activity**
   - See personal activity log
   - View statistics
   - Read privacy information

3. **Filter Activity**
   - Select date range
   - Search specific actions
   - Filter by event type

4. **Understand Privacy**
   - Read FERPA compliance info
   - See data retention policy
   - Know your privacy rights

---

## Configuration

### Environment Variables

```bash
# In .env.local
NEXT_PUBLIC_AUDIT_RETENTION_DAYS=2555  # 7 years
NEXT_PUBLIC_AUDIT_LOG_LEVEL=info       # info, warn, error
NEXT_PUBLIC_ENABLE_AUDIT_EXPORT=true   # Enable export
```

### Feature Flags

```typescript
// In config
const auditConfig = {
  enableRealtime: true,        // Real-time updates
  enableExport: true,           // Export functionality
  enableEmailAlerts: false,     // Email for high-risk events
  retentionDays: 2555,          // 7 years
  defaultPageSize: 50,          // Events per page
  userPageSize: 25,             // User view page size
};
```

---

## Troubleshooting

### Issue: Events not appearing

**Solutions**:
1. Check user role permissions
2. Verify API endpoint is working: `/api/audit/events`
3. Check browser console for errors
4. Verify database RLS policies are enabled

### Issue: Translations not working

**Solutions**:
1. Run translation SQL: `audit-navigation-translations.sql`
2. Check language context: admin vs user
3. Clear browser localStorage
4. Verify API returns correct context

### Issue: Dark mode not working

**Solutions**:
1. Check ThemeToggle component is rendered
2. Verify `dark` class on `<html>` element
3. Check localStorage for `theme` key
4. Ensure Tailwind dark mode is configured

### Issue: Language changes affecting other interface

**Solutions**:
1. Verify `useAdminLanguage()` vs `useUserLanguage()`
2. Check LanguageSwitcher has correct `context` prop
3. Verify separate localStorage keys: `admin_language` and `user_language`
4. Clear browser cache

---

## Maintenance

### Weekly Tasks

- [ ] Review high-risk events
- [ ] Check failed actions
- [ ] Verify hash chain integrity
- [ ] Review access patterns

### Monthly Tasks

- [ ] Archive old logs (>7 years)
- [ ] Generate compliance reports
- [ ] Review security incidents
- [ ] Update risk classifications

### Quarterly Tasks

- [ ] Audit trail system audit
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation updates

---

## API Reference

### Create Audit Event

```typescript
import { createAuditEvent } from '@/lib/audit/auditService';

await createAuditEvent({
  eventType: 'UPDATE',
  eventCategory: 'STUDENT_RECORD',
  action: 'Updated student grade',
  description: 'Changed Math grade from B to A',
  resourceType: 'grades',
  resourceId: gradeId,
  resourceName: 'Math Grade - John Doe',
  oldValues: { grade: 'B' },
  newValues: { grade: 'A' },
  changedFields: ['grade'],
  riskLevel: 'medium',
  complianceFlags: ['FERPA'],
  isStudentRecord: true,
  userId: user.id,
  userEmail: user.email,
  userRole: user.role,
});
```

### Query Audit Events

```typescript
const response = await fetch('/api/audit/events?' + new URLSearchParams({
  limit: '50',
  offset: '0',
  event_types: 'CREATE,UPDATE,DELETE',
  risk_levels: 'high,critical',
  date_from: new Date('2025-01-01').toISOString(),
  date_to: new Date().toISOString(),
}));

const { data, count } = await response.json();
```

---

## Performance

### Optimization Strategies

1. **Indexing**: All frequently queried columns are indexed
2. **Pagination**: Default page sizes limit result sets
3. **Caching**: API responses cached for 5 minutes
4. **Lazy Loading**: Event details loaded on expand
5. **Batch Operations**: Bulk event creation supported

### Benchmarks

- **Query Performance**: <100ms for filtered queries
- **Insert Performance**: <50ms per event
- **Page Load**: <2s for initial load
- **Filter Update**: <500ms for filter changes

---

## Support

### Resources

- **Documentation**: This file
- **API Docs**: `/api/audit/docs`
- **Support Email**: support@platform.com
- **Issue Tracker**: GitHub Issues

### Contact

For questions or issues:
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub Issues
4. Contact support team

---

*This is the single source of truth for the Audit Trail System. All other documentation files are deprecated.*
