# Enrollment User Creation Fix - Memory-Based Wizard

## Problem

The admin enrollment endpoint was creating user records immediately when an enrollment was created, conflicting with the memory-based wizard approach where users should only be created at the END of the wizard.

## Root Cause

**File**: `src/app/api/admin/enrollments/route.ts`

When admin created an enrollment without selecting an existing user:
```typescript
// OLD CODE - Lines 322-334
const newUserId = randomUUID();
const { error: userError } = await supabase.from('users').insert({
  id: newUserId,
  tenant_id: adminData.tenant_id,
  email: userEmail.toLowerCase(),
  first_name: userFirstName,
  last_name: userLastName,
  phone: userPhone || null,
  role: 'student',
  invited_by: user.id,
  status: 'invited',  // ← User created with status='invited'
});

finalUserId = newUserId;
```

This created "ghost" user accounts that existed before the wizard was even started!

## Solution

Updated the admin enrollment endpoint to follow the memory-based wizard approach:

### Changes Made

1. **Do NOT create user immediately** - Store user info in `wizard_profile_data`
2. **Set `user_id` to null** - Enrollment exists without a user initially
3. **User created at wizard completion** - Only when user finishes wizard

### Updated Code

```typescript
// NEW CODE - Lines 287-340
let finalUserId: string | null = null;
let wizardProfileData: any = null;

if (user_id) {
  // Using existing user - link immediately
  finalUserId = user_id;
} else {
  // NEW USER - Do NOT create user yet!
  // Store info for wizard to use later
  wizardProfileData = {
    email: userEmail.toLowerCase(),
    first_name: userFirstName,
    last_name: userLastName,
    phone: userPhone || null,
  };

  console.log('[Admin Enrollment] Storing user info for wizard completion');

  // Leave finalUserId as null - will be set when wizard completes
  finalUserId = null;
}

// Include wizard_profile_data in enrollment
const enrollmentData: any = {
  tenant_id: adminData.tenant_id,
  user_id: finalUserId,  // null for new users
  product_id,
  // ...other fields
};

if (!finalUserId && wizardProfileData) {
  enrollmentData.wizard_profile_data = wizardProfileData;
}
```

## Flow Comparison

### OLD Flow (User Created Immediately)
```
Admin creates enrollment
  ↓
User record created (status='invited')  ← Problem!
  ↓
Enrollment record created (user_id set)
  ↓
Invitation email sent
  ↓
User clicks link → Goes to wizard
  ↓
User already exists (status='invited')
  ↓
Wizard completes → Updates existing user
```

**Problem**: "Ghost" user accounts exist before wizard completion. If user never completes wizard, orphaned user records remain.

### NEW Flow (Memory-Based Wizard)
```
Admin creates enrollment
  ↓
NO user record created  ← Fixed!
  ↓
Enrollment record created (user_id=null)
  ↓
User info stored in wizard_profile_data
  ↓
Invitation email sent
  ↓
User clicks link → Goes to wizard
  ↓
Wizard keeps data in React state
  ↓
User completes wizard → User account created  ← Only here!
  ↓
Enrollment linked to new user
```

**Benefit**: No orphaned users. Clean database. User only exists if they complete wizard.

## Database Schema

The `enrollments` table now supports:

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Can be NULL!
  wizard_profile_data JSONB,  -- Stores user info until account created
  -- ...other fields
);
```

When `user_id` is NULL:
- Enrollment exists but not linked to user yet
- `wizard_profile_data` contains: email, first_name, last_name, phone
- User will be created when wizard completes

When `user_id` is set:
- Enrollment is linked to existing user
- `wizard_profile_data` may be empty or contain historical data

## Duplicate Prevention

Updated duplicate check logic:

```typescript
if (finalUserId) {
  // Existing user - check by user_id
  const existingEnrollment = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', finalUserId)
    .eq('product_id', product_id)
    .single();
} else {
  // New user - check by email in wizard_profile_data
  const existingEnrollments = await supabase
    .from('enrollments')
    .select('id, wizard_profile_data')
    .eq('product_id', product_id)
    .is('user_id', null);

  const duplicateEnrollment = existingEnrollments.find(
    (e: any) => e.wizard_profile_data?.email?.toLowerCase() === userEmail.toLowerCase()
  );
}
```

This prevents:
- Creating multiple enrollments for the same user_id + product_id
- Creating multiple enrollments for the same email + product_id (before user exists)

## Complete Endpoint Integration

The complete endpoint (`/api/enrollments/token/[token]/complete`) already handles this:

```typescript
export async function POST(request, { params }) {
  const { password, profile, docusignEnvelopeId } = await request.json();

  // 1. Create auth user
  const { data: authData } = await supabase.auth.signUp({
    email: profile.email,
    password: password
  });

  // 2. Create user profile
  await supabase.from('users').insert({
    id: authData.user.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone,
    location: profile.address,
    tenant_id: enrollment.tenant_id,
    role: 'student',
    status: 'active'
  });

  // 3. Link enrollment to new user
  await supabase.from('enrollments').update({
    user_id: authData.user.id,  // ← Set user_id here!
    status: 'active',
    wizard_profile_data: profile,
    docusign_envelope_id: docusignEnvelopeId
  }).eq('id', enrollment.id);
}
```

## Benefits

1. ✅ **No orphaned users** - Users only created if wizard completes
2. ✅ **Clean database** - No "ghost" accounts with status='invited'
3. ✅ **Consistent flow** - Admin enrollment and wizard use same approach
4. ✅ **Better UX** - User creates password at END, not scattered throughout
5. ✅ **Single source of truth** - User data in React state until final write

## Testing

To verify the fix:

1. **Admin creates enrollment** for new user (email, name, phone)
2. **Check users table** → Should be empty (no user created)
3. **Check enrollments table** → Should have record with:
   - `user_id` = null
   - `wizard_profile_data` = {email, first_name, last_name, phone}
4. **User receives invitation email** → Clicks link
5. **User goes through wizard** → Fills profile, signs, pays
6. **User completes wizard** → Creates password
7. **Check users table** → User now exists with status='active'
8. **Check enrollments table** → `user_id` now set, status='active'

## Files Changed

- ✅ `src/app/api/admin/enrollments/route.ts` - Updated to use memory-based approach
- ✅ `src/app/api/enrollments/token/[token]/complete/route.ts` - Already supports this
- ✅ `src/app/api/enrollments/token/[token]/send-contract/route.ts` - Accepts profile from request body
- ✅ `src/app/(public)/enroll/wizard/[id]/page.tsx` - Sends profile with all requests

## Migration Notes

**No migration needed!** The database schema already supports:
- `user_id` can be NULL (ON DELETE SET NULL constraint)
- `wizard_profile_data` JSONB field exists

Existing enrollments with `user_id` set will continue to work.
New enrollments will have `user_id` = null until wizard completion.
