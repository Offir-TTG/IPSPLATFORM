import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  context?: string;
}

const translations: Translation[] = [
  // Export Dialog
  {
    key: 'user.profile.billing.exportPdf',
    en: 'Export PDF',
    he: 'ייצוא PDF',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.title',
    en: 'Export Payment Document',
    he: 'ייצוא מסמך תשלום',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.description',
    en: 'Choose which document to export',
    he: 'בחר איזה מסמך לייצא',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.invoice',
    en: 'Invoice',
    he: 'חשבונית',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.invoiceDesc',
    en: 'Summary of charges and payment details',
    he: 'סיכום חיובים ופרטי תשלום',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.schedule',
    en: 'Payment Schedule',
    he: 'לוח תשלומים',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.scheduleDesc',
    en: 'Detailed payment plan and installments',
    he: 'תוכנית תשלום מפורטת ותשלומים',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.both',
    en: 'Both Documents',
    he: 'שני המסמכים',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.bothDesc',
    en: 'Invoice and payment schedule combined',
    he: 'חשבונית ולוח תשלומים משולבים',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.documentType',
    en: 'Document Type',
    he: 'סוג מסמך',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.language',
    en: 'Language',
    he: 'שפה',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.english',
    en: 'English',
    he: 'אנגלית',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.hebrew',
    en: 'Hebrew',
    he: 'עברית',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportPdfDialog.export',
    en: 'Export',
    he: 'ייצוא',
    context: 'user'
  },
  {
    key: 'user.profile.billing.pdfExported',
    en: 'PDF exported successfully',
    he: 'PDF יוצא בהצלחה',
    context: 'user'
  },
  {
    key: 'user.profile.billing.pdfExportError',
    en: 'Failed to export PDF',
    he: 'ייצוא PDF נכשל',
    context: 'user'
  },
  {
    key: 'user.profile.billing.exportingPdf',
    en: 'Exporting...',
    he: 'מייצא...',
    context: 'user'
  },
];

async function addTranslations() {
  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    console.log(`Found ${tenants?.length || 0} tenants\n`);

    for (const tenant of tenants || []) {
      console.log(`Processing tenant: ${tenant.name}`);

      // Prepare all translation entries for this tenant
      const translationEntries = [];

      for (const translation of translations) {
        // English translation
        translationEntries.push({
          tenant_id: tenant.id,
          language_code: 'en',
          translation_key: translation.key,
          translation_value: translation.en,
          context: translation.context || null,
        });

        // Hebrew translation
        translationEntries.push({
          tenant_id: tenant.id,
          language_code: 'he',
          translation_key: translation.key,
          translation_value: translation.he,
          context: translation.context || null,
        });
      }

      // Insert all translations for this tenant
      const { error: insertError } = await supabase
        .from('translations')
        .insert(translationEntries);

      if (insertError) {
        throw new Error(`Failed to insert translations for tenant ${tenant.name}: ${insertError.message}`);
      }

      console.log(`✓ Added ${translationEntries.length} translations for ${tenant.name}\n`);
    }

    console.log('✅ Successfully added export PDF translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translations.length * 2} entries\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations();
