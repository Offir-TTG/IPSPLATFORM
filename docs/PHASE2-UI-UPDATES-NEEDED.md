# Phase 2: UI Updates Summary

## Current Status

✅ **Database schema enhanced** with 50+ new fields
✅ **TypeScript types updated**
⏳ **UI forms need to be updated** to collect new information

---

## Files That Need Updates

### 1. Create Tenant Form
**File**: `src/app/superadmin/tenants/create/page.tsx`

**Current**: Basic form with ~10 fields
**Needed**: Comprehensive form with ~60+ fields organized into sections

**New Sections to Add**:
1. Basic Information (4 required fields)
   - Organization Name, Slug, Admin Name, Admin Email

2. Organization Details (5 fields)
   - Type, Industry, Size, Website, Description

3. Contact Information (8 fields)
   - Phone, Support Email/Phone, Billing Email, Technical Contact (3 fields)

4. Address (6 fields)
   - Address Line 1/2, City, State, Postal Code, Country

5. Tax & Legal (3 fields)
   - Legal Name, Tax ID, Registration Number

6. Regional Settings (6 fields)
   - **Default Language: Fixed to "English" (non-editable)**
   - Timezone, Currency, Date Format, Time Format, Week Start

7. Resource Limits (8 fields)
   - Max Users, Courses, Storage GB, Instructors
   - Storage Per User MB, Max File Size MB, Max Video Minutes, Concurrent Sessions

8. Features (3 checkboxes - **all enabled by default**)
   - Courses, Zoom, DocuSign

9. Super Admin Options (7 fields)
   - Internal Notes, Tags, CSM, Referral Source, Partner ID, Campaign Source

10. **NEW: Send Invitation Checkbox**
    - When checked: Generate token and send invitation email
    - When unchecked: Create tenant but mark as "pending onboarding"

**Key Changes**:
- Default language fixed to 'en' (English)
- All features enabled by default
- Auto-generate slug from organization name
- Tag input with add/remove functionality
- Send invitation option

---

### 2. Edit Tenant Form
**File**: `src/app/superadmin/tenants/[id]/page.tsx`

**Current**: Basic edit form
**Needed**: Enhanced form with all new fields + additional sections

**All sections from Create form PLUS**:

11. **Onboarding Status** (Read-only section)
    - Onboarding Completed: Yes/No badge
    - Current Step: X of Y
    - Invitation Sent: Date
    - Invitation Accepted: Date
    - Button: "Resend Invitation" (if not accepted)

12. **Subscription Information** (Read-only for now)
    - Subscription Status badge
    - Current Period dates
    - Next Billing Date
    - Payment Method
    - Note: "Subscription managed through onboarding flow"

13. **Customer Success** (Editable)
    - Health Score (0-100 slider with color indicator)
    - Churn Risk (select: low, medium, high with color badges)
    - Customer Success Manager (email input)
    - Last Activity (read-only, auto-updated)

14. **Activity Timeline** (Future - can skip for now)
    - List of key events

---

### 3. Tenant List View
**File**: `src/app/superadmin/tenants/page.tsx`

**Current**: Basic table with name, status, tier, users, email, created
**Needed**: Enhanced table with more columns and advanced filters

**New Columns to Add**:
1. Organization Type (with icon)
2. Country (flag icon)
3. Health Score (color-coded badge)
4. Onboarding Status (badge: Completed, In Progress, Pending)
5. Tags (show as small badges)
6. Last Activity

**New Filters to Add**:
1. Organization Type (multi-select)
2. Organization Size (multi-select)
3. Country (multi-select)
4. Health Score (High 80+, Medium 50-79, Low <50)
5. Onboarding Status (Completed, In Progress, Pending)
6. Tags (multi-select)
7. Subscription Status (multi-select)
8. Date Range (Created, Last Activity)

**Bulk Actions** (Future):
- Export selected (CSV)
- Add tag to selected
- Assign CSM to selected

---

### 4. API Routes
**Files**:
- `src/app/api/superadmin/tenants/route.ts` - Create/List
- `src/app/api/superadmin/tenants/[id]/route.ts` - Get/Update/Delete

**Updates Needed**:

#### POST `/api/superadmin/tenants` (Create)
```typescript
// Accept all new fields from form
// If send_invitation is true:
//   - Generate secure invitation_token (crypto.randomBytes)
//   - Set invitation_sent_at to NOW()
//   - Send invitation email (future)
// Set defaults for all new fields
// Set onboarding_completed = false, onboarding_step = 0
// Set subscription_status = 'pending'
// Return created tenant with invitation_token if applicable
```

#### GET `/api/superadmin/tenants/[id]` (Get Single)
```typescript
// Return tenant with all fields
// Include calculated fields:
//   - active_users count
//   - courses count
//   - languages count
// Future: Include recent notes (last 10)
```

#### PATCH `/api/superadmin/tenants/[id]` (Update)
```typescript
// Accept all editable fields
// Auto-update last_activity_at to NOW()
// Validate required fields
// Return updated tenant
```

---

## Implementation Approach

### Option 1: Do It All at Once (Recommended)
Update all 4 files in one go:
1. Create comprehensive create form
2. Enhance edit form
3. Update list view with new columns
4. Update API routes

**Pros**: Complete feature, consistent
**Cons**: Larger change, more testing needed

### Option 2: Incremental Updates
1. First: Update API routes to accept new fields
2. Then: Update create form with all sections
3. Then: Update edit form
4. Finally: Enhance list view

**Pros**: Easier to test incrementally
**Cons**: Takes longer, intermediate states may be incomplete

---

## Key Design Principles

1. **English Only**
   - Default language always 'en'
   - Show as disabled input with "English" value
   - Remove other language options

2. **All Features Enabled**
   - Courses: true (checked, enabled)
   - Zoom: true (checked, enabled)
   - DocuSign: true (checked, enabled)
   - Can keep toggles but default to true

3. **Subscription via Onboarding**
   - subscription_tier kept for reference
   - subscription_status = 'pending' initially
   - Will be set during onboarding flow (future)

4. **Invitation Flow**
   - Optional: Super admin can choose to send or not
   - If sent: Generate token, send email
   - If not sent: Tenant created but needs manual setup

5. **Form Organization**
   - Group related fields into cards/sections
   - Use grid layout for responsive design
   - Clear labels with help text
   - Mark required fields with *

6. **Validation**
   - Required: name, slug, admin_name, admin_email
   - Optional: Everything else
   - Client-side validation
   - Server-side validation in API

---

## Effort Estimate

- **Create Form**: ~2-3 hours (large form, many sections)
- **Edit Form**: ~2-3 hours (all sections from create + new sections)
- **List View**: ~1-2 hours (new columns + filters)
- **API Routes**: ~1 hour (field handling, validation)

**Total**: ~6-9 hours of development time

---

## What to Do Now?

**Option A**: I can proceed with updating all files now
- Will take a few minutes to write all the code
- You'll have complete, working forms
- Ready to test immediately

**Option B**: Start with just the API routes
- Smaller change
- Can test API independently
- Then do UI in next session

**Option C**: Provide you with code templates/examples
- You implement at your own pace
- I provide guidance and review

Which would you prefer?
