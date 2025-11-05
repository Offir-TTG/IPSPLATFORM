# Debug Instructions for RTL/LTR Issue

I've added comprehensive console logging to track exactly what's happening. Please follow these steps:

## Step 1: Clear Your Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Clear all logs (click the 🚫 icon or press Ctrl+L)

## Step 2: Refresh the Page

Refresh the page and you'll see a detailed log showing:

1. **[INLINE SCRIPT]** - What happens BEFORE React loads
2. **[getInitialLanguage]** - What React reads from localStorage during initialization
3. **[getInitialDirection]** - What direction React calculates
4. **[useState ...]** - What initial state React sets
5. **[loadLanguages]** - What happens when the API is called
6. **[loadLanguages]** - Whether it changes the document attributes

## Step 3: Copy and Send Me the Console Output

Copy **ALL** the console logs (everything with brackets like `[INLINE SCRIPT]`, `[loadLanguages]`, etc.) and send them to me.

I need to see:
- What's in localStorage
- What the inline script sets
- What React initializes with
- What the API returns
- Whether document attributes are being changed

## Step 4: Test Language Switching

1. Clear console again
2. Switch from Hebrew to English (or vice versa)
3. Copy the console logs showing what `[setAdminLanguage]` or `[setUserLanguage]` does
4. Send me those logs too

## Step 5: Test Page Refresh After Switch

1. Switch to English
2. Clear console
3. Refresh the page
4. Copy the console logs
5. Send me those logs

## What I'm Looking For

The logs will show me:

1. **Is there a mismatch** between what the inline script sets and what React initializes?
2. **Is the loadLanguages effect** changing document attributes when it shouldn't?
3. **Is setAdminLanguage** being called when it should be `setUserLanguage`?
4. **Are you in admin pages** (which use admin_language) or user pages (which use user_language)?

## Expected Flow

### On Page Load (Admin Pages)
```
[INLINE SCRIPT] localStorage admin_language: en
[INLINE SCRIPT] Resolved language: en
[INLINE SCRIPT] Setting direction: ltr
[getInitialLanguage] admin_language found: en
[useState adminLanguage] Initial value: en
[loadLanguages] Admin language to use: en
[loadLanguages] ✓ document.dir already correct: ltr
```

### On Language Switch (Admin Pages)
```
[setAdminLanguage] Requested language: he
[setAdminLanguage] Language info: {code: 'he', direction: 'rtl', ...}
[setAdminLanguage] NOT updating document attributes (admin context)
```

**PROBLEM**: If you're seeing `setAdminLanguage` but it's NOT updating document attributes, and you're seeing the direction change, something else is changing it!

### On Page Load (User Pages)
```
[INLINE SCRIPT] localStorage user_language: en
[INLINE SCRIPT] Resolved language: en
[INLINE SCRIPT] Setting direction: ltr
[getInitialLanguage] user_language found: en
[useState userLanguage] Initial value: en
[loadLanguages] User language to use: en
[loadLanguages] ✓ document.dir already correct: ltr
```

### On Language Switch (User Pages)
```
[setUserLanguage] Requested language: he
[setUserLanguage] Language info: {code: 'he', direction: 'rtl', ...}
[setUserLanguage] ⚠️ CHANGING document.dir: ltr → rtl
```

## Send Me These Logs

Once you have the logs, I'll be able to see EXACTLY where the problem is happening and fix it permanently.
