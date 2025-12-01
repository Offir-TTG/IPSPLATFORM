# Fix 404 Errors for New API Routes

## Problem

You're seeing these 404 errors in the browser console:
```
GET http://localhost:3000/api/admin/users?role=student 404 (Not Found)
GET http://localhost:3000/api/admin/programs 404 (Not Found)
GET http://localhost:3000/api/admin/enrollments? 500 (Internal Server Error)
```

## Root Cause

**Next.js doesn't automatically detect new API route files** while the dev server is running. When we created the new route files:
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/programs/route.ts`

Next.js didn't pick them up because the server was already running.

## Solution

**Restart the Next.js development server:**

### Step 1: Stop the Server
In your terminal where `npm run dev` is running:
- Press `Ctrl + C` to stop the server
- Wait for it to fully stop

### Step 2: Start the Server Again
```bash
npm run dev
```

### Step 3: Wait for Build to Complete
You should see:
```
✓ Ready in [time]
○ Compiling / ...
✓ Compiled / in [time]
```

### Step 4: Test the Endpoints

After restart, test in your browser:

1. **Navigate to** `/admin/enrollments`
2. **Open the browser console** (F12)
3. **Click "Create Enrollment" button** (צור רישום if in Hebrew)
4. **Verify dropdowns load**:
   - ✅ Users dropdown should populate
   - ✅ Programs dropdown should populate
   - ✅ Courses dropdown should populate

## Expected Behavior After Restart

### Users API
**Request**: `GET /api/admin/users?role=student`
**Response**: `200 OK` with array of students

### Programs API
**Request**: `GET /api/admin/programs`
**Response**: `200 OK` with array of programs

### Courses API
**Request**: `GET /api/lms/courses`
**Response**: `200 OK` with `{ success: true, data: [...] }`

## Additional Issue: Enrollments 500 Error

The `/api/admin/enrollments` endpoint is returning a 500 error. This might be due to:

1. **Database schema mismatch** - The enrollments table structure might not match what the API expects
2. **Missing fields** - The API might be trying to query fields that don't exist
3. **Tenant filtering issue** - There might be a problem with tenant-based filtering

### To Debug the Enrollments Error:

1. **Check the server terminal** for the actual error message (the 500 error should have a stack trace)
2. **Look for** error messages like:
   - "column does not exist"
   - "relation does not exist"
   - "null value in column"

### Common Fixes:

#### If you see "user_programs does not exist":
The enrollments table might be named differently. Check your database schema.

#### If you see "column 'enrolled_at' does not exist":
The API expects certain columns. You may need to run migrations to add them.

#### If you see tenant-related errors:
Make sure your user has a proper `tenant_id` set in the `users` table.

## Quick Verification Script

Run this to verify your API endpoints are working:

```bash
# Test users API (should return 401 if not authenticated)
curl http://localhost:3000/api/admin/users?role=student

# Test programs API
curl http://localhost:3000/api/admin/programs

# Test courses API
curl http://localhost:3000/api/lms/courses
```

## Files Created

These new API route files were created and need the server restart:

1. **Users API**: [src/app/api/admin/users/route.ts](../src/app/api/admin/users/route.ts)
   - Lists users filtered by role
   - Requires admin authentication
   - Returns array of users

2. **Programs API**: [src/app/api/admin/programs/route.ts](../src/app/api/admin/programs/route.ts)
   - Lists active programs for the tenant
   - Requires admin authentication
   - Returns array of programs

## Summary

✅ **Solution**: Restart the Next.js dev server
⏰ **Time**: Takes ~30 seconds
🔄 **Command**: Stop with `Ctrl+C`, then run `npm run dev`
✨ **Result**: All 404 errors should be resolved

After restart, the enrollment dialog will properly load users, programs, and courses!
