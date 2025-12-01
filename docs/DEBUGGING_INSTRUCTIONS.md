# Debugging Keap Translations Issue

## Steps to Debug

### 1. Open Browser Developer Console
1. Open your Keap tags page: http://localhost:3001/admin/keap/tags
2. Press F12 to open Developer Tools
3. Go to the **Console** tab

### 2. Check What You See in Console
Look for log messages that start with `[Translations API]`. You should see:

```
[Translations API] User tenant_id: <some-uuid>
[Translations API] Fetched XXX translations for language=he, context=admin, tenant_id=<uuid>
[Translations API] Keap translations in result: XX
```

### 3. Check Browser LocalStorage
In the Console tab, run these commands:

```javascript
localStorage.getItem('tenant_id')
localStorage.getItem('admin_language')
```

### 4. Test Translation Fetching
In the Console, run this:

```javascript
fetch('/api/translations?language=he&context=admin')
  .then(r => r.json())
  .then(data => {
    const keapKeys = Object.keys(data.data).filter(k => k.includes('keap'));
    console.log('Total translations:', Object.keys(data.data).length);
    console.log('Keap translations:', keapKeys.length);
    console.log('Sample Keap keys:', keapKeys.slice(0, 5));
  });
```

### 5. Report Back

Please copy and paste:
1. All `[Translations API]` log messages from the terminal (where npm run dev is running)
2. The localStorage values
3. The results from the fetch test above
4. The SQL query results from check_keap_translations.sql

## What We're Looking For

**Expected:**
- User tenant_id should be: `70d86807-7e7c-49cd-8601-98235444e2ac`
- Keap translations in result should be: **51** (for Hebrew)
- Total translations should be around 200-300

**If Different:**
- If tenant_id is NULL → User doesn't have a tenant assigned
- If Keap count is 0 → Translations in DB have wrong tenant_id
- If API shows 0 total → Query is failing completely

## Quick Fixes to Try

### Fix 1: Clear All Caches
```javascript
// In browser console
localStorage.clear();
location.reload(true);
```

### Fix 2: Check Server Logs
Look at your terminal where `npm run dev` is running.
You should see the log messages there when you refresh the page.
