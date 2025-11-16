# Tenant Management Enhancement Plan

## Overview

This document outlines the comprehensive enhancement of the tenant management system with detailed organization information, onboarding workflow, and improved super admin interface.

---

## Database Changes

### New SQL Migration File
**File**: [src/lib/supabase/enhance-tenant-schema.sql](src/lib/supabase/enhance-tenant-schema.sql)

**Run this migration to add:**

1. **Organization Details** (14 new fields):
   - `organization_type` - Type of institution (university, college, school, etc.)
   - `industry` - Industry sector
   - `organization_size` - Number of employees
   - `website_url` - Official website
   - `description` - Organization description
   - `phone_number`, `support_phone` - Contact phones
   - And more contact fields

2. **Address Information** (6 fields):
   - Complete address: line1, line2, city, state, postal code, country

3. **Tax & Legal** (3 fields):
   - `tax_id` - VAT/EIN/Tax number
   - `legal_name` - Official registered name
   - `registration_number` - Business registration

4. **Onboarding System** (6 fields):
   - `onboarding_completed`, `onboarding_step`
   - `invitation_token` - For initial tenant setup
   - Invitation tracking dates

5. **Subscription Management** (10 fields):
   - `subscription_id`, `subscription_status`
   - Period tracking for billing
   - Payment information

6. **Enhanced Limits** (4 additional fields):
   - `max_storage_per_user_mb`
   - `max_file_upload_size_mb`
   - `max_video_duration_minutes`
   - `max_concurrent_sessions`

7. **Customer Success** (4 fields):
   - `customer_success_manager`
   - `health_score` (0-100)
   - `last_activity_at`
   - `churn_risk`

8. **New Tables**:
   - `tenant_onboarding_steps` - Track onboarding progress
   - `tenant_notes` - Super admin notes with history

---

## TypeScript Updates

**File**: [src/lib/tenant/types.ts](src/lib/tenant/types.ts)

**Changes Made**:
- ✅ Enhanced `Tenant` interface with all new fields
- ✅ Added `TenantOnboardingStep` interface
- ✅ Added `TenantNote` interface

---

## Enhanced Tenant Creation Form

### New Form Sections

The tenant creation form should now include:

#### 1. **Basic Information** (Required)
- Organization Name * (required)
- Slug * (required - auto-generated from name)
- Admin Name * (required)
- Admin Email * (required)

#### 2. **Organization Details**
- Organization Type (select: university, college, school, training_center, corporate, non_profit, government, other)
- Industry (text input)
- Organization Size (select: 1-50, 51-200, 201-500, 501-1000, 1000+)
- Website URL
- Description (textarea)

#### 3. **Contact Information**
- Phone Number
- Support Email
- Support Phone
- Billing Email
- Technical Contact (name, email, phone)

#### 4. **Address**
- Address Line 1
- Address Line 2
- City
- State/Province
- Postal Code
- Country (select dropdown)

#### 5. **Tax & Legal** (Optional)
- Legal Name
- Tax ID
- Registration Number

#### 6. **Regional Settings**
- Default Language: **ONLY 'English' (en)** - hardcoded
- Timezone (select from list)
- Currency (select: USD, EUR, GBP, ILS)
- Date Format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Time Format (12h, 24h)
- Week Start (Sunday, Monday)

#### 7. **Resource Limits**
- Max Users (number input, default: 100)
- Max Courses (number input, default: 50)
- Max Storage GB (number input, default: 10)
- Max Instructors (number input, default: 10)
- Max Storage Per User MB (default: 500)
- Max File Upload Size MB (default: 100)
- Max Video Duration Minutes (default: 120)

#### 8. **Features** (Keep existing but all default to true)
- Courses (checked by default)
- Zoom Integration (checked by default)
- DocuSign Integration (checked by default)

#### 9. **Super Admin Options**
- Internal Notes (textarea)
- Tags (multi-select or tag input)
- Customer Success Manager (email)
- Referral Source
- Partner ID
- Campaign Source

