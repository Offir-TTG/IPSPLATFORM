# Email System Comprehensive Review

## Current Architecture

### Flow:
1. **Lesson Reminders Cron** (every 15 min) → Finds lessons → Finds enrolled students → Calls `processBatchTriggerEvents`
2. **Trigger Engine** → Calls RPC `queue_triggered_email` → Inserts into `email_queue` table
3. **Process Email Queue Cron** (every 2 min) → Finds pending emails → Renders templates → Sends via SMTP

## Critical Issues Found

### Issue #1: RPC Function Has NO Duplicate Prevention ⚠️
**Location**: `fix_queue_triggered_email_schema.sql` (lines 63-97)

**Problem**: The `queue_triggered_email` RPC function just INSERTS every time - no check for existing emails.

**Impact**: Every time the cron runs, it creates NEW emails even if identical ones exist.

**Solution Needed**: Add duplicate check in RPC function BEFORE inserting.

---

### Issue #2: Duplicate Check Logic May Fail 🔴
**Location**: `src/app/api/cron/lesson-reminders/route.ts` (lines 142-160)

**Problem**: The duplicate prevention logic has potential failure points:

```typescript
// Line 155-159: Filters emails by lessonId
const alreadyQueuedUserIds = new Set(
  existingEmails
    ?.filter(e => e.template_variables?.lessonId === lesson.id)
    .map(e => e.user_id || e.template_variables?.userId)
    .filter(Boolean) || []
);
```

**Potential Issues**:
1. `template_variables` might be returned as string instead of parsed JSON
2. Checking both `user_id` and `template_variables.userId` - which one is actually populated?
3. If lessonId doesn't match (wrong type, UUID vs string), filter fails
4. No error logging if filter returns 0 results when it shouldn't

**Evidence**: You got "tons of emails" which means this check isn't working.

---

### Issue #3: message_id Field Doesn't Exist 🔴
**Location**: `src/app/api/cron/process-email-queue/route.ts` (line 117)

**Problem**: Tries to update `message_id` field which doesn't exist in email_queue table.

```typescript
await supabase
  .from('email_queue')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    message_id: result.messageId, // ❌ This field doesn't exist
  })
```

**Impact**: Update might fail silently or throw error, but email still marked as sent.

**Solution**: Remove message_id from update, or add field to schema.

---

### Issue #4: Race Condition Possible ⚠️
**Timing**:
- Lesson reminders: Every 15 minutes
- Email queue: Every 2 minutes

**Problem**: If lesson-reminders runs at 12:00 and queues emails, then runs again at 12:15 before those emails are sent (still pending), it might queue duplicates.

**Mitigation**: The duplicate check should catch this, but only if Issue #2 is fixed.

---

### Issue #5: No Unique Constraint on Database ⚠️
**Problem**: Nothing prevents duplicate emails at the database level.

**Solution**: Add unique constraint or unique index on combination of:
- `user_id` + `template_variables->>'lessonId'` + `status IN ('pending', 'sent')`

This would make duplicates impossible even if app logic fails.

---

## Recommended Fixes (Priority Order)

### FIX #1 (CRITICAL): Add Duplicate Check to RPC Function
Update `queue_triggered_email` RPC to check before inserting:

```sql
-- Check if email already exists for this user + lesson
IF EXISTS (
  SELECT 1 FROM email_queue
  WHERE tenant_id = p_tenant_id
    AND user_id = p_recipient_user_id
    AND template_variables->>'lessonId' = p_template_variables->>'lessonId'
    AND status IN ('pending', 'sent')
    LIMIT 1
) THEN
  -- Return null or existing ID to indicate "already queued"
  RAISE NOTICE 'Email already queued for user % and lesson %',
    p_recipient_user_id, p_template_variables->>'lessonId';
  RETURN NULL;
END IF;
```

### FIX #2 (CRITICAL): Improve Cron Duplicate Detection
Add better logging and type checking:

```typescript
// Log what we're checking
console.log(`[Cron] Checking for existing emails. Sample template_variables type:`,
  typeof existingEmails?.[0]?.template_variables,
  existingEmails?.[0]?.template_variables
);

// Filter for this specific lesson
const lessonEmails = existingEmails?.filter(e => {
  const vars = e.template_variables;
  const lessonId = vars?.lessonId;
  const matches = lessonId === lesson.id;

  if (matches) {
    console.log(`[Cron] Found existing email for lesson ${lesson.id}, user ${e.user_id}`);
  }

  return matches;
}) || [];

console.log(`[Cron] Found ${lessonEmails.length} existing emails for lesson ${lesson.id}`);

const alreadyQueuedUserIds = new Set(
  lessonEmails
    .map(e => e.user_id)  // Prefer user_id over template_variables.userId
    .filter(Boolean)
);
```

### FIX #3 (HIGH): Remove message_id Update
Either remove the field or add it to schema:

```typescript
// Option 1: Remove from update
await supabase
  .from('email_queue')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    // Remove message_id line
  })
  .eq('id', email.id);
```

### FIX #4 (MEDIUM): Add Database Unique Index
```sql
-- Create partial unique index to prevent duplicates
CREATE UNIQUE INDEX idx_email_queue_unique_lesson_reminder
ON email_queue (tenant_id, user_id, (template_variables->>'lessonId'))
WHERE status IN ('pending', 'sent')
  AND template_variables->>'lessonId' IS NOT NULL;
```

### FIX #5 (LOW): Add Idempotency Key
Use a hash of lesson+user+trigger as an idempotency key:

```typescript
// In template_variables
idempotency_key: `${lessonId}-${userId}-${triggerId}`
```

Then check for existing emails with same key.

---

## Testing Plan

### Test 1: Verify Duplicate Check Works
1. Run lesson-reminders cron
2. Check email_queue - should have X emails
3. Run lesson-reminders cron again immediately
4. Check email_queue - should STILL have X emails (no new ones)
5. Check logs for "already have emails" messages

### Test 2: Verify No Duplicates After Sending
1. Run lesson-reminders cron (queues emails)
2. Run process-email-queue cron (sends emails, marks as 'sent')
3. Run lesson-reminders cron again
4. Should NOT queue new emails (existing ones are 'sent', should be detected)

### Test 3: Check Database State
```sql
-- Should return 0 if no duplicates
SELECT
  user_id,
  template_variables->>'lessonId' as lesson_id,
  COUNT(*) as duplicate_count
FROM email_queue
WHERE status IN ('pending', 'sent')
  AND template_variables->>'lessonId' IS NOT NULL
GROUP BY user_id, template_variables->>'lessonId'
HAVING COUNT(*) > 1;
```

---

## Immediate Actions Needed

1. ✅ **DONE**: Disabled crons to stop email flood
2. ⏳ **TODO**: Clear pending duplicate emails from database
3. ⏳ **TODO**: Implement FIX #1 (RPC duplicate check)
4. ⏳ **TODO**: Implement FIX #2 (Improved cron logging)
5. ⏳ **TODO**: Implement FIX #3 (Remove message_id)
6. ⏳ **TODO**: Test thoroughly in local environment
7. ⏳ **TODO**: Re-enable crons with monitoring

---

## Questions to Answer

1. **What does email_queue.template_variables actually contain?**
   - Need to SELECT and inspect actual data
   - Is lessonId stored? As what type?

2. **Is user_id populated in email_queue rows?**
   - Check if RPC function sets it correctly (line 84 in RPC)

3. **How many duplicate emails were created?**
   - Query to count duplicates by user+lesson

4. **When did duplicates start?**
   - Check created_at timestamps to see pattern
