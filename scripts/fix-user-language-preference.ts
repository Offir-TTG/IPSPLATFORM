/**
 * Fix user language preferences - set to Hebrew
 * Run: npx ts-node scripts/fix-user-language-preference.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixLanguagePreferences() {
  try {
    console.log('🔍 Checking user language preferences in users table...\n');

    const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, preferred_language')
      .eq('tenant_id', tenantId);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`Found ${users.length} users:\n`);

    let updatedCount = 0;
    let alreadySetCount = 0;

    for (const user of users) {
      console.log(`User: ${user.email}`);
      console.log(`  Current preferred_language: ${user.preferred_language || 'NULL'}`);

      if (user.preferred_language === 'he') {
        console.log(`  ✓ Already set to Hebrew\n`);
        alreadySetCount++;
        continue;
      }

      // Update to Hebrew
      const { error: updateError } = await supabase
        .from('users')
        .update({ preferred_language: 'he' })
        .eq('id', user.id);

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}\n`);
      } else {
        console.log(`  ✅ Updated to Hebrew (he)\n`);
        updatedCount++;
      }
    }

    console.log('='.repeat(60));
    console.log(`✅ Language preference update complete!`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already set: ${alreadySetCount}`);
    console.log(`   Total: ${users.length}`);
    console.log('='.repeat(60));
    console.log('\n📌 NEXT STEPS:');
    console.log('   1. Users need to hard refresh (Ctrl+Shift+R) to clear old cache');
    console.log('   2. Or clear localStorage and refresh');
    console.log('   3. Hebrew translations should then load correctly\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixLanguagePreferences();
