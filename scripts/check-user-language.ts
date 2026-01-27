/**
 * Check user language preference and translation loading
 * Run: npx ts-node scripts/check-user-language.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUserLanguage() {
  try {
    console.log('🔍 Checking user language settings...\n');

    const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('tenant_id', tenantId)
      .limit(5);

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`User: ${user.email}`);
      console.log(`  Role: ${user.role}`);

      // Check user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs) {
        console.log(`  Language: ${prefs.language || 'NOT SET'}`);
        console.log(`  Regional: ${JSON.stringify(prefs.regional || {})}`);
        console.log(`  UI: ${JSON.stringify(prefs.ui || {})}`);
      } else {
        console.log(`  ❌ No preferences record found`);
      }
      console.log('');
    }

    // Check translation keys
    console.log('\n=== CHECKING TRANSLATION KEYS ===\n');

    const keysToCheck = [
      'user.payments.statusRefunded',
      'user.payments.status.refunded',
    ];

    for (const key of keysToCheck) {
      const { data: translations } = await supabase
        .from('translations')
        .select('language_code, translation_value, context, updated_at')
        .eq('translation_key', key)
        .eq('tenant_id', tenantId)
        .order('language_code');

      console.log(`Key: ${key}`);
      if (translations && translations.length > 0) {
        translations.forEach(t => {
          console.log(`  ${t.language_code}: "${t.translation_value}" (context: ${t.context})`);
          console.log(`    Updated: ${t.updated_at}`);
        });
      } else {
        console.log(`  ❌ NOT FOUND`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserLanguage();
