import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addEnrollmentsTranslation() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nAdding "My Enrollments" translation for tenant: ${tenant.name} (${tenant.id})\n`);

    const translationKey = 'user.commandPalette.myEnrollments';
    const enValue = 'My Enrollments';
    const heValue = 'ההרשמות שלי';

    // Insert Hebrew
    const heResult = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translationKey,
        translation_value: heValue,
        language_code: 'he',
        context: 'user'
      });

    if (heResult.error && !heResult.error.message.includes('duplicate')) {
      console.error(`❌ Error inserting HE:`, heResult.error.message);
    } else {
      console.log(`✓ Added HE: ${translationKey} = ${heValue}`);
    }

    // Insert English
    const enResult = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translationKey,
        translation_value: enValue,
        language_code: 'en',
        context: 'user'
      });

    if (enResult.error && !enResult.error.message.includes('duplicate')) {
      console.error(`❌ Error inserting EN:`, enResult.error.message);
    } else {
      console.log(`✓ Added EN: ${translationKey} = ${enValue}`);
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

addEnrollmentsTranslation();
