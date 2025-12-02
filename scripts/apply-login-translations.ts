/**
 * Apply Login Page Translations
 * Adds Hebrew translation for login page subtitle
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  translation_key: string;
  language_code: string;
  translation_value: string;
  context: string;
}

const translations: Translation[] = [
  // Login subtitle
  {
    translation_key: 'auth.login.subtitle',
    language_code: 'en',
    translation_value: 'Sign in to your account to continue',
    context: 'user',
  },
  {
    translation_key: 'auth.login.subtitle',
    language_code: 'he',
    translation_value: 'היכנס לחשבון שלך כדי להמשיך',
    context: 'user',
  },
];

async function applyTranslations() {
  console.log('Starting login page translations...\n');

  for (const translation of translations) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('translations')
        .select('*')
        .eq('translation_key', translation.translation_key)
        .eq('language_code', translation.language_code)
        .eq('context', translation.context)
        .is('tenant_id', null)
        .maybeSingle();

      if (fetchError) {
        console.error(`Error checking ${translation.translation_key} (${translation.language_code}):`, fetchError);
        continue;
      }

      if (existing) {
        // Update if different
        if (existing.translation_value !== translation.translation_value) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: translation.translation_value })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating ${translation.translation_key} (${translation.language_code}):`, updateError);
          } else {
            console.log(`✅ Updated: ${translation.translation_key} (${translation.language_code})`);
          }
        } else {
          console.log(`⏭️  Skipped (unchanged): ${translation.translation_key} (${translation.language_code})`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            translation_key: translation.translation_key,
            language_code: translation.language_code,
            translation_value: translation.translation_value,
            context: translation.context,
            tenant_id: null,
          });

        if (insertError) {
          console.error(`Error inserting ${translation.translation_key} (${translation.language_code}):`, insertError);
        } else {
          console.log(`✅ Inserted: ${translation.translation_key} (${translation.language_code})`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${translation.translation_key} (${translation.language_code}):`, error);
    }
  }

  console.log('\n✅ Login page translations complete!');
}

applyTranslations().catch(console.error);
