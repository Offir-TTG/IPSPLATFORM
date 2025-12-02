# Enrollment Link Validation Guide

## Understanding "Invalid Link" Errors

When users see "קישור לא תקין" (Invalid Link) error, it can be caused by several reasons:

### 1. Missing Enrollment Token

**Symptom:** Link shows as `/enroll/undefined` or `/enroll/wizard/{id}`

**Cause:** Enrollment was created without an `enrollment_token`

**Solution:** Run this SQL to check and generate tokens:

```sql
-- Check enrollments without tokens
SELECT id, user_id, status, enrollment_token, created_at
FROM enrollments
WHERE enrollment_token IS NULL OR enrollment_token = ''
ORDER BY created_at DESC;

-- Generate tokens for enrollments that don't have them
UPDATE enrollments
SET
  enrollment_token = gen_random_uuid()::text,
  token_expires_at = NOW() + INTERVAL '7 days'
WHERE enrollment_token IS NULL OR enrollment_token = '';
```

### 2. Expired Token

**Symptom:** Error message "This invitation has expired"

**Cause:** `token_expires_at` is in the past

**Solution:** Extend the expiration date:

```sql
-- Check expired tokens
SELECT id, user_id, enrollment_token, token_expires_at,
       token_expires_at < NOW() as is_expired
FROM enrollments
WHERE token_expires_at < NOW()
ORDER BY token_expires_at DESC;

-- Extend expiration by 7 days
UPDATE enrollments
SET token_expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'enrollment-id-here';
```

### 3. Token Not Found in Database

**Symptom:** "Invalid enrollment link" from API

**Cause:** The token doesn't exist in the database (typo in URL or enrollment deleted)

**Solution:** Verify the token exists:

```sql
-- Find enrollment by token
SELECT e.*, u.email, p.title as product_name
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN products p ON e.product_id = p.id
WHERE e.enrollment_token = 'token-from-url-here';
```

### 4. User Mismatch (After Accept)

**Symptom:** "This enrollment is for a different user"

**Cause:** Logged-in user doesn't match the enrollment's `user_id`

**Why This Happens:**
- Admin tests the link while logged in as admin
- But the enrollment is assigned to a different user
- This is **correct security behavior**

**Solutions:**
1. **Admin Testing**: Log out and test in incognito mode, OR
2. **Send to Actual User**: Copy link and send to the enrolled user
3. **Preview Mode** (Future): Add admin preview mode that bypasses user validation

---

## How Enrollment Links Work

### Token Generation

Tokens should be generated when enrollment is created:

```sql
CREATE TABLE enrollments (
  ...
  enrollment_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  ...
);
```

### URL Format

**Public Access (Recommended):**
```
/enroll/{enrollment_token}
```
- No login required to view invitation
- User logs in when clicking "Accept"
- Token provides security

**Authenticated Access (Fallback):**
```
/enroll/wizard/{enrollment_id}
```
- Requires user to be logged in
- Validates logged-in user matches enrollment
- More restrictive

### API Endpoints

1. **GET `/api/enrollments/token/[token]`**
   - Validates token exists and not expired
   - Returns enrollment details (public info only)
   - No authentication required

2. **POST `/api/enrollments/token/[token]/accept`**
   - Requires user to be logged in
   - Validates logged-in user matches enrollment user_id
   - Updates enrollment status
   - Redirects to wizard

---

## Troubleshooting Steps

### Step 1: Check Token in URL
```
Example: /enroll/abc123-def456-ghi789
          ^^^^^^^^ This is the token
```

### Step 2: Verify Token in Database
```sql
SELECT * FROM enrollments WHERE enrollment_token = 'abc123-def456-ghi789';
```

### Step 3: Check Expiration
```sql
SELECT
  enrollment_token,
  token_expires_at,
  token_expires_at > NOW() as is_valid,
  token_expires_at < NOW() as is_expired
FROM enrollments
WHERE enrollment_token = 'abc123-def456-ghi789';
```

### Step 4: Test API Directly
```bash
curl http://localhost:3002/api/enrollments/token/abc123-def456-ghi789
```

Expected successful response:
```json
{
  "id": "...",
  "product_name": "Course Name",
  "total_amount": 100,
  "user_email": "user@example.com",
  ...
}
```

Expected error responses:
- `404: Invalid enrollment link` - Token doesn't exist
- `410: This invitation has expired` - Token expired

---

## Admin Reset Flow

When admin clicks "Reset" on an enrollment:

1. **API**: `/api/admin/enrollments/[id]/reset`
2. **Returns**: `/enroll/{enrollment_token}` URL
3. **Admin copies link** to send to user
4. **User opens link** - sees invitation page
5. **User clicks Accept** - logs in if not already
6. **API validates** user matches enrollment
7. **User proceeds** to enrollment wizard

**Important:** Admin should NOT test the link themselves (will get "different user" error). Send it to the actual enrolled user.

---

## SQL Diagnostic Script

Use the provided `CHECK_ENROLLMENT_TOKENS.sql` script:

```sql
-- Recent enrollments with token status
SELECT
  e.id,
  e.enrollment_token,
  e.token_expires_at > NOW() as is_valid,
  e.status,
  u.email,
  p.title
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN products p ON e.product_id = p.id
ORDER BY e.created_at DESC
LIMIT 10;
```

---

## Best Practices

1. **Always Generate Tokens**: Ensure new enrollments have tokens
2. **Set Reasonable Expiration**: 7-14 days is typical
3. **Send Email with Link**: Don't rely on users finding it manually
4. **Monitor Expiration**: Alert users before token expires
5. **Allow Reset**: Let admins generate new tokens if expired

---

## Future Enhancements

1. **Admin Preview Mode**: Allow admins to preview enrollment pages without user validation
2. **Token Regeneration**: Add "Generate New Link" button for expired tokens
3. **Email Integration**: Auto-send enrollment links via email
4. **Token Analytics**: Track link opens and conversion rates

---

*Last Updated: December 1, 2025*
