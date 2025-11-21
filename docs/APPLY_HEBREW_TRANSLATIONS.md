# Apply Hebrew Translations for All Integrations

## Quick Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Copy and Run the Migration

1. Open the file: `supabase/migrations/20251117_zoom_hebrew_translations.sql`
2. Copy **all** the SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Translations

After running, you should see a summary at the bottom showing:
```
total_zoom_translations | language_code | context
17                      | he            | admin
```

### Step 4: Test in the Application

1. Go to your IPS Platform
2. Navigate to: **Admin → Configuration → Integrations**
3. Switch language to **Hebrew (עברית)** using the language switcher
4. All integration text should now appear in Hebrew! ✅

## What This Adds

### Hebrew translations for ALL integrations:

✅ **Zoom** - All fields and settings
- Account ID, Client ID, Client Secret
- SDK credentials
- Recording options
- Duration settings

✅ **DocuSign** - All fields and settings
- Account ID, Integration Key, User ID
- Private Key, OAuth paths
- Auto-send options
- Reminder and expiration settings

✅ **Stripe** - All fields and settings
- Secret Key, Publishable Key
- Webhook Secret
- Currency and statement descriptor

✅ **SendGrid** - All fields and settings
- API Key
- From Email and Name
- Sandbox mode and tracking

✅ **Twilio** - All fields and settings
- Account SID, Auth Token
- Phone Number
- Messaging Service SID

✅ **Common UI Elements**
- Status messages (Connected, Disconnected, Error)
- Button labels (Save, Test, Show, Hide)
- Success and error messages
- Security notices

## Translations Included

Total translations added: **~60+ keys** covering:
- All integration descriptions
- All credential field labels
- All credential field placeholders
- All settings labels
- All status messages
- All common UI elements

## File Location

The migration file is located at:
```
supabase/migrations/20251117_zoom_hebrew_translations.sql
```

## Alternative: Direct SQL

If you prefer, you can also connect to your database and run:

```bash
psql your-database-connection-string < supabase/migrations/20251117_zoom_hebrew_translations.sql
```

## Expected Result

After applying, when you switch to Hebrew in the admin panel:

### Before:
```
Zoom
Video conferencing and online meetings

Account ID
Your Zoom Account ID
```

### After:
```
Zoom
שיחות וידאו ופגישות מקוונות

מזהה חשבון (Account ID)
מזהה חשבון Zoom שלך
```

## Troubleshooting

### Translation doesn't appear?

1. **Clear cache**: The translations are cached for 5 minutes
2. **Wait 5 minutes** or restart your development server
3. **Hard refresh**: Press Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Still showing English?

1. Verify the SQL ran successfully
2. Check the `translations` table in Supabase
3. Run this query to check:
   ```sql
   SELECT * FROM translations
   WHERE translation_key LIKE 'admin.integrations.%'
   AND language_code = 'he';
   ```

### Mixed Hebrew and English?

- Some keys might be missing
- Check the browser console for translation key warnings
- Add missing translations using the same format

## Need More Translations?

To add more translations, follow this format:

```sql
INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at)
VALUES
  ('he', 'your.translation.key', 'הערך בעברית', 'admin', NOW(), NOW())
ON CONFLICT (language_code, translation_key, context)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();
```

## Success! ✅

Once applied, all integration pages will display in Hebrew when the Hebrew language is selected.

**Questions?** Check the translation key in the page source and add it to the SQL file.
