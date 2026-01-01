import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Dropdown menu translations
  {
    key: 'admin.nav.organizationSettings',
    en: 'Manage organization',
    he: 'נהל ארגון'
  },
  {
    key: 'admin.nav.auditLog',
    en: 'Audit Log',
    he: 'יומן ביקורת'
  },
  {
    key: 'admin.nav.viewActivity',
    en: 'View activity logs',
    he: 'צפה ביומני פעילות'
  },
  {
    key: 'nav.signOut',
    en: 'Sign out of your account',
    he: 'התנתק מהחשבון שלך'
  }
];

async function addTranslations() {
  try {
    // Get the first tenant
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenantsError || !tenants || tenants.length === 0) {
      console.error('Error fetching tenant:', tenantsError);
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`Adding translations for tenant: ${tenantId}\n`);

    for (const translation of translations) {
      // Check if English translation exists
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .single();

      if (!existingEn) {
        // Insert English
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en'
          });

        if (enError) {
          console.error(`Error adding EN translation for ${translation.key}:`, enError);
        } else {
          console.log(`✅ Added EN: ${translation.key} = "${translation.en}"`);
        }
      } else {
        console.log(`⏭️  Skipped EN: ${translation.key} (already exists)`);
      }

      // Check if Hebrew translation exists
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .single();

      if (!existingHe) {
        // Insert Hebrew
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he'
          });

        if (heError) {
          console.error(`Error adding HE translation for ${translation.key}:`, heError);
        } else {
          console.log(`✅ Added HE: ${translation.key} = "${translation.he}"`);
        }
      } else {
        console.log(`⏭️  Skipped HE: ${translation.key} (already exists)`);
      }
    }

    console.log('\n✅ Translation addition complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
