# Deactivate Account Dialog Update

## Summary
Replaced the browser's native `confirm()` dialog with a proper `AlertDialog` component matching the admin pages pattern for the account deactivation confirmation.

## Changes Made

### 1. Profile Page UI ([src/app/(user)/profile/page.tsx](../src/app/(user)/profile/page.tsx))

#### Added Imports
```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
```

#### Added State
```typescript
const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
```

#### Updated Deactivate Button
**Before:**
```typescript
onClick={handleDeactivateAccount}
```

**After:**
```typescript
onClick={() => setShowDeactivateDialog(true)}
```

#### Updated Handler Function
**Before:**
```typescript
const handleDeactivateAccount = async () => {
  if (!confirm(t('user.profile.security.deactivate_confirm'))) {
    return;
  }
  // ... rest of the code
};
```

**After:**
```typescript
const handleDeactivateAccount = async () => {
  setIsDeactivating(true);
  setShowDeactivateDialog(false);
  // ... rest of the code (no confirm call)
};
```

#### Added AlertDialog Component
```tsx
<AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
  <AlertDialogContent dir={direction}>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('user.profile.security.deactivate_account')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('user.profile.security.deactivate_warning')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDeactivateAccount}
        disabled={isDeactivating}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isDeactivating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" style={{ marginInlineEnd: '0.5rem' }} />
            {t('user.profile.security.deactivating')}
          </>
        ) : (
          t('user.profile.security.deactivate_account')
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 2. Security Translations Migration

#### Updated File: [supabase/migrations/20251125_security_translations.sql](../supabase/migrations/20251125_security_translations.sql)

Added new translation key:
- `user.profile.security.deactivating`
  - English: "Deactivating..."
  - Hebrew: "משבית..."

### 3. Quick Translation Script

Created: [ADD_DEACTIVATING_TRANSLATION.sql](../ADD_DEACTIVATING_TRANSLATION.sql)

Run this in Supabase SQL Editor to add the missing translation without running full migration reset.

## Features

### RTL Support
- Dialog properly supports RTL with `dir={direction}` prop
- Loading spinner has `marginInlineEnd` for proper positioning in both LTR and RTL

### Loading State
- Shows loading spinner and "Deactivating..." text while processing
- Disables the action button during deactivation

### Consistent UI
- Matches the AlertDialog pattern used throughout admin pages
- Uses destructive styling (red) for the dangerous action
- Includes proper cancel option

### Accessibility
- Uses semantic AlertDialog component
- Proper ARIA attributes from shadcn/ui component
- Keyboard navigation support (Escape to close, Tab to navigate)

## Translation Keys Used

| Key | English | Hebrew | Category |
|-----|---------|--------|----------|
| `user.profile.security.deactivate_account` | Deactivate Account | השבת חשבון | user |
| `user.profile.security.deactivating` | Deactivating... | משבית... | user |
| `user.profile.security.deactivate_warning` | Deactivating your account will log you out... | השבתת החשבון תנתק אותך... | user |
| `common.cancel` | Cancel | ביטול | common |

## Testing Checklist

- [ ] Dialog opens when clicking "Deactivate Account" button
- [ ] Dialog shows proper title and warning message
- [ ] Cancel button closes dialog without action
- [ ] Deactivate button triggers the deactivation API
- [ ] Loading state shows during deactivation
- [ ] User is redirected to logout after successful deactivation
- [ ] Dialog is properly positioned in LTR mode
- [ ] Dialog is properly positioned in RTL mode (Hebrew)
- [ ] Keyboard navigation works (Escape, Tab, Enter)
- [ ] Clicking outside dialog closes it (unless loading)

## How to Apply

1. **Run Translation Script** (if needed):
   - Open Supabase SQL Editor
   - Run `ADD_DEACTIVATING_TRANSLATION.sql`

2. **Verify Translation** (optional):
   ```sql
   SELECT * FROM translations
   WHERE translation_key = 'user.profile.security.deactivating';
   ```

3. **Test in UI**:
   - Navigate to Profile → Security tab
   - Click "Deactivate Account" button
   - Verify dialog appears correctly
   - Test cancel and deactivate actions

## References

- Admin delete confirmation pattern: [src/app/admin/lms/courses/page.tsx](../src/app/admin/lms/courses/page.tsx)
- AlertDialog component: [src/components/ui/alert-dialog.tsx](../src/components/ui/alert-dialog.tsx)
- Deactivate API: [src/app/api/user/profile/deactivate/route.ts](../src/app/api/user/profile/deactivate/route.ts)

---

**Last Updated:** 2025-11-25
**Status:** Complete ✅
