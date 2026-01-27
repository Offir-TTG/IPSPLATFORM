# Audit Tables Analysis

## Summary of Findings

Based on analysis of the codebase, here are all the audit-related tables and their usage:

## Tables Defined in Schema (audit-trail-schema.sql)

### 1. **audit_events** ✅ ACTIVELY USED
- **Purpose**: Main audit log table for all system events
- **FERPA Compliance**: Student education records tracking
- **Usage Locations**:
  - `src/lib/audit/logger.ts:123` - Primary logging function
  - `src/lib/audit/auditService.ts:306` - Query function
  - `src/app/api/audit/events/route.ts:46` - API endpoint
  - **40+ direct inserts** across admin routes (LMS, users, enrollments, etc.)
- **Status**: **CRITICAL - Must be recreated**

### 2. **audit_sessions** ✅ ACTIVELY USED
- **Purpose**: Track user login sessions for security monitoring
- **Usage Locations**:
  - `src/app/api/user/profile/route.ts:56` - Fetches active sessions for profile page
  - Used by logger for session correlation
- **Status**: **IMPORTANT - Must be recreated**

### 3. **audit_alerts** ⚠️ DEFINED BUT MINIMALLY USED
- **Purpose**: Security and compliance alerts
- **Usage Locations**:
  - `src/lib/audit/auditService.ts:477` - `getActiveAlerts()` function
  - Referenced in audit-trail-schema.sql for auto-generated alerts
- **Status**: **Should recreate** (used by audit system for alerting)

### 4. **parental_consent_audit** ⚠️ DEFINED BUT MINIMALLY USED
- **Purpose**: COPPA/FERPA parental consent tracking for minors
- **Usage Locations**:
  - `src/lib/audit/auditService.ts:506` - `getParentalConsent()` function
  - `src/lib/audit/auditService.ts:532` - `hasValidConsent()` function
- **Status**: **Should recreate** (important for COPPA compliance if you have users under 13)

### 5. **audit_reports** ⚠️ DEFINED BUT NOT USED IN CODE
- **Purpose**: Store generated compliance reports
- **Usage Locations**:
  - Defined in schema with RLS policies
  - No direct code references found
  - Used by `generate_compliance_report` function
- **Status**: **OPTIONAL - Can skip if not using report generation**

### 6. **audit_compliance_snapshots** ❌ DEFINED BUT NOT USED
- **Purpose**: Point-in-time compliance state snapshots
- **Usage Locations**:
  - Only referenced in schema file and view definitions
  - No code usage found
- **Status**: **OPTIONAL - Can skip**

## Views Defined in Schema

### 7. **audit_student_record_access** (VIEW) ✅ USED
- **Purpose**: FERPA compliance view for student record access
- **Usage**: `src/app/api/audit/student-access/route.ts:40`
- **Status**: **Must recreate** (requires audit_events table)

### 8. **audit_grade_changes** (VIEW) ✅ USED
- **Purpose**: Track all grade modifications
- **Usage**: `src/lib/audit/auditService.ts:418`
- **Status**: **Must recreate** (requires audit_events table)

### 9. **audit_high_risk_events** (VIEW) ✅ USED
- **Purpose**: Filter high/critical risk events
- **Usage**: `src/lib/audit/auditService.ts:454`
- **Status**: **Must recreate** (requires audit_events table)

### 10. **audit_compliance_summary** (VIEW) ❌ NOT USED
- **Purpose**: Aggregate compliance metrics
- **Usage**: None found in code
- **Status**: **OPTIONAL - Can skip**

## Other Audit-Related Tables Referenced

### 11. **audit_logs** (NOT IN SCHEMA)
- **Referenced in**: `scripts/check-refund-status.ts:91`
- **Status**: ⚠️ **Unknown table** - may be old/deprecated reference

## Recommendations

### MUST RECREATE (Core Functionality):
1. ✅ **audit_events** - Main audit table (40+ insertion points)
2. ✅ **audit_sessions** - Session tracking (used in profile page)
3. ✅ **audit_student_record_access** (view)
4. ✅ **audit_grade_changes** (view)
5. ✅ **audit_high_risk_events** (view)

### SHOULD RECREATE (Compliance Features):
6. ⚠️ **audit_alerts** - Used by auditService for alerts
7. ⚠️ **parental_consent_audit** - COPPA compliance (if you have users under 13)

### OPTIONAL (Not Currently Used):
8. ❌ **audit_reports** - Not used in code, only in schema
9. ❌ **audit_compliance_snapshots** - Not used in code
10. ❌ **audit_compliance_summary** (view) - Not used in code

## Current Issues

After deleting the audit tables, these will break:

### API Routes Breaking (40+):
- All LMS admin routes (lessons, modules, materials, courses)
- All user management routes (create, update, delete users)
- All enrollment routes
- Keap sync routes
- User profile route (audit_sessions query)

### Audit Service Functions Breaking:
- `getAuditEvents()`
- `getStudentRecordAccess()`
- `getGradeChanges()`
- `getHighRiskEvents()`
- `getActiveAlerts()`
- `getParentalConsent()`
- `hasValidConsent()`

### Current User-Facing Features Breaking:
- **User Profile Security Section** - Shows active sessions
- **Admin Audit Trail Page** - Shows all audit events
- **Attendance tracking** - Based on lesson access audit events

## Migration Priority

### Phase 1 (CRITICAL - Do First):
```sql
-- These are actively used and will cause errors
1. audit_events table
2. audit_sessions table
3. audit_student_record_access view
4. audit_grade_changes view
5. audit_high_risk_events view
```

### Phase 2 (IMPORTANT - For Compliance):
```sql
-- Used by auditService but not frequently called
6. audit_alerts table
7. parental_consent_audit table (if applicable)
```

### Phase 3 (OPTIONAL - Future Use):
```sql
-- Not currently used but part of complete audit system
8. audit_reports table
9. audit_compliance_snapshots table
10. audit_compliance_summary view
```

## Action Items

1. ✅ Run the migration I created: `20260126000000_recreate_audit_tables.sql`
   - Creates: audit_events, audit_sessions
   - Creates: All 3 critical views
   - Creates: RLS policies and indexes

2. ✅ Run the functions migration: `20260126000001_audit_functions.sql`
   - Creates: log_audit_event() function
   - Creates: verify_audit_chain() function
   - Creates: generate_compliance_report() function

3. ⚠️ Decide on Phase 2 tables:
   - Do you have users under 13? → Need parental_consent_audit
   - Do you want security alerts? → Need audit_alerts

4. ❌ Skip Phase 3 unless you plan to use those features later
