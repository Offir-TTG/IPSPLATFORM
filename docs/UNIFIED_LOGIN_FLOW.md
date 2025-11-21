# Unified Login Flow

## Overview

The platform now has a **unified login system** that automatically redirects users to the appropriate portal based on their role.

## Login URL

**Single login page for all users:**
```
http://localhost:3005/login
```

## Role-Based Routing

### After successful login, users are automatically redirected based on their role:

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                                │
│                http://localhost:3005/login                   │
│                                                              │
│  "Welcome Back - Sign in to your account to continue"       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    [Authentication]
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │ Admin Roles │                 │ User Roles  │
    │             │                 │             │
    │ • admin     │                 │ • student   │
    │ • super_admin│                │ • instructor│
    │             │                 │ • parent    │
    └─────────────┘                 └─────────────┘
            │                               │
            ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │   REDIRECT  │                 │   REDIRECT  │
    │     TO      │                 │     TO      │
    │   /admin    │                 │  /dashboard │
    │ /dashboard  │                 │             │
    └─────────────┘                 └─────────────┘
```

## Roles & Portals

### Admin Portal (`/admin/dashboard`)
**Roles:**
- `admin` - Organization administrator
- `super_admin` - Platform super administrator

**Access:**
- Full admin panel
- User management
- System configuration
- LMS management
- Platform settings

### User Portal (`/dashboard`)
**Roles:**
- `student` - Learners
- `instructor` - Teachers/facilitators
- `parent` - Parents (future)

**Access:**
- Personal dashboard
- Learning materials
- Course progress
- Assignments
- Calendar
- Community features

## Implementation Details

### Login Page ([src/app/login/page.tsx](src/app/login/page.tsx:58-66))

```typescript
// Redirect based on user role
// Admin and Super Admin go to admin portal
if (data.data.user.role === 'admin' || data.data.user.role === 'super_admin') {
  router.push('/admin/dashboard');
} else {
  // Students, Instructors, and Parents go to user portal
  // (student, instructor, parent roles)
  router.push('/dashboard');
}
```

### User Portal Layout ([src/app/(user)/layout.tsx](src/app/(user)/layout.tsx:32-39))

```typescript
// Only allow students, instructors, and parents to access user portal
// Admins should use /admin portal
if (userData.role === 'admin' || userData.role === 'super_admin') {
  redirect('/admin/dashboard');
}

// Allow: student, instructor, parent roles
// Future roles can be added here
```

### API Authorization ([src/app/api/user/dashboard/route.ts](src/app/api/user/dashboard/route.ts:86))

```typescript
// Allowed roles for user dashboard API
['student', 'instructor', 'parent']
```

## User Experience

### For Students/Instructors/Parents:
1. Go to `http://localhost:3005/login`
2. Enter credentials
3. **Automatically redirected to** → `/dashboard`
4. See personalized learning dashboard

### For Admins:
1. Go to `http://localhost:3005/login`
2. Enter admin credentials
3. **Automatically redirected to** → `/admin/dashboard`
4. See admin control panel

## No Separate Login Pages

✅ **One login page** for all users
✅ **Smart routing** based on role
✅ **Seamless experience** - users don't need to know which portal to use
✅ **Future-proof** - easy to add new roles (e.g., parent, mentor)

## Role Hierarchy

```
Platform Roles:
├── super_admin (Platform level)
├── admin (Organization level)
└── User Roles
    ├── instructor (Teacher)
    ├── student (Learner)
    └── parent (Guardian - future)
```

## Security

- ✅ Server-side authentication check
- ✅ Role-based access control (RBAC)
- ✅ Automatic redirection to prevent unauthorized access
- ✅ Session management via Supabase Auth
- ✅ Audit logging for all portal access

## Testing the Flow

### Test as Student:
```bash
# 1. Create student account at /signup with role: student
# 2. Login at /login
# 3. Should redirect to /dashboard
```

### Test as Admin:
```bash
# 1. Login with admin credentials at /login
# 2. Should redirect to /admin/dashboard
```

### Test Role Protection:
```bash
# Try accessing /dashboard as admin
→ Automatically redirected to /admin/dashboard

# Try accessing /admin/dashboard as student
→ Access denied (middleware protection)
```

## Future Enhancements

When adding **Parent** role features:

1. **No changes needed to login flow** ✅
2. Parent will automatically go to `/dashboard` ✅
3. Dashboard will show parent-specific content based on role
4. API endpoints already allow `parent` role ✅

### Parent Dashboard Features (Future):
- View children's progress
- Monitor assignments
- Communication with instructors
- Payment history
- Calendar view of children's sessions
