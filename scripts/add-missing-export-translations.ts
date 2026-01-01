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

const newTranslations: Translation[] = [
  {
    key: 'user.profile.billing.exportPdfDialog.documentType',
    en: 'Document Type',
    he: 'סוג מסמך',
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

      for (const translation of newTranslations) {
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

    console.log('✅ Successfully added missing export PDF translations');
    console.log(`Total translations added: ${newTranslations.length} keys × 2 languages = ${newTranslations.length * 2} entries\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations();
