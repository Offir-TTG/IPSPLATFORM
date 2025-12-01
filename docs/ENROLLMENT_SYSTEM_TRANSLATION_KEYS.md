# Enrollment System Translation Keys Reference

## Overview
Complete reference of all translation keys used in the enrollment system for both admin and user-facing interfaces.

---

## Public Enrollment Page (`/enroll/[token]`)
**Context**: `user`

| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `enrollment.loading` | Loading your invitation... | טוען את ההזמנה שלך... | Loading state |
| `enrollment.error` | Error loading enrollment | שגיאה בטעינת ההרשמה | Error state |
| `enrollment.invalidToken` | Invalid or expired invitation link | קישור הזמנה לא חוקי או שפג תוקפו | Invalid token |
| `enrollment.title` | Enrollment Invitation | הזמנה להרשמה | Page title |
| `enrollment.subtitle` | You've been invited to join | הוזמנת להצטרף | Page subtitle |
| `enrollment.enrolledIn` | You're being enrolled in | אתה נרשם ל | Product section header |
| `enrollment.pricing` | Pricing | תמחור | Pricing section header |
| `enrollment.description` | Description | תיאור | Description label |
| `enrollment.price` | Price | מחיר | Price label |
| `enrollment.free` | Free | חינם | Free indicator |
| `enrollment.requiresPayment` | This enrollment requires payment. You'll be redirected to complete payment after accepting. | הרשמה זו דורשת תשלום. תועבר להשלמת התשלום לאחר האישור. | Payment alert |
| `enrollment.expired` | Note: This invitation will expire on | שים לב: הזמנה זו תפוג ב | Expiry warning |
| `enrollment.expiresAt` | Expires | פג תוקף | Expiry label |
| `enrollment.acceptButton` | Accept Enrollment | אשר הרשמה | Accept button |
| `enrollment.accepted` | Enrollment accepted successfully! | ההרשמה אושרה בהצלחה! | Success message |

---

## Create Enrollment Dialog (Admin)
**Context**: `admin`

### User Selection
| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.create.title` | Create Manual Enrollment | יצירת הרשמה ידנית | Dialog title |
| `admin.enrollments.create.description` | Manually enroll a user in a product | רשום משתמש למוצר באופן ידני | Dialog description |
| `admin.enrollments.create.user` | Select User | בחר משתמש | User field label |
| `admin.enrollments.create.selectUser` | Choose a user... | בחר משתמש... | User dropdown placeholder |
| `admin.enrollments.create.noUsers` | No users found | לא נמצאו משתמשים | Empty users state |

### New User Creation
| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.create.createNewUser` | Create new user (not yet registered) | צור משתמש חדש (טרם נרשם) | Toggle checkbox label |
| `admin.enrollments.create.newUserSection` | New User Details | פרטי משתמש חדש | New user section header |
| `admin.enrollments.create.firstName` | First Name | שם פרטי | First name field |
| `admin.enrollments.create.lastName` | Last Name | שם משפחה | Last name field |
| `admin.enrollments.create.email` | Email Address | כתובת אימייל | Email field |
| `admin.enrollments.create.phone` | Phone Number (Optional) | מספר טלפון (אופציונלי) | Phone field |
| `admin.enrollments.create.firstNamePlaceholder` | John | ישראל | First name placeholder |
| `admin.enrollments.create.lastNamePlaceholder` | Doe | ישראלי | Last name placeholder |
| `admin.enrollments.create.emailPlaceholder` | john.doe@example.com | john.doe@example.com | Email placeholder |
| `admin.enrollments.create.phonePlaceholder` | +1234567890 | 050-1234567 | Phone placeholder |
| `admin.enrollments.create.newUserNote` | A new user account will be created with these details. The user will receive an invitation email to complete registration. | חשבון משתמש חדש ייווצר עם פרטים אלו. המשתמש יקבל אימייל הזמנה להשלמת ההרשמה. | Help text |

### Product Selection
| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.create.selectProduct` | Select Product | בחר מוצר | Product field label |
| `admin.enrollments.create.selectProductPlaceholder` | Choose a product... | בחר מוצר... | Product dropdown placeholder |
| `admin.enrollments.create.noProducts` | No products found | לא נמצאו מוצרים | Empty products state |
| `admin.enrollments.create.productHelp` | Products contain all program/course information including pricing and payment plans | מוצרים מכילים את כל המידע על תוכניות/קורסים כולל תמחור ותוכניות תשלום | Product help text |

### Other Fields
| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.create.requirePayment` | Require payment (enrollment pending until paid) | דרוש תשלום (הרשמה ממתינה עד לתשלום) | Payment checkbox |
| `admin.enrollments.create.expiryDate` | Expiry Date (Optional) | תאריך תפוגה (אופציונלי) | Expiry field |
| `admin.enrollments.create.alert` | This enrollment will be marked as admin-assigned and will bypass the normal purchase flow. | הרשמה זו תסומן כמוקצית על ידי מנהל ותעקוף את תהליך הרכישה הרגיל. | Alert message |

