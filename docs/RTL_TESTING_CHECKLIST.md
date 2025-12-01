# Send Enrollment Link Dialog - RTL Testing Checklist

## 🔍 Complete RTL Verification Guide

### Prerequisites
1. ✅ Translations migration has been run
2. ✅ Admin user has access to enrollments page
3. ✅ At least one enrollment exists in the system

## Testing Steps

### Step 1: Access the Dialog
1. Navigate to: **Admin → Enrollments** (`/admin/enrollments`)
2. Find any enrollment in the list
3. Click the **envelope icon** (📧) next to the enrollment

### Step 2: Test English (LTR) Mode

#### Switch to English
1. In admin settings, select **English** as the admin language
2. Refresh the page if needed
3. Open the Send Enrollment Link dialog

#### Visual Checks for English:
- [ ] **Header Icon**: Mail icon should be on the **LEFT** side
- [ ] **Title**: "Send Enrollment Link" - aligned **LEFT**
- [ ] **Description**: Text aligned **LEFT**
- [ ] **User Label**: Icon on **LEFT**, text starts from **LEFT**
- [ ] **User Box**: Name and email aligned **LEFT**
- [ ] **Product Label**: Icon on **LEFT**, text starts from **LEFT**
- [ ] **Product Box**: Product name aligned **LEFT**
- [ ] **Language Label**: Text aligned **LEFT**
- [ ] **Language Dropdown**: Value aligned **LEFT**, shows "🇬🇧 English"
- [ ] **Help Text**: Small text below dropdown aligned **LEFT**
- [ ] **Info Alert**: Blue box with info icon on **LEFT**, text aligned **LEFT**
- [ ] **Cancel Button**: On the **LEFT** (desktop)
- [ ] **Send Link Button**: On the **RIGHT** (desktop), mail icon on **LEFT** of text

### Step 3: Test Hebrew (RTL) Mode

#### Switch to Hebrew
1. In admin settings, select **עברית (Hebrew)** as the admin language
2. Refresh the page
3. Open the Send Enrollment Link dialog

#### Visual Checks for Hebrew:
- [ ] **Header Icon**: Mail icon should be on the **RIGHT** side
- [ ] **Title**: "שלח קישור הרשמה" - aligned **RIGHT**
- [ ] **Description**: "שלח למשתמש הזמנה..." - aligned **RIGHT**
- [ ] **User Label**: Icon on **RIGHT**, "משתמש" aligned **RIGHT**
- [ ] **User Box**: Name and email aligned **RIGHT**
- [ ] **Product Label**: Icon on **RIGHT**, "מוצר" aligned **RIGHT**
- [ ] **Product Box**: Product name aligned **RIGHT**
- [ ] **Language Label**: "שפת האימייל" - aligned **RIGHT**
- [ ] **Language Dropdown**: Value aligned **RIGHT**, shows "🇮🇱 עברית"
- [ ] **Help Text**: "ההזמנה תישלח בשפה זו" - aligned **RIGHT**
- [ ] **Info Alert**: Blue box with info icon on **RIGHT**, text aligned **RIGHT**
  - Text: "המשתמש יקבל אימייל עם קישור מאובטח תקף ל-7 ימים..."
- [ ] **Cancel Button**: "ביטול" - on the **RIGHT** (desktop)
- [ ] **Send Link Button**: "שלח קישור" - on the **LEFT** (desktop), mail icon on **RIGHT** of text

### Step 4: Mobile Responsive Testing

#### Test on Mobile (< 640px width)
1. Open browser DevTools (F12)
2. Switch to mobile view (iPhone/Android simulation)
3. Set width to 375px or 414px
4. Open the Send Enrollment Link dialog

#### Mobile Checks:
- [ ] **Dialog Width**: Full width with proper padding
- [ ] **Content**: All content visible and scrollable
- [ ] **Buttons**: Stacked vertically, full width
- [ ] **Button Order (English)**: Cancel on top, Send Link on bottom
- [ ] **Button Order (Hebrew)**: Cancel on top (ביטול), Send Link on bottom (שלח קישור)
- [ ] **Touch Targets**: All buttons and dropdowns easy to tap (minimum 44px height)
- [ ] **Max Height**: Dialog doesn't exceed 90vh, content scrolls if needed

