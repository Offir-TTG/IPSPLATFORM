import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // PDF Receipt Content
  { key: 'pdf.receipt.title', en: 'Payment Receipt', he: 'קבלה על תשלום' },
  { key: 'pdf.receipt.number', en: 'Receipt #', he: 'קבלה מס\'' },
  { key: 'pdf.receipt.generated', en: 'Generated', he: 'נוצר בתאריך' },

  // Organization Info
  { key: 'pdf.org.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.org.phone', en: 'Phone', he: 'טלפון' },
  { key: 'pdf.org.address', en: 'Address', he: 'כתובת' },
  { key: 'pdf.org.website', en: 'Website', he: 'אתר אינטרנט' },
  { key: 'pdf.org.tax_id', en: 'Tax ID', he: 'מספר עוסק' },

  // Student Information
  { key: 'pdf.student.title', en: 'Student Information', he: 'פרטי התלמיד' },
  { key: 'pdf.student.name', en: 'Name', he: 'שם' },
  { key: 'pdf.student.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.student.phone', en: 'Phone', he: 'טלפון' },
  { key: 'pdf.student.address', en: 'Address', he: 'כתובת' },

  // Enrollment Summary
  { key: 'pdf.enrollment.title', en: 'Enrollment Summary', he: 'סיכום הרשמה' },
  { key: 'pdf.enrollment.product', en: 'Product', he: 'מוצר' },
  { key: 'pdf.enrollment.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.enrollment.date', en: 'Enrollment Date', he: 'תאריך הרשמה' },
  { key: 'pdf.enrollment.paymentPlan', en: 'Payment Plan', he: 'תוכנית תשלום' },

  // Product Types
  { key: 'pdf.enrollment.productType.program', en: 'Program', he: 'תכנית' },
  { key: 'pdf.enrollment.productType.course', en: 'Course', he: 'קורס' },
  { key: 'pdf.enrollment.productType.lecture', en: 'Lecture', he: 'הרצאה' },
  { key: 'pdf.enrollment.productType.workshop', en: 'Workshop', he: 'סדנה' },
  { key: 'pdf.enrollment.productType.custom', en: 'Custom', he: 'מותאם אישית' },

  // Payment Summary
  { key: 'pdf.summary.total', en: 'Total Amount', he: 'סכום כולל' },
  { key: 'pdf.summary.paid', en: 'Amount Paid', he: 'שולם' },
  { key: 'pdf.summary.outstanding', en: 'Outstanding Balance', he: 'יתרה לתשלום' },

  // Payment Schedule Table
  { key: 'pdf.schedule.title', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'pdf.schedule.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.schedule.scheduledDate', en: 'Scheduled Date', he: 'תאריך מתוכנן' },
  { key: 'pdf.schedule.paidDate', en: 'Paid Date', he: 'תאריך תשלום' },
  { key: 'pdf.schedule.amount', en: 'Amount', he: 'סכום' },
  { key: 'pdf.schedule.status', en: 'Status', he: 'סטטוס' },

  // Payment Types
  { key: 'pdf.schedule.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'pdf.schedule.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'pdf.schedule.paymentType.subscription', en: 'Subscription', he: 'מנוי' },
  { key: 'pdf.schedule.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },

  // Payment Status
  { key: 'pdf.schedule.statusValue.pending', en: 'Pending', he: 'ממתין' },
  { key: 'pdf.schedule.statusValue.processing', en: 'Processing', he: 'מעובד' },
  { key: 'pdf.schedule.statusValue.paid', en: 'Paid', he: 'שולם' },
  { key: 'pdf.schedule.statusValue.failed', en: 'Failed', he: 'נכשל' },
  { key: 'pdf.schedule.statusValue.paused', en: 'Paused', he: 'מושהה' },
  { key: 'pdf.schedule.statusValue.adjusted', en: 'Adjusted', he: 'מותאם' },
  { key: 'pdf.schedule.statusValue.cancelled', en: 'Cancelled', he: 'בוטל' },
  { key: 'pdf.schedule.statusValue.refunded', en: 'Refunded', he: 'הוחזר' },
  { key: 'pdf.schedule.statusValue.overdue', en: 'Overdue', he: 'באיחור' },

  // Footer
  { key: 'pdf.footer.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.footer.phone', en: 'Phone', he: 'טלפון' },
  { key: 'pdf.footer.notice', en: 'This is an official payment receipt', he: 'זוהי קבלה רשמית על תשלום' },
  { key: 'pdf.footer.page', en: 'Page', he: 'עמוד' },
  { key: 'pdf.footer.of', en: 'of', he: 'מתוך' },

  // Admin UI - Form Labels
  { key: 'admin.payments.cards.pdfTemplate.title', en: 'PDF Template', he: 'תבנית PDF' },
  { key: 'admin.payments.cards.pdfTemplate.description', en: 'Configure PDF branding for payment receipts', he: 'הגדר עיצוב PDF לקבלות תשלום' },
  { key: 'admin.pdf.title', en: 'PDF Template Configuration', he: 'הגדרות תבנית PDF' },
  { key: 'admin.pdf.description', en: 'Customize the branding and information that appears on enrollment payment receipts', he: 'התאם אישית את המיתוג והמידע המופיעים בקבלות תשלום להרשמה' },
  { key: 'admin.pdf.cardTitle', en: 'Branding Configuration', he: 'הגדרות מיתוג' },
  { key: 'admin.pdf.cardDescription', en: 'Configure how your organization\'s branding appears on PDF receipts', he: 'הגדר כיצד המיתוג של הארגון שלך מופיע בקבלות PDF' },
  { key: 'admin.pdf.loadError', en: 'Failed to load configuration', he: 'טעינת ההגדרות נכשלה' },

  // Admin UI - Tabs
  { key: 'admin.pdf.tabs.organization', en: 'Organization Info', he: 'פרטי הארגון' },
  { key: 'admin.pdf.tabs.branding', en: 'Branding', he: 'מיתוג' },
  { key: 'admin.pdf.tabs.footer', en: 'Footer', he: 'כותרת תחתונה' },

  // Admin UI - Organization Fields
  { key: 'admin.pdf.org.name', en: 'Organization Name', he: 'שם הארגון' },
  { key: 'admin.pdf.org.nameHint', en: 'This name will appear in the PDF header', he: 'שם זה יופיע בכותרת ה-PDF' },
  { key: 'admin.pdf.org.namePlaceholder', en: 'Your Organization Name', he: 'שם הארגון שלך' },
  { key: 'admin.pdf.org.email', en: 'Contact Email', he: 'דוא"ל ליצירת קשר' },
  { key: 'admin.pdf.org.phone', en: 'Contact Phone', he: 'טלפון ליצירת קשר' },
  { key: 'admin.pdf.org.address', en: 'Address', he: 'כתובת' },
  { key: 'admin.pdf.org.website', en: 'Website', he: 'אתר אינטרנט' },
  { key: 'admin.pdf.org.taxId', en: 'Tax ID / Business Registration', he: 'מספר עוסק / רישום עסקי' },

  // Admin UI - Branding Fields
  { key: 'admin.pdf.branding.logo', en: 'Organization Logo', he: 'לוגו הארגון' },
  { key: 'admin.pdf.branding.logoUrl', en: 'Logo URL', he: 'כתובת URL של לוגו' },
  { key: 'admin.pdf.branding.logoHint', en: 'Enter the URL of your organization\'s logo (PNG, JPG, or SVG)', he: 'הזן את כתובת ה-URL של הלוגו של הארגון (PNG, JPG או SVG)' },
  { key: 'admin.pdf.branding.logoPreview', en: 'Preview:', he: 'תצוגה מקדימה:' },
  { key: 'admin.pdf.branding.uploadLogo', en: 'Upload Logo', he: 'העלה לוגו' },
  { key: 'admin.pdf.branding.uploading', en: 'Uploading...', he: 'מעלה...' },
  { key: 'admin.pdf.branding.uploadHint', en: 'Upload your organization logo (PNG, JPG, or SVG)', he: 'העלה את לוגו הארגון שלך (PNG, JPG או SVG)' },
  { key: 'admin.pdf.branding.orEnterUrl', en: 'Or enter logo URL:', he: 'או הזן כתובת URL של לוגו:' },
  { key: 'admin.pdf.branding.removeLogo', en: 'Remove', he: 'הסר' },
  { key: 'admin.pdf.branding.logoUploaded', en: 'Logo uploaded successfully', he: 'הלוגו הועלה בהצלחה' },
  { key: 'admin.pdf.branding.logoRemoved', en: 'Logo removed', he: 'הלוגו הוסר' },
  { key: 'admin.pdf.branding.uploadError', en: 'Failed to upload logo', he: 'העלאת הלוגו נכשלה' },
  { key: 'admin.pdf.branding.invalidFileType', en: 'Please upload a PNG, JPG, or SVG file', he: 'אנא העלה קובץ PNG, JPG או SVG' },
  { key: 'admin.pdf.branding.fileTooLarge', en: 'File size must be less than 2MB', he: 'גודל הקובץ חייב להיות קטן מ-2MB' },
  { key: 'admin.pdf.branding.primaryColor', en: 'Primary Color', he: 'צבע ראשי' },
  { key: 'admin.pdf.branding.colorHint', en: 'This color will be used for headers, borders, and accents in the PDF', he: 'צבע זה ישמש לכותרות, גבולות והדגשות ב-PDF' },
  { key: 'admin.pdf.branding.showLogo', en: 'Show Logo', he: 'הצג לוגו' },
  { key: 'admin.pdf.branding.showLogoDesc', en: 'Display the logo in the PDF header', he: 'הצג את הלוגו בכותרת ה-PDF' },
  { key: 'admin.pdf.branding.showOrgName', en: 'Show Organization Name', he: 'הצג שם ארגון' },
  { key: 'admin.pdf.branding.showOrgNameDesc', en: 'Display the organization name in the PDF header', he: 'הצג את שם הארגון בכותרת ה-PDF' },

  // Admin UI - Footer Fields
  { key: 'admin.pdf.footer.showContact', en: 'Show Contact Information', he: 'הצג פרטי קשר' },
  { key: 'admin.pdf.footer.showContactDesc', en: 'Display contact info (email, phone, address) in the footer', he: 'הצג פרטי קשר (דוא"ל, טלפון, כתובת) בכותרת התחתונה' },
  { key: 'admin.pdf.footer.showPageNumbers', en: 'Show Page Numbers', he: 'הצג מספרי עמודים' },
  { key: 'admin.pdf.footer.showPageNumbersDesc', en: 'Display "Page X of Y" in the footer', he: 'הצג "עמוד X מתוך Y" בכותרת התחתונה' },
  { key: 'admin.pdf.footer.customText', en: 'Custom Footer Text (Optional)', he: 'טקסט מותאם אישית לכותרת תחתונה (אופציונלי)' },
  { key: 'admin.pdf.footer.customTextPlaceholder', en: 'Enter any additional text you want to appear in the footer', he: 'הזן טקסט נוסף שתרצה שיופיע בכותרת התחתונה' },
  { key: 'admin.pdf.footer.customTextHint', en: 'This text will appear at the bottom of each page', he: 'טקסט זה יופיע בתחתית כל עמוד' },

  // Admin UI - Actions
  { key: 'admin.pdf.save', en: 'Save Changes', he: 'שמור שינויים' },
  { key: 'admin.pdf.saving', en: 'Saving...', he: 'שומר...' },
  { key: 'admin.pdf.saveSuccess', en: 'Configuration saved successfully', he: 'ההגדרות נשמרו בהצלחה' },
  { key: 'admin.pdf.saveError', en: 'Failed to save configuration', he: 'שמירת ההגדרות נכשלה' },
  { key: 'admin.pdf.preview', en: 'Preview PDF', he: 'תצוגה מקדימה של PDF' },
  { key: 'admin.pdf.previewing', en: 'Generating...', he: 'מייצר...' },
  { key: 'admin.pdf.previewSuccess', en: 'Preview PDF generated successfully', he: 'תצוגה מקדימה של PDF נוצרה בהצלחה' },
  { key: 'admin.pdf.previewError', en: 'Failed to generate preview', he: 'יצירת תצוגה מקדימה נכשלה' },

  // Admin UI - Preview Dialog
  { key: 'admin.pdf.dialog.title', en: 'Select Document Type', he: 'בחר סוג מסמך' },
  { key: 'admin.pdf.dialog.description', en: 'Choose which document you would like to preview', he: 'בחר איזה מסמך ברצונך לצפות בתצוגה מקדימה' },
  { key: 'admin.pdf.dialog.documentType', en: 'Document Type', he: 'סוג מסמך' },
  { key: 'admin.pdf.dialog.invoice', en: 'Invoice', he: 'חשבונית' },
  { key: 'admin.pdf.dialog.invoiceDesc', en: 'General enrollment invoice with payment summary', he: 'חשבונית הרשמה כללית עם סיכום תשלום' },
  { key: 'admin.pdf.dialog.schedule', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'admin.pdf.dialog.scheduleDesc', en: 'Detailed payment schedule with all installments', he: 'לוח תשלומים מפורט עם כל התשלומים' },
  { key: 'admin.pdf.dialog.both', en: 'Both Documents', he: 'שני המסמכים' },
  { key: 'admin.pdf.dialog.bothDesc', en: 'Combined PDF with invoice and payment schedule', he: 'PDF משולב עם חשבונית ולוח תשלומים' },
  { key: 'admin.pdf.dialog.language', en: 'Language', he: 'שפה' },
  { key: 'admin.pdf.dialog.english', en: 'English', he: 'אנגלית' },
  { key: 'admin.pdf.dialog.hebrew', en: 'Hebrew', he: 'עברית' },
  { key: 'admin.pdf.dialog.generate', en: 'Generate Preview', he: 'צור תצוגה מקדימה' },

  // PDF Content - Invoice
  { key: 'pdf.invoice.title', en: 'Enrollment Invoice', he: 'חשבונית הרשמה' },
  { key: 'pdf.invoice.number', en: 'Invoice #', he: 'חשבונית מס' },
  { key: 'pdf.invoice.date', en: 'Date', he: 'תאריך' },
  { key: 'pdf.invoice.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.invoice.phone', en: 'Phone', he: 'טלפון' },
  { key: 'pdf.invoice.address', en: 'Address', he: 'כתובת' },
  { key: 'pdf.invoice.website', en: 'Website', he: 'אתר' },
  { key: 'pdf.invoice.taxId', en: 'Tax ID', he: 'מספר עוסק' },
  { key: 'pdf.invoice.billTo', en: 'Bill To', he: 'חייב ל' },
  { key: 'pdf.invoice.enrollmentDetails', en: 'Enrollment Details', he: 'פרטי הרשמה' },
  { key: 'pdf.invoice.product', en: 'Product', he: 'מוצר' },
  { key: 'pdf.invoice.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.invoice.enrolledDate', en: 'Enrollment Date', he: 'תאריך הרשמה' },
  { key: 'pdf.invoice.paymentPlan', en: 'Payment Plan', he: 'תכנית תשלום' },
  { key: 'pdf.invoice.paymentSummary', en: 'Payment Summary', he: 'סיכום תשלום' },
  { key: 'pdf.invoice.totalAmount', en: 'Total Amount', he: 'סכום כולל' },
  { key: 'pdf.invoice.paidAmount', en: 'Paid Amount', he: 'סכום ששולם' },
  { key: 'pdf.invoice.remainingBalance', en: 'Remaining Balance', he: 'יתרה' },
  { key: 'pdf.invoice.officialDocument', en: 'This is an official enrollment invoice', he: 'זוהי חשבונית הרשמה רשמית' },
  { key: 'pdf.invoice.questions', en: 'Questions? Contact us at', he: 'שאלות? צור קשר ב' },
  { key: 'pdf.invoice.productType.course', en: 'Course', he: 'קורס' },
  { key: 'pdf.invoice.productType.program', en: 'Program', he: 'תכנית' },

  // PDF Content - Payment Schedule
  { key: 'pdf.schedule.title', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'pdf.schedule.enrollment', en: 'Enrollment', he: 'הרשמה' },
  { key: 'pdf.schedule.date', en: 'Date', he: 'תאריך' },
  { key: 'pdf.schedule.student', en: 'Student Information', he: 'פרטי תלמיד' },
  { key: 'pdf.schedule.name', en: 'Name', he: 'שם' },
  { key: 'pdf.schedule.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.schedule.paymentsTitle', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'pdf.schedule.number', en: '#', he: 'מס\'' },
  { key: 'pdf.schedule.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.schedule.scheduledDate', en: 'Scheduled', he: 'מתוזמן' },
  { key: 'pdf.schedule.paidDate', en: 'Paid Date', he: 'תאריך תשלום' },
  { key: 'pdf.schedule.amount', en: 'Amount', he: 'סכום' },
  { key: 'pdf.schedule.status', en: 'Status', he: 'סטטוס' },
  { key: 'pdf.schedule.paymentType.registration', en: 'Registration', he: 'רישום' },
  { key: 'pdf.schedule.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'pdf.schedule.paymentType.final', en: 'Final Payment', he: 'תשלום אחרון' },
  { key: 'pdf.schedule.statusLabel.paid', en: 'PAID', he: 'שולם' },
  { key: 'pdf.schedule.statusLabel.pending', en: 'PENDING', he: 'ממתין' },
  { key: 'pdf.schedule.statusLabel.overdue', en: 'OVERDUE', he: 'באיחור' },
  { key: 'pdf.schedule.officialDocument', en: 'This is an official payment schedule', he: 'זהו לוח תשלומים רשמי' },
  { key: 'pdf.schedule.questions', en: 'Questions? Contact us at', he: 'שאלות? צור קשר ב' },

  // User UI - Export Button
  { key: 'user.profile.billing.exportPdf', en: 'Export PDF', he: 'ייצא PDF' },
  { key: 'user.profile.billing.pdfExported', en: 'PDF exported successfully', he: 'ה-PDF יוצא בהצלחה' },
  { key: 'user.profile.billing.pdfExportError', en: 'Failed to export PDF', he: 'ייצוא ה-PDF נכשל' },
];

async function addTranslations() {
  try {
    console.log('Fetching all tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      throw tenantsError;
    }

    if (!tenants || tenants.length === 0) {
      console.log('No tenants found');
      return;
    }

    console.log(`Found ${tenants.length} tenants`);
    console.log(`Total translations to process: ${translations.length}`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.name} (${tenant.id})`);
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const translation of translations) {
        // Check Hebrew translation
        const { data: existingHe } = await supabase
          .from('translations')
          .select('id, translation_value')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .maybeSingle();

        if (existingHe) {
          if (existingHe.translation_value !== translation.he) {
            const { error: updateError } = await supabase
              .from('translations')
              .update({ translation_value: translation.he })
              .eq('id', existingHe.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            skippedCount++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.he,
              language_code: 'he',
              context: 'admin'
            });

          if (insertError) {
            console.error(`Error inserting HE ${translation.key}:`, insertError.message);
          } else {
            addedCount++;
          }
        }

        // Check English translation
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id, translation_value')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .maybeSingle();

        if (existingEn) {
          if (existingEn.translation_value !== translation.en) {
            const { error: updateError } = await supabase
              .from('translations')
              .update({ translation_value: translation.en })
              .eq('id', existingEn.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            skippedCount++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.en,
              language_code: 'en',
              context: 'admin'
            });

          if (insertError) {
            console.error(`Error inserting EN ${translation.key}:`, insertError.message);
          } else {
            addedCount++;
          }
        }
      }

      console.log(`✓ Added ${addedCount}, updated ${updatedCount}, skipped ${skippedCount} translations for ${tenant.name}`);
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Error adding translations:', error);
    process.exit(1);
  }
}

addTranslations();
