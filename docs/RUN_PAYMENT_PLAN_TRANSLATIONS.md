# Apply Payment Plan Configuration Translations

## Steps to Apply Hebrew Translations

1. **Run the SQL script** in your Supabase SQL Editor:
   - Open the file: `supabase/SQL Scripts/20251201_payment_plan_config_translations.sql`
   - Copy the entire content
   - Go to your Supabase Dashboard → SQL Editor
   - Paste and execute the script

2. **Clear the browser cache** (important!):
   - Open the product dialog in the admin panel
   - Press `Ctrl+Shift+R` (hard refresh) or:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Verify the translations**:
   - Open the Products page in admin panel
   - Click "Register Product" or edit an existing product
   - Select "Deposit + Installments" as payment model
   - Change the "Deposit Type" dropdown:
     - When "Fixed Amount" is selected → Should show "מקדמה ראשונית" (Initial Deposit) in Hebrew
     - When "Percentage" is selected → Should show "אחוז מקדמה" (Deposit Percentage) in Hebrew
   - The field label should show "אחוז מקדמה (%)" when percentage is selected

## Translation Keys Added

### Card Titles (Dynamic based on deposit type selection):
- `products.payment_plan.initial_deposit` → "מקדמה ראשונית"
- `products.payment_plan.deposit_percentage_title` → "אחוז מקדמה"
- `products.payment_plan.deposit` → "הגדרת מקדמה"

### Card Descriptions (Dynamic based on deposit type selection):
- `products.payment_plan.initial_deposit_desc` → "סכום שהלקוח משלם מראש לפני תחילת התשלומים"
- `products.payment_plan.deposit_percentage_desc` → "אחוז ממחיר מלא ששולם מראש לפני תחילת התשלומים"
- `products.payment_plan.deposit_desc` → "הגדר כיצד לקוחות ישלמו את המקדמה הראשונית"

### Field Labels:
- `products.payment_plan.deposit_percentage` → "אחוז מקדמה (%)"
- `products.payment_plan.deposit_calc` → "מקדמה: {currency} {amount}"

## What Changed in the Code

The percentage symbol `(%)` is now **inside the translation string** instead of being hardcoded, so it can be properly localized in Hebrew.

**Before:**
```tsx
<Label>{t('products.payment_plan.deposit_percentage', 'Deposit Percentage')} (%)</Label>
```

**After:**
```tsx
<Label>{t('products.payment_plan.deposit_percentage', 'Deposit Percentage (%)')}</Label>
```

This allows Hebrew translation to be "אחוז מקדמה (%)" with the symbol included.
