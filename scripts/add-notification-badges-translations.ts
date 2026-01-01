import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'exists' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'exists' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Read status
  {
    key: 'admin.notifications.read',
    en: 'read',
    he: 'נקראו',
  },

  // Priority translations
  {
    key: 'admin.notifications.priority.low',
    en: 'Low',
    he: 'נמוכה',
  },
  {
    key: 'admin.notifications.priority.medium',
    en: 'Medium',
    he: 'בינונית',
  },
  {
    key: 'admin.notifications.priority.high',
    en: 'High',
    he: 'גבוהה',
  },
  {
    key: 'admin.notifications.priority.urgent',
    en: 'Urgent',
    he: 'דחוף',
  },

  // Scope translations
  {
    key: 'admin.notifications.scope.individual',
    en: 'Individual',
    he: 'אישי',
  },
  {
    key: 'admin.notifications.scope.course',
    en: 'Course',
    he: 'קורס',
  },
  {
    key: 'admin.notifications.scope.program',
    en: 'Program',
    he: 'תוכנית',
  },
  {
    key: 'admin.notifications.scope.tenant',
    en: 'All Users',
    he: 'כל המשתמשים',
  },

  // Category translations
  {
    key: 'admin.notifications.category.lesson',
    en: 'Lesson',
    he: 'שיעור',
  },
  {
    key: 'admin.notifications.category.assignment',
    en: 'Assignment',
    he: 'משימה',
  },
  {
    key: 'admin.notifications.category.payment',
    en: 'Payment',
    he: 'תשלום',
  },
  {
    key: 'admin.notifications.category.enrollment',
    en: 'Enrollment',
    he: 'הרשמה',
  },
  {
    key: 'admin.notifications.category.attendance',
    en: 'Attendance',
    he: 'נוכחות',
  },
  {
    key: 'admin.notifications.category.achievement',
    en: 'Achievement',
    he: 'הישג',
  },
  {
    key: 'admin.notifications.category.announcement',
    en: 'Announcement',
    he: 'הודעה',
  },
  {
    key: 'admin.notifications.category.system',
    en: 'System',
    he: 'מערכת',
  },
];

async function addTranslations() {
  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`Found ${tenants?.length || 0} tenants`);

    for (const tenant of tenants || []) {
      console.log(`\nProcessing tenant: ${tenant.id}`);

      for (const translation of translations) {
        // Check if Hebrew translation exists
        const { data: existing } = await supabase
          .from('translations')
          .select('id, translation_value')
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (existing) {
          // Update existing translation
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: translation.he })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating ${translation.key}:`, updateError);
          } else {
            console.log(`✓ Updated: ${translation.key}`);
          }
        } else {
          // Insert new translation
          const { error: insertError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              language_code: 'he',
              translation_key: translation.key,
              translation_value: translation.he,
              context: 'admin',
            });

          if (insertError) {
            console.error(`Error inserting ${translation.key}:`, insertError);
          } else {
            console.log(`✓ Inserted: ${translation.key}`);
          }
        }

        // Also ensure English translation exists
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id')
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (!existingEn) {
          const { error: insertEnError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              language_code: 'en',
              translation_key: translation.key,
              translation_value: translation.en,
              context: 'admin',
            });

          if (insertEnError) {
            console.error(`Error inserting EN ${translation.key}:`, insertEnError);
          } else {
            console.log(`✓ Inserted EN: ${translation.key}`);
          }
        }
      }
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTranslations();
