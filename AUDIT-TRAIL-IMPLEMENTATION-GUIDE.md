# Audit Trail System - Implementation Guide

## Overview

This comprehensive audit trail system is designed for educational platforms and complies with:
- **FERPA** (Family Educational Rights and Privacy Act)
- **COPPA** (Children's Online Privacy Protection Act)
- **PPRA** (Protection of Pupil Rights Amendment)
- **GDPR** Article 8 (Children's consent)
- **SOX**, **ISO 27001**, **SOC 2**, **PCI-DSS**

## Table of Contents

1. [Installation](#installation)
2. [Database Setup](#database-setup)
3. [TypeScript Integration](#typescript-integration)
4. [Usage Examples](#usage-examples)
5. [API Endpoints](#api-endpoints)
6. [Compliance](#compliance)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `src/lib/supabase/audit-trail-schema.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (~30-60 seconds)

### Step 2: Verify Installation

Run this query to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'audit_%' OR table_name = 'parental_consent_audit';
```

You should see:
- `audit_events`
- `audit_config`
- `audit_sessions`
- `parental_consent_audit`
- `audit_reports`
- `audit_alerts`
- `audit_compliance_snapshots`

### Step 3: Test the System

```sql
-- Test logging an event
SELECT log_audit_event(
  p_user_id := auth.uid(),
  p_event_type := 'ACCESS',
  p_event_category := 'DATA',
  p_resource_type := 'test',
  p_action := 'Testing audit system'
);

-- Verify it was logged
SELECT * FROM audit_events ORDER BY event_timestamp DESC LIMIT 1;
```

---

## Database Setup

### Tables Created

#### 1. `audit_events` (Main audit log)
Stores all audit events with education-specific fields.

**Key Fields:**
- Standard: `user_id`, `event_type`, `event_category`, `resource_type`
- Education: `student_id`, `parent_id`, `is_student_record`, `is_minor_data`
- Security: `previous_hash`, `event_hash`, `risk_level`
- Compliance: `compliance_flags[]`

#### 2. `parental_consent_audit` (COPPA/FERPA)
Tracks parental consent for children under 13.

**Key Fields:**
- `student_id`, `parent_id`, `consent_type`, `consent_status`
- `coppa_applicable`, `ferpa_applicable`, `gdpr_applicable`
- `expires_at`, `verified_at`

#### 3. `audit_sessions`
Tracks user sessions for security monitoring.

#### 4. `audit_alerts`
Automated alerts for high-risk activities.

#### 5. `audit_reports`
Stores generated compliance reports.

#### 6. `audit_config`
Configuration for what to audit per resource type.

#### 7. `audit_compliance_snapshots`
Point-in-time compliance state snapshots.

### Views Created

17 analytical views including:
- `audit_student_record_access` - FERPA compliance
- `audit_coppa_compliance` - COPPA tracking
- `audit_grade_changes` - Grade modifications
- `parental_consent_dashboard` - Consent overview
- `students_missing_consent` - Compliance risk

---

## TypeScript Integration

### Import the Service

```typescript
import { auditService } from '@/lib/audit';
```

### Basic Usage

```typescript
// Log a simple event
await auditService.logAuditEvent({
  user_id: userId,
  event_type: 'CREATE',
  event_category: 'DATA',
  resource_type: 'courses',
  resource_id: courseId,
  action: 'Created new course',
  description: `Course "${courseName}" was created`,
});
```

### Get Client Information

```typescript
// Automatically get IP and user agent
const clientInfo = auditService.getClientInfo(request);

await auditService.logAuditEvent({
  // ... other params
  ...clientInfo,
});
```

---

## Usage Examples

### 1. Authentication Logging

```typescript
// Successful login
await auditService.logAuthEvent(
  userId,
  'login',
  { method: 'email', two_factor: true }
);

// Failed login attempt
await auditService.logAuthEvent(
  undefined,
  'failed_login',
  { attempted_email: 'user@example.com', reason: 'invalid_password' }
);

// Logout
await auditService.logAuthEvent(
  userId,
  'logout',
  { session_duration_minutes: 45 }
);
```

### 2. Student Record Access (FERPA)

```typescript
// When a teacher views student grades
await auditService.logStudentRecordAccess(
  teacherId,
  studentId,
  'grades',
  gradeId,
  'Viewed student grade report',
  {
    course_id: courseId,
    course_name: 'Mathematics 101',
  }
);
```

### 3. Grade Changes (High-Risk)

```typescript
// When a grade is modified
await auditService.logGradeChange(
  teacherId,
  studentId,
  gradeId,
  { grade: 'B', score: 85, comments: 'Good work' }, // old
  { grade: 'A', score: 92, comments: 'Excellent work' }, // new
  {
    course_id: courseId,
    assignment_name: 'Final Exam',
    reason: 'Grading error correction',
  }
);
```

### 4. Parental Consent (COPPA)

```typescript
// Log consent grant
await auditService.logConsentAction(
  parentId,
  studentId,
  consentId,
  'Granted parental consent for online activities',
  'online_activities',
  {
    verification_method: 'email',
    consent_version: '1.0',
  }
);

// Check if student has valid consent
const hasConsent = await auditService.hasValidConsent(
  studentId,
  'data_collection'
);

if (!hasConsent) {
  // Block action or request consent
  throw new Error('Parental consent required');
}
```

### 5. Data Export (High-Risk)

```typescript
// When exporting student data
await auditService.logDataExport(
  userId,
  'students',
  'csv',
  150, // number of records
  {
    filters: { grade_level: '5th', year: 2024 },
    requester_role: 'administrator',
    purpose: 'Annual report generation',
  }
);
```

### 6. Configuration Changes

```typescript
// When admin changes settings
await auditService.logConfigChange(
  userId,
  'platform_settings',
  settingId,
  { max_students_per_class: 25 }, // old
  { max_students_per_class: 30 }, // new
  { reason: 'Policy update' }
);
```

---

## API Endpoints

### Create API Routes

Create `src/app/api/audit/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/auditor
    // ... role check logic

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const { data, error, count } = await auditService.getAuditEvents(filters);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Student Record Access Endpoint

Create `src/app/api/audit/student-access/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get('student_id');

  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 });
  }

  const { data, error } = await auditService.getStudentRecordAccess(studentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### Parental Consent Endpoint

Create `src/app/api/audit/consent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get('student_id');

  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 });
  }

  const { data, error } = await auditService.getParentalConsent(studentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

---

## Compliance

### FERPA Compliance

**Requirements Met:**
- ✅ All access to student education records is logged
- ✅ 7-year retention for education records
- ✅ Tamper-proof audit trail with hash chain
- ✅ Who, what, when, where tracking
- ✅ Directory information disclosure tracking

**Usage:**
```typescript
// Automatic logging for FERPA-protected resources
await auditService.logStudentRecordAccess(
  userId,
  studentId,
  'transcripts',
  transcriptId,
  'Downloaded student transcript'
);
```

### COPPA Compliance

**Requirements Met:**
- ✅ Parental consent tracking for children under 13
- ✅ Consent verification and expiration
- ✅ Consent withdrawal tracking
- ✅ Age-appropriate data collection logging

**Usage:**
```typescript
// Before collecting data from students under 13
const hasConsent = await auditService.hasValidConsent(
  studentId,
  'data_collection'
);

if (!hasConsent) {
  // Request parental consent first
  return redirectToConsentPage();
}
```

### GDPR Article 8

**Requirements Met:**
- ✅ Consent tracking for students under 16 (EU)
- ✅ Right to access (all events retrievable)
- ✅ Right to rectification (change tracking)
- ✅ Right to erasure (archival system)
- ✅ Data portability (export functionality)

---

## Maintenance

### Daily Tasks

```sql
-- Check high-risk events
SELECT * FROM audit_high_risk_events
WHERE event_timestamp > NOW() - INTERVAL '24 hours';

-- Review open alerts
SELECT * FROM audit_alerts
WHERE status IN ('open', 'investigating')
ORDER BY severity DESC, detected_at DESC;
```

### Weekly Tasks

```sql
-- Verify audit chain integrity
SELECT * FROM verify_audit_chain(
  NOW() - INTERVAL '7 days',
  NOW()
);

-- Check consent expirations
SELECT * FROM parental_consent_dashboard
WHERE expiring_soon_count > 0;
```

### Monthly Tasks

```sql
-- Archive old events
SELECT archive_old_audit_events();

-- Review compliance
SELECT * FROM audit_education_compliance_overview;
```

### Quarterly Tasks

```sql
-- Generate compliance reports
SELECT generate_compliance_report('FERPA', NOW() - INTERVAL '90 days', NOW());
SELECT generate_compliance_report('COPPA', NOW() - INTERVAL '90 days', NOW());

-- Review compliance snapshots
SELECT * FROM audit_compliance_snapshots
WHERE snapshot_date >= NOW() - INTERVAL '90 days'
ORDER BY snapshot_date DESC;
```

---

## Troubleshooting

### Issue: Events Not Being Logged

**Check:**
1. Verify Supabase connection
2. Check user permissions (RLS policies)
3. Verify `log_audit_event` function exists

```sql
-- Test the function directly
SELECT log_audit_event(
  p_user_id := auth.uid(),
  p_event_type := 'ACCESS',
  p_event_category := 'DATA',
  p_resource_type := 'test',
  p_action := 'Test event'
);
```

### Issue: Hash Chain Broken

**Check:**
```sql
-- Verify integrity
SELECT * FROM verify_audit_chain(
  NOW() - INTERVAL '1 day',
  NOW()
);
```

If `is_valid = false`, investigate the `first_invalid_event`.

### Issue: Performance Degradation

**Solutions:**
1. Check index usage:
```sql
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND indexrelname LIKE 'idx_audit_%';
```

2. Archive old events:
```sql
SELECT archive_old_audit_events();
```

3. Vacuum the audit tables:
```sql
VACUUM ANALYZE audit_events;
```

### Issue: Missing Parental Consent

**Find students without consent:**
```sql
SELECT * FROM students_missing_consent
WHERE risk_level = 'CRITICAL - COPPA Violation Risk';
```

---

## Security Best Practices

### 1. Row-Level Security

The audit tables have RLS enabled. Only admins and auditors can read audit logs:

```sql
-- Policy already created in schema
-- audit_events_select_policy allows only admin/auditor roles
```

### 2. Immutable Logs

Audit events CANNOT be updated or deleted:

```sql
-- These policies prevent modifications
-- audit_events_no_update
-- audit_events_no_delete
```

### 3. Hash Chain

Every event is linked to the previous event via SHA-256 hash:

```typescript
// Verify integrity periodically
const { isValid, totalEvents, invalidEvents } =
  await auditService.verifyAuditChain();

if (!isValid) {
  // Alert security team - potential tampering
  console.error(`Hash chain broken! ${invalidEvents} invalid events found`);
}
```

### 4. Access Logging

Every access to parental consent records is automatically logged.

---

## Integration Checklist

- [x] SQL schema deployed
- [x] TypeScript service created
- [ ] API endpoints created
- [ ] Admin dashboard created
- [ ] Scheduled compliance reports configured
- [ ] Alert notifications configured
- [ ] Staff training completed
- [ ] Compliance procedures documented

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Consult the compliance team for regulation-specific questions

---

## Next Steps

1. **Deploy the SQL**: Run `audit-trail-schema.sql` in Supabase
2. **Test the Service**: Create a test event
3. **Create API Endpoints**: Use the examples above
4. **Build Admin UI**: Create audit viewer component
5. **Integrate**: Add audit logging to existing components
6. **Train Staff**: Review compliance procedures
7. **Monitor**: Set up daily/weekly checks

---

*Last Updated: 2025-01-04*
*Version: 1.0.0*