#### 10. **Send Invitation**
- ✅ Checkbox: "Send invitation to admin email"
- When checked: Generate invitation token and send email
- When unchecked: Create tenant but mark as "pending onboarding"

---

## Enhanced Tenant Edit Form

### Additional Sections to Add

1. **Onboarding Status** (Read-only section):
   - Onboarding Completed: Yes/No
   - Current Step: X of Y
   - Invitation Sent: Date
   - Invitation Accepted: Date
   - Button: "Resend Invitation" (if not accepted)

2. **Subscription Information** (Read-only for now):
   - Subscription Status
   - Current Period
   - Next Billing Date
   - Payment Method
   - Note: "Subscription managed through onboarding flow"

3. **Customer Success** (Editable):
   - Health Score (0-100 slider)
   - Churn Risk (select: low, medium, high)
   - Customer Success Manager (email input)
   - Last Activity (read-only, auto-updated)

4. **Notes Tab** (New section):
   - List of notes with filters (type, priority)
   - Add new note button
   - Note editor with:
     - Type (general, support, billing, technical, success)
     - Priority (low, medium, high, urgent)
     - Title (optional)
     - Content (required)
     - Pin note checkbox

5. **Activity Timeline** (Future enhancement):
   - Show key events: created, onboarded, subscription changes, etc.

---

## Tenant List Enhancements

### New Columns to Add

1. **Organization Type** column (with icons)
2. **Health Score** column (color-coded)
3. **Onboarding Status** badge
4. **Tags** (display as badges)

### New Filters

1. **Organization Type** filter
2. **Organization Size** filter
3. **Country** filter
4. **Health Score** filter (High, Medium, Low)
5. **Onboarding Status** filter (Completed, In Progress, Pending)
6. **Tags** filter (multi-select)
7. **Subscription Status** filter

### Bulk Actions

1. **Export selected** (CSV/Excel)
2. **Add tag to selected**
3. **Assign CSM to selected**
4. **Send bulk notification**

---

## API Changes Needed

### Update Existing Routes

**File**: `src/app/api/superadmin/tenants/route.ts`

**POST** `/api/superadmin/tenants` - Create tenant:
- Accept all new fields
- Generate `invitation_token` if "send_invitation" is true
- Set default values for all new fields
- Create initial onboarding steps
- Send invitation email (if requested)

**File**: `src/app/api/superadmin/tenants/[id]/route.ts`

**GET** `/api/superadmin/tenants/[id]` - Get tenant:
- Include onboarding steps
- Include recent notes (last 10)
- Calculate health score if not set

**PATCH** `/api/superadmin/tenants/[id]` - Update tenant:
- Accept all new fields
- Update `last_activity_at` automatically

### New API Routes to Create

1. **`/api/superadmin/tenants/[id]/notes`**
   - GET: List all notes for tenant
   - POST: Create new note

2. **`/api/superadmin/tenants/[id]/notes/[noteId]`**
   - PATCH: Update note
   - DELETE: Delete note

3. **`/api/superadmin/tenants/[id]/invitation`**
   - POST: Resend invitation
   - GET: Get invitation status

4. **`/api/superadmin/tenants/[id]/onboarding`**
   - GET: Get onboarding progress
   - PATCH: Update onboarding step

5. **`/api/superadmin/tenants/export`**
   - GET: Export tenants to CSV/Excel
   - Query params: filters

---

## Onboarding Flow (For Tenant Admin - Future)

When tenant admin receives invitation:

### Step 1: Accept Invitation
- Click invitation link
- Verify email
- Set password

### Step 2: Organization Profile
- Confirm/update organization details
- Upload logo
- Set branding colors

### Step 3: Select Subscription Plan
- Display available plans
- Show feature comparison
- Select plan and tier
- Enter payment information

### Step 4: Configure Settings
- Language preferences
- Timezone
- Notification preferences

### Step 5: Create First Course (Optional)
- Quick course creation
- Or skip to dashboard

### Step 6: Invite Team Members
- Invite instructors
- Invite admins
- Or skip

