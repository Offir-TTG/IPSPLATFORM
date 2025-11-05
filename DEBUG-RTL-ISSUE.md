# Debug RTL/LTR Issue

## How to Debug

I've added console logging to track exactly what's happening with the direction changes.

### Step 1: Open Browser Console

1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Clear the console

### Step 2: Test Scenario 1 - Page Refresh

1. Switch to English (LTR)
2. Refresh the page
3. Watch the console logs

**Expected logs**:
```
[InitScript] Set direction: ltr for language: en
[AppContext] Updating dir: ltr → ltr (should NOT appear if already correct)
```

**If you see**:
```
[InitScript] Set direction: ltr for language: en
[AppContext] Updating dir: ltr → rtl
```
Then the API is returning the wrong direction for English.

### Step 3: Test Scenario 2 - Language Switch

1. Start in Hebrew (RTL)
2. Switch to English
3. Watch the console logs

**Expected logs**:
```
[setUserLanguage] Updating lang: he → en
[setUserLanguage] Updating dir: rtl → ltr
```

### Step 4: Check localStorage

In the console, run:
```javascript
console.log('user_language:', localStorage.getItem('user_language'));
console.log('admin_language:', localStorage.getItem('admin_language'));
console.log('Current dir:', document.documentElement.dir);
console.log('Current lang:', document.documentElement.lang);
```

## Possible Issues & Fixes

### Issue 1: Database has wrong direction for English

If the API returns `direction: 'rtl'` for English:

**Check**: Look at the API response in Network tab
```
GET /api/admin/languages
```

Look for the English language entry - it should have:
```json
{
  "code": "en",
  "direction": "ltr"  // Should be 'ltr' not 'rtl'
}
```

**Fix**: Update database:
```sql
UPDATE languages SET direction = 'ltr' WHERE code = 'en';
```

### Issue 2: Inline script's RTL list is incomplete

If your language isn't in the hardcoded list `['he', 'ar', 'fa', 'ur', 'yi']`, the inline script will default to LTR, but the API might return RTL.

**Fix**: Add your language to the list in [src/app/layout.tsx](src/app/layout.tsx:27)

### Issue 3: Admin language overriding user language

If `admin_language` is set to Hebrew but `user_language` is English, and somehow admin is being used for document attributes.

**Check console for**:
```javascript
localStorage.getItem('admin_language'); // Should NOT affect document
localStorage.getItem('user_language');  // Should control document direction
```

## Send Me the Logs

Please run the tests above and send me the console output showing:

1. What `[InitScript]` logs
2. What `[AppContext]` logs
3. What `[setUserLanguage]` logs
4. localStorage values
5. The API response for `/api/admin/languages`

This will help me identify the exact problem!

## Quick Test Commands

Paste these in console while on the page:

```javascript
// Check current state
console.log('=== CURRENT STATE ===');
console.log('Document dir:', document.documentElement.dir);
console.log('Document lang:', document.documentElement.lang);
console.log('localStorage user_language:', localStorage.getItem('user_language'));
console.log('localStorage admin_language:', localStorage.getItem('admin_language'));

// Fetch language data
fetch('/api/admin/languages')
  .then(r => r.json())
  .then(d => {
    console.log('=== API RESPONSE ===');
    console.log('Languages:', d.data);
    console.log('English direction:', d.data.find(l => l.code === 'en')?.direction);
    console.log('Hebrew direction:', d.data.find(l => l.code === 'he')?.direction);
  });
```
