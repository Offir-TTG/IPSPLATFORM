/**
 * Apply Enrollment Statistics Sidebar Translations
 * Adds Hebrew translations for enrollment stats in course builder sidebar
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
  // Section title
  {
    translation_key: 'lms.builder.enrollment_stats',
    language_code: 'en',
    translation_value: 'Enrollment Statistics',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.enrollment_stats',
    language_code: 'he',
    translation_value: 'סטטיסטיקת הרשמות',
    context: 'admin',
  },

  // Total Enrollments
  {
    translation_key: 'lms.builder.total_enrollments',
    language_code: 'en',
    translation_value: 'Total Enrollments',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.total_enrollments',
    language_code: 'he',
    translation_value: 'סה"כ הרשמות',
    context: 'admin',
  },

  // Lifetime Sales
  {
    translation_key: 'lms.builder.lifetime_sales',
    language_code: 'en',
    translation_value: 'Lifetime Sales',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.lifetime_sales',
    language_code: 'he',
    translation_value: 'מכירות כוללות',
    context: 'admin',
  },

  // Completed
  {
    translation_key: 'lms.builder.completed',
    language_code: 'en',
    translation_value: 'Completed',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.completed',
    language_code: 'he',
    translation_value: 'הושלם',
    context: 'admin',
  },

  // In Progress
  {
    translation_key: 'lms.builder.in_progress',
    language_code: 'en',
    translation_value: 'In Progress',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.in_progress',
    language_code: 'he',
    translation_value: 'בתהליך',
    context: 'admin',
  },

  // Not Started
  {
    translation_key: 'lms.builder.not_started',
    language_code: 'en',
    translation_value: 'Not Started',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.not_started',
    language_code: 'he',
    translation_value: 'טרם התחיל',
    context: 'admin',
  },

  // Students label
  {
    translation_key: 'lms.builder.students',
    language_code: 'en',
    translation_value: 'students',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.students',
    language_code: 'he',
    translation_value: 'תלמידים',
    context: 'admin',
  },
];

async function applyTranslations() {
  console.log('Starting enrollment statistics sidebar translations...\n');

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

  console.log('\n✅ Enrollment statistics sidebar translations complete!');
}

applyTranslations().catch(console.error);
