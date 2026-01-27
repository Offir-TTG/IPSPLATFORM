# How to Force Browser Refresh

The changes to the audit trail require a hard refresh to see. Try these steps in order:

## Option 1: Hard Refresh (Recommended)
1. Go to http://localhost:3000/admin/audit
2. Press **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)
3. Or press **Ctrl + F5**

## Option 2: Clear Cache Manually
1. Press **F12** to open Developer Tools
2. Right-click on the **Refresh button** (next to address bar)
3. Select **"Empty Cache and Hard Reload"**

## Option 3: Clear Next.js Cache
If the above doesn't work, stop the server and clear Next.js cache:

```bash
# Stop the server (Ctrl + C)
# Then run:
rm -rf .next
npm run dev
```

## Option 4: Incognito/Private Window
1. Open a new **Incognito/Private window** (Ctrl + Shift + N)
2. Go to http://localhost:3000/admin/audit
3. Log in and check the audit page

## What You Should See

### Main Table (Action Column):
```
עודכן פרופיל
שונה: שם פרטי, שם משפחה +6
```
**NO JSON, NO METADATA**

### Expanded Details (When Clicked):
```
שינויים מדויקים (8)

שם פרטי
לפני → אחרי
Offir    אופיר

שם משפחה
לפני → אחרי
Omer    עומר
```

If you're still seeing the old format with JSON or metadata in the action column, the cache hasn't cleared.
