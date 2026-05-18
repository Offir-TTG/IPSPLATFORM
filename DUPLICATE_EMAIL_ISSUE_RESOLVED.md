# Duplicate Email Issue - RESOLVED ✅

## Root Cause Identified

**The email queue processor was trying to update non-existent database columns**, causing the UPDATE to fail. This meant:

1. Email gets sent successfully via SMTP ✅
2. UPDATE tries to set `message_id`, `error_message`, `failed_at` ❌
3. UPDATE fails because these columns don't exist ❌
4. Email status stays as `'pending'` ❌
5. Next cron run (2 minutes later) finds same "pending" email
6. Sends it AGAIN
7. Repeat every 2 minutes → **TONS OF DUPLICATE EMAILS**

## What Was Broken

### File: `src/app/api/cron/process-email-queue/route.ts`

**Line 117**: Tried to update `message_id` (doesn't exist)
```typescript
.update({
  status: 'sent',
  sent_at: new Date().toISOString(),
  message_id: result.messageId,  // ❌ Column doesn't exist!
})
```

**Lines 129-130**: Tried to update `error_message` and `failed_at` (don't exist)
```typescript
.update({
  status: 'failed',
  error_message: result.error,   // ❌ Column doesn't exist!
  failed_at: new Date().toISOString(),  // ❌ Column doesn't exist!
})
```

## The Fix

### Removed non-existent columns from all UPDATE statements:

**For successful sends:**
```typescript
.update({
  status: 'sent',
  sent_at: new Date().toISOString(),
  // Removed message_id
})
```

**For failed sends:**
```typescript
.update({
  status: 'failed',
  // Removed error_message and failed_at
})
```

### Added error checking:
```typescript
const { error: updateError } = await supabase
  .from('email_queue')
  .update({ ... })
  .eq('id', email.id);

if (updateError) {
  console.error(`CRITICAL: Failed to mark email as sent:`, updateError);
}
```

## What About Duplicate Detection?

The duplicate detection in `lesson-reminders` cron was **NOT the issue**. It works correctly:
- Checks for existing emails with same `lessonId` and `user_id`
- Skips users who already have pending/sent emails

**However**, because emails were never being marked as 'sent', every new cron run thought they were new lessons!

## Verification Steps

### 1. Clean up pending emails:
```sql
UPDATE email_queue
SET status = 'sent', sent_at = NOW()
WHERE status = 'pending'
  AND template_variables->>'lessonId' IS NOT NULL;
```

### 2. Test process-email-queue locally:
- Send a test email
- Check it gets marked as 'sent'
- Verify it's not sent again

### 3. Check database after test:
```sql
SELECT id, status, sent_at, created_at
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

Should show status = 'sent' and sent_at populated.

### 4. Re-enable crons (after verification):
Add back to `vercel.json`:
```json
{
  "path": "/api/cron/lesson-reminders",
  "schedule": "0/15 * * * *"
},
{
  "path": "/api/cron/process-email-queue",
  "schedule": "0/2 * * * *"
}
```

## Timeline

1. ✅ Identified root cause (non-existent columns)
2. ✅ Fixed update statements
3. ✅ Committed and pushed to production
4. ⏳ Clean up pending emails in database
5. ⏳ Verify fix in production
6. ⏳ Re-enable crons

## Lessons Learned

1. **Always check for update errors** - Silent failures cause data integrity issues
2. **Match code to schema** - Don't assume columns exist
3. **Test with real data** - Would have caught the failed UPDATE
4. **Add monitoring** - Should alert if updates fail

## Status

- **Fix deployed**: ✅ Yes
- **Crons disabled**: ✅ Yes (preventing more duplicates)
- **Database cleanup needed**: ⚠️ Run cleanup SQL
- **Ready to re-enable**: ⏳ After verification