### Step 5: Functional Testing

#### Test Email Sending
1. Configure SMTP settings in `.env.local` (if not done):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

2. Open the Send Enrollment Link dialog
3. Select **English** language
4. Click "Send Link"
5. Verify:
   - [ ] Success toast appears
   - [ ] Dialog closes automatically
   - [ ] Email received in English
   - [ ] Email has proper LTR layout

6. Repeat with **Hebrew** language:
   - [ ] Success toast in Hebrew
   - [ ] Email received in Hebrew
   - [ ] Email has proper RTL layout

### Step 6: Theme Testing

#### Test Dark Mode
1. Switch system/browser to dark mode
2. Open the Send Enrollment Link dialog
3. Verify:
   - [ ] Dialog background is dark
   - [ ] Text is readable (high contrast)
   - [ ] Info alert has dark blue background
   - [ ] All borders visible in dark mode
   - [ ] Icons use correct dark mode colors

## Common Issues and Fixes

### Issue 1: Text Not Aligned in Hebrew
**Symptom**: Text appears left-aligned even in Hebrew mode

**Fix**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check if translations are loaded:
   ```sql
   SELECT * FROM translations
   WHERE translation_key LIKE 'admin.enrollments.sendLink%'
   AND language_code = 'he';
   ```

### Issue 2: Icons Not Positioned Correctly
**Symptom**: Icons appear on wrong side in RTL

**Check**:
1. Verify `direction` value in component
2. Use browser DevTools to inspect element classes
3. Look for `flex-row-reverse` class in RTL mode

### Issue 3: Select Dropdown Not RTL
**Symptom**: Dropdown content appears LTR in Hebrew mode

**Fix**:
1. Verify `dir={direction}` prop on SelectContent
2. Check if `direction` state is properly set
3. Inspect with DevTools to see if `dir="rtl"` attribute is present

### Issue 4: Mobile Layout Broken
**Symptom**: Buttons not stacking or dialog too wide

**Fix**:
1. Check if Tailwind is properly configured
2. Verify responsive classes: `sm:max-w-[500px]`, `sm:flex-row`
3. Test at exactly 640px width (Tailwind's `sm:` breakpoint)

## Browser Compatibility

Test in these browsers:
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

## Accessibility Testing

- [ ] **Keyboard Navigation**: Tab through all elements
- [ ] **Screen Reader**: Test with NVDA/JAWS/VoiceOver
- [ ] **Focus Indicators**: Visible focus rings on all interactive elements
- [ ] **ARIA Labels**: Proper labels for icons and buttons

## Performance Testing

- [ ] **Dialog Opens**: < 100ms
- [ ] **Language Switch**: Immediate re-render
- [ ] **Send Email**: Shows loading state, completes < 3s
- [ ] **No Layout Shift**: Content doesn't jump when opening

## Sign-Off

### English (LTR) Mode
- Tested by: _______________
- Date: _______________
- Status: ☐ Pass ☐ Fail
- Notes: _______________

### Hebrew (RTL) Mode
- Tested by: _______________
- Date: _______________
- Status: ☐ Pass ☐ Fail
- Notes: _______________

### Mobile Responsive
- Tested by: _______________
- Date: _______________
- Status: ☐ Pass ☐ Fail
- Notes: _______________

### Functional (Email Sending)
- Tested by: _______________
- Date: _______________
- Status: ☐ Pass ☐ Fail
- Notes: _______________

## Screenshots

### English Mode (LTR)
![English Dialog](./screenshots/sendlink-english.png)

### Hebrew Mode (RTL)
![Hebrew Dialog](./screenshots/sendlink-hebrew.png)

### Mobile View
![Mobile Dialog](./screenshots/sendlink-mobile.png)

## Related Files

- Component: `src/components/admin/SendEnrollmentLinkDialog.tsx`
- Migration: `supabase/migrations/20251202_enrollment_email_system_translations.sql`
- Email Template: `src/lib/email/templates/enrollmentInvitation.ts`
- API Route: `src/app/api/admin/enrollments/[id]/send-link/route.ts`