### Complete Onboarding
- Mark onboarding as completed
- Redirect to dashboard
- Show success message

---

## Implementation Priority

### Phase 1: Database & Types ✅
- [x] Create migration SQL
- [x] Update TypeScript types

### Phase 2: Enhanced Forms (Next)
- [ ] Update create tenant form with all new fields
- [ ] Update edit tenant form with new sections
- [ ] Add form validation
- [ ] Add field help text/tooltips

### Phase 3: Enhanced List View
- [ ] Add new columns
- [ ] Add advanced filters
- [ ] Add bulk actions
- [ ] Add export functionality

### Phase 4: Notes System
- [ ] Create notes API routes
- [ ] Add notes UI to tenant detail
- [ ] Add notes filters and search

### Phase 5: Invitation System
- [ ] Create invitation email template
- [ ] Add invitation API routes
- [ ] Build invitation acceptance page
- [ ] Add resend invitation functionality

### Phase 6: Onboarding Flow
- [ ] Create onboarding pages
- [ ] Build step-by-step wizard
- [ ] Add subscription selection
- [ ] Integrate payment (Stripe)

---

## Key Design Decisions

1. **Default Language = English Only**
   - When creating tenant, default_language is always 'en'
   - Form shows "English" as non-editable default
   - Rationale: Educational platform needs consistent language

2. **Subscription via Onboarding**
   - Subscription tier selected during onboarding
   - Super admin creates tenant with invitation
   - Admin completes onboarding and selects plan
   - Payment processed during onboarding

3. **All Features Enabled**
   - Courses: true
   - Zoom: true
   - DocuSign: true
   - No feature gating for educational platform

4. **Required vs Optional Fields**
   - Required: name, slug, admin_name, admin_email
   - Highly recommended: organization_type, country, phone
   - Optional: Everything else
   - Validation on frontend and backend

---

## Benefits of Enhanced System

1. **Better Organization Profiles**
   - Comprehensive information for support
   - Better understanding of customer needs
   - Improved communication

2. **Streamlined Onboarding**
   - Clear invitation process
   - Step-by-step setup
   - Integrated subscription selection

3. **Customer Success**
   - Health scores and risk tracking
   - Proactive support
   - Better retention

4. **Compliance & Legal**
   - Tax information collection
   - Legal entity tracking
   - GDPR compliance flags

5. **Better Analytics**
   - Organization size/type reporting
   - Geographic distribution
   - Industry insights

---

## Next Steps

1. ✅ Run the SQL migration: `enhance-tenant-schema.sql`
2. ⏳ Update the create tenant form
3. ⏳ Update the edit tenant form
4. ⏳ Update the tenant list view
5. ⏳ Build invitation system
6. ⏳ Build onboarding flow

---

## Files to Modify

### Super Admin Interface
- [x] `src/lib/supabase/enhance-tenant-schema.sql` - Database migration
- [x] `src/lib/tenant/types.ts` - TypeScript types
- [ ] `src/app/superadmin/tenants/create/page.tsx` - Enhanced creation form
- [ ] `src/app/superadmin/tenants/[id]/page.tsx` - Enhanced edit form
- [ ] `src/app/superadmin/tenants/page.tsx` - Enhanced list with filters
- [ ] `src/app/api/superadmin/tenants/route.ts` - API for create/list
- [ ] `src/app/api/superadmin/tenants/[id]/route.ts` - API for get/update/delete
- [ ] `src/app/api/superadmin/tenants/[id]/notes/route.ts` - Notes API (new)
- [ ] `src/app/api/superadmin/tenants/[id]/invitation/route.ts` - Invitation API (new)

### Tenant Onboarding (Future)
- [ ] `src/app/onboarding/*` - Onboarding wizard pages
- [ ] `src/components/onboarding/*` - Onboarding components
- [ ] `src/lib/onboarding/*` - Onboarding utilities

---

## Status: Phase 1 Complete ✅

Database schema enhanced and TypeScript types updated. Ready to proceed with UI enhancements.