### Validation & Actions
| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.create.validationError` | Please select both user and product | אנא בחר גם משתמש וגם מוצר | Validation error |
| `admin.enrollments.create.newUserValidation` | Please fill in all required user fields | אנא מלא את כל השדות הנדרשים עבור המשתמש | New user validation error |
| `admin.enrollments.create.selectProductError` | Please select a product | אנא בחר מוצר | Product validation error |
| `admin.enrollments.create.success` | Enrollment created successfully | ההרשמה נוצרה בהצלחה | Success toast |
| `admin.enrollments.create.error` | Failed to create enrollment | נכשל ביצירת הרשמה | Error toast |
| `admin.enrollments.create.submit` | Create Enrollment | צור הרשמה | Submit button |

---

## Send Enrollment Link Dialog (Admin)
**Context**: `admin`

| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `admin.enrollments.sendLink.title` | Send Enrollment Link | שלח קישור הרשמה | Dialog title |
| `admin.enrollments.sendLink.description` | Send enrollment invitation email to the user with a secure link | שלח אימייל הזמנה להרשמה למשתמש עם קישור מאובטח | Dialog description |
| `admin.enrollments.sendLink.language` | Email Language | שפת האימייל | Language field label |
| `admin.enrollments.sendLink.selectLanguage` | Select language... | בחר שפה... | Language dropdown placeholder |
| `admin.enrollments.sendLink.languageHelp` | The email will be sent in the selected language | האימייל יישלח בשפה הנבחרת | Language help text |
| `admin.enrollments.sendLink.enrollmentDetails` | Enrollment Details | פרטי הרשמה | Details section header |
| `admin.enrollments.sendLink.product` | Product | מוצר | Product label |
| `admin.enrollments.sendLink.user` | User | משתמש | User label |
| `admin.enrollments.sendLink.status` | Status | סטטוס | Status label |
| `admin.enrollments.sendLink.securityNote` | A unique, secure link will be generated and sent to the user's email address. | קישור ייחודי ומאובטח ייווצר וישלח לכתובת האימייל של המשתמש. | Security note |
| `admin.enrollments.sendLink.success` | Invitation link sent successfully | קישור ההזמנה נשלח בהצלחה | Success toast |
| `admin.enrollments.sendLink.error` | Failed to send invitation link | נכשל בשליחת קישור ההזמנה | Error toast |
| `admin.enrollments.sendLink.submit` | Send Link | שלח קישור | Submit button |

---

## Product Types (Global)
**Context**: `both` (used in both admin and user interfaces)

| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `productType.program` | Program | תוכנית | Program product type |
| `productType.course` | Course | קורס | Course product type |
| `productType.bundle` | Bundle | חבילה | Bundle product type |
| `productType.session_pack` | Session Pack | חבילת מפגשים | Session pack product type |
| `productType.workshop` | Workshop | סדנה | Workshop product type |
| `productType.webinar` | Webinar | וובינר | Webinar product type |

**Usage Example**:
```tsx
// In dropdowns, cards, labels
{product.title} ({t(`productType.${product.type}`, product.type)})
```

---

## Common Keys (Shared)
**Context**: `both`

| Translation Key | English | Hebrew | Usage |
|----------------|---------|---------|-------|
| `common.loading` | Loading... | טוען... | Loading states |
| `common.cancel` | Cancel | ביטול | Cancel buttons |
| `common.back` | Back | חזור | Back buttons |

---

## Migration Files

### Applied Migrations:
1. ✅ `supabase/migrations/20251202_enrollment_page_translations.sql`
   - Public enrollment page translations (15 keys)

2. ✅ `supabase/migrations/20251202_enrollment_dialog_missing_translations.sql`
   - Product type translations (6 types)
   - Product help text

### Component Files:
1. ✅ `src/app/(public)/enroll/[token]/page.tsx` - Public enrollment page
2. ✅ `src/components/admin/CreateEnrollmentDialog.tsx` - Admin enrollment dialog
3. ✅ `src/components/admin/SendEnrollmentLinkDialog.tsx` - Send link dialog

---

## Usage Pattern

```tsx
// Import the hook
import { useLanguage } from '@/context/AppContext'; // For user pages
import { useAdminLanguage } from '@/context/AppContext'; // For admin pages

// In component
const { t, direction } = useLanguage();
const isRtl = direction === 'rtl';

// Use translation with fallback
t('enrollment.title', 'Enrollment Invitation')

// Dynamic keys (like product types)
t(`productType.${type}`, type)
```

---

## Translation Context Rules

- **`user`** context: Public-facing pages (enrollment page, login, etc.)
- **`admin`** context: Admin interface pages
- **`both`** context: Shared across user and admin interfaces (product types, common labels)

---

**Last Updated**: December 1, 2025
**Total Translation Keys**: ~60+ keys across enrollment system
