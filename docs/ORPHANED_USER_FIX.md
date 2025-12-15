# Orphaned User Records Fix

## Problem
Previously, the enrollment creation API had a critical issue where user creation happened BEFORE all validation steps. This caused orphaned user records when:

1. User creation succeeded
2. Product validation failed (product not found)
3. OR enrollment creation failed (duplicate enrollment, etc.)

**Result**: User records remained in the database with `status: 'invited'` but no associated enrollment.

## Solution
Refactored the enrollment creation flow in `src/app/api/admin/enrollments/route.ts` to follow this order:

### New Flow (POST /api/admin/enrollments)

1. **Validate Required Fields**
   - Check user_id OR user details are provided
   - Check product_id is provided

2. **Verify Admin User**
   - Confirm admin exists in users table
   - Get tenant_id

3. **Validate Product FIRST** ⭐ NEW
   - Fetch product from database
   - Return 404 if product not found
   - Calculate pricing before touching user table

4. **Handle User Creation/Lookup** ⭐ MOVED HERE
   - If `user_id` provided: Verify existing user exists
   - If creating new user:
     - Check email doesn't already exist (return 409 if duplicate)
     - Create user with `status: 'invited'`
   - Set `finalUserId`

5. **Check for Existing Enrollment**
   - Query enrollments table with finalUserId
   - If duplicate found AND we just created a user:
     - **Cleanup**: Delete the user we just created ⭐ NEW
   - Return 409 error

6. **Create Enrollment**
   - Insert enrollment record
   - Return success

## Key Changes

### Before (Problematic)
```typescript
// User created FIRST
if (!user_id) {
  const newUserId = randomUUID();
  await supabase.from('users').insert({ ... });
  finalUserId = newUserId;
}

// Product validation AFTER user creation
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('id', product_id)
  .single();

if (!product) {
  // ERROR: User already created but product doesn't exist!
  return error;
}
```

### After (Fixed)
```typescript
// Product validation FIRST
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('id', product_id)
  .single();

if (!product) {
  return error; // Exit before creating user
}

// User creation AFTER validation
if (!user_id) {
  const newUserId = randomUUID();
  await supabase.from('users').insert({ ... });
  finalUserId = newUserId;
}

// Cleanup if enrollment check fails
if (existingEnrollment && !user_id) {
  await supabase.from('users').delete().eq('id', finalUserId);
}
```

## Benefits

1. **No Orphaned Users**: Users are only created after validating the product exists
2. **Automatic Cleanup**: If duplicate enrollment detected, newly created user is deleted
3. **Better Error Handling**: Validation failures don't leave database in inconsistent state
4. **Improved UX**: Users see accurate "email already exists" messages

## Testing Recommendations

1. **Test Invalid Product**:
   - Attempt to create enrollment with non-existent product_id
   - Verify no user record is created

2. **Test Duplicate Email**:
   - Attempt to create enrollment with existing email
   - Verify proper 409 error without creating duplicate user

3. **Test Duplicate Enrollment**:
   - Create enrollment successfully
   - Attempt to create same enrollment again
   - Verify user is cleaned up (if newly created)

4. **Test Successful Flow**:
   - Create enrollment with new user
   - Verify both user and enrollment are created
   - Check user status is 'invited'

## Files Modified

- `src/app/api/admin/enrollments/route.ts` (Lines 267-364)
  - Moved product validation before user creation
  - Added user cleanup on duplicate enrollment detection
  - Added comprehensive comments explaining the flow

## Migration Required

Before testing, run the database migration:
- `RUN_THIS_TO_FIX_ENROLLMENT_ISSUES_FIXED.sql`

This fixes:
- Incorrect `users_id_fkey` constraint
- Missing `expires_at` column in enrollments
- Missing translations for stats cards
