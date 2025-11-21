# Dashboard Schema Fix - Step-by-Step Instructions

## Problem Summary
Your dashboard is failing because the SQL function assumes database fields that don't exist. After investigation, we found **multiple conflicting schema definitions** in your codebase.

## Immediate Fix (Choose ONE)

### Option 1: Emergency Fix (Recommended - Get Dashboard Working NOW)
This will make the dashboard load immediately, even if it shows empty data.

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Run the entire contents of **`DASHBOARD_FUNCTION_EMERGENCY.sql`**
3. Refresh your dashboard at http://localhost:3003/dashboard
4. **Result**: Dashboard loads with empty state (no errors)

### Option 2: Defensive Fix (Better - Shows Some Data)
This version tries to load real data but handles errors gracefully.

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Run **`DASHBOARD_FUNCTION_DEFENSIVE.sql`**
3. Test with: `SELECT get_user_dashboard_v3('d7cb0921-4af6-4641-bdbd-c14c59eba9dc');`
4. If it works, refresh your dashboard
5. **Result**: Dashboard loads with enrollment data (stats may be zeros)

---

## Diagnostic Instructions (To Fix Completely)

### Step 1: Run Schema Diagnostic
1. Open Supabase Dashboard → SQL Editor
2. Run **`CREATE_COMPREHENSIVE_SCHEMA_CHECK.sql`**
3. **Save ALL the output** - you'll need it

### Step 2: Review the Results
The diagnostic will tell you:
- ✅ Which fields exist in `enrollments` table
- ✅ Whether you have `enrollment_id` or `course_id` in `user_progress`
- ✅ Whether lessons have `end_time` or need calculation
- ✅ All foreign key relationships

### Step 3: Share Results for Custom Fix
Once you run the diagnostic:
1. Save the complete output
2. Share it (especially the "Check specific critical fields" sections)
3. I'll create a perfect dashboard function matching YOUR exact schema

---

## Understanding the Errors

### Error 1: `column e.expires_at does not exist`
**Cause**: Function tried to SELECT `e.expires_at` from enrollments table, but that column doesn't exist.

**Quick Fix**: The emergency/defensive versions don't reference this field.

**Permanent Fix**: Need to know actual enrollments table structure.

### Error 2: `column up.enrollment_id does not exist` (potential)
**Cause**: Function assumes `user_progress` tracks via `enrollment_id`, but it might use `course_id` instead.

**Depends On**: Which schema version you have deployed.

### Error 3: Calculated `end_time`
**Cause**: Lessons don't have `end_time` column - must calculate from `start_time + duration`.

**Status**: Confirmed `duration` field exists, calculation approach is correct.

---

## Why This Happened

Your codebase has **3 different schema definitions**:

1. **`src/lib/supabase/schema.sql`**
   - Original single-tenant design
   - Missing multi-tenant fields
   - OUTDATED

2. **`src/lib/supabase/lms-schema.sql`**
   - Complete multi-tenant LMS
   - Most comprehensive
   - RECOMMENDED

3. **`supabase/migrations/`**
   - Various migration files
   - Some conflict with each other
   - PARTIAL

The dashboard function was written for schema version #3, but your actual database might be running schema #1 or #2.

---

## Next Steps

### Immediate (Do This Now)
1. Run **`DASHBOARD_FUNCTION_EMERGENCY.sql`** to unblock yourself
2. Dashboard will load (empty state is OK for now)

### Short Term (Do Today)
1. Run **`CREATE_COMPREHENSIVE_SCHEMA_CHECK.sql`**
2. Share the output
3. Get a custom function that matches your exact schema

### Long Term (Do This Week)
1. Consolidate to single source of truth (`lms-schema.sql`)
2. Create definitive migration script
3. Update all TypeScript types to match
4. Run full schema verification

---

## Test Commands

### Test Emergency Version
```sql
SELECT get_user_dashboard_v3('d7cb0921-4af6-4641-bdbd-c14c59eba9dc');
```
Should return:
```json
{
  "enrollments": [],
  "upcoming_sessions": [],
  "pending_assignments": [],
  "stats": {"total_courses": 0, ...},
  "recent_activity": []
}
```

### Test Defensive Version
```sql
SELECT get_user_dashboard_v3('d7cb0921-4af6-4641-bdbd-c14c59eba9dc');
```
Should return enrollments if you have any, with basic data populated.

---

## Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `DASHBOARD_FUNCTION_EMERGENCY.sql` | Get dashboard working NOW | Use first to unblock |
| `DASHBOARD_FUNCTION_DEFENSIVE.sql` | Load some real data safely | Use after emergency works |
| `CREATE_COMPREHENSIVE_SCHEMA_CHECK.sql` | Diagnose actual schema | Run to get full picture |
| `SCHEMA_FIX_INSTRUCTIONS.md` | This file | Read for guidance |

---

## Success Criteria

### Phase 1: Dashboard Loads ✓
- No more "Error loading dashboard"
- Page renders (even if empty)
- No console errors

### Phase 2: Shows Real Data ✓
- Enrollments appear (if you have any)
- Course titles display
- Basic stats show

### Phase 3: Complete Features ✓
- Progress percentages calculate correctly
- Upcoming sessions display
- All stats accurate

---

## Need Help?

If the emergency version doesn't work:
1. Check browser console (F12 → Console)
2. Share the exact error message
3. Share the output from running the diagnostic SQL

If the defensive version fails:
1. Share which specific SQL query failed
2. Share the exact PostgreSQL error
3. Share the diagnostic output

The diagnostic will tell us exactly what you have, and we can build a perfect function for your schema.
