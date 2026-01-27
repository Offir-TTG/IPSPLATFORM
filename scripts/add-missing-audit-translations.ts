/**
 * Add Missing Audit Trail Translations
 *
 * This script adds translation keys needed for formatting audit actions and field names
 * Includes: action verbs, resource types, and common field names
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
  key: string;
  en: string;
  he: string;
  category: string;
  context: string;
  description: string;
}

const missingTranslations: Translation[] = [
  // Action verbs
  {
    key: 'audit.action.created',
    en: 'Created',
    he: 'נוצר',
    category: 'audit',
    context: 'admin',
    description: 'Created action verb',
  },
  {
    key: 'audit.action.updated',
    en: 'Updated',
    he: 'עודכן',
    category: 'audit',
    context: 'admin',
    description: 'Updated action verb',
  },
  {
    key: 'audit.action.deleted',
    en: 'Deleted',
    he: 'נמחק',
    category: 'audit',
    context: 'admin',
    description: 'Deleted action verb',
  },
  {
    key: 'audit.action.accessed',
    en: 'Accessed',
    he: 'ניגש',
    category: 'audit',
    context: 'admin',
    description: 'Accessed action verb',
  },
  {
    key: 'audit.action.read',
    en: 'Read',
    he: 'נקרא',
    category: 'audit',
    context: 'admin',
    description: 'Read action verb',
  },
  {
    key: 'audit.action.modified',
    en: 'Modified',
    he: 'שונה',
    category: 'audit',
    context: 'admin',
    description: 'Modified action verb',
  },
  {
    key: 'audit.action.loggedIn',
    en: 'Logged In',
    he: 'התחבר',
    category: 'audit',
    context: 'admin',
    description: 'Logged in action',
  },
  {
    key: 'audit.action.loggedOut',
    en: 'Logged Out',
    he: 'התנתק',
    category: 'audit',
    context: 'admin',
    description: 'Logged out action',
  },

  // Resource types
  {
    key: 'audit.resource.profile',
    en: 'Profile',
    he: 'פרופיל',
    category: 'audit',
    context: 'admin',
    description: 'Profile resource type',
  },
  {
    key: 'audit.resource.user',
    en: 'User',
    he: 'משתמש',
    category: 'audit',
    context: 'admin',
    description: 'User resource type',
  },
  {
    key: 'audit.resource.lesson',
    en: 'Lesson',
    he: 'שיעור',
    category: 'audit',
    context: 'admin',
    description: 'Lesson resource type',
  },
  {
    key: 'audit.resource.course',
    en: 'Course',
    he: 'קורס',
    category: 'audit',
    context: 'admin',
    description: 'Course resource type',
  },
  {
    key: 'audit.resource.module',
    en: 'Module',
    he: 'מודול',
    category: 'audit',
    context: 'admin',
    description: 'Module resource type',
  },
  {
    key: 'audit.resource.enrollment',
    en: 'Enrollment',
    he: 'רישום',
    category: 'audit',
    context: 'admin',
    description: 'Enrollment resource type',
  },
  {
    key: 'audit.resource.payment',
    en: 'Payment',
    he: 'תשלום',
    category: 'audit',
    context: 'admin',
    description: 'Payment resource type',
  },
  {
    key: 'audit.resource.grade',
    en: 'Grade',
    he: 'ציון',
    category: 'audit',
    context: 'admin',
    description: 'Grade resource type',
  },

  // Common field names
  {
    key: 'audit.field.instagram_url',
    en: 'Instagram URL',
    he: 'קישור Instagram',
    category: 'audit',
    context: 'admin',
    description: 'Instagram URL field',
  },
  {
    key: 'audit.field.first_name',
    en: 'First Name',
    he: 'שם פרטי',
    category: 'audit',
    context: 'admin',
    description: 'First name field',
  },
  {
    key: 'audit.field.last_name',
    en: 'Last Name',
    he: 'שם משפחה',
    category: 'audit',
    context: 'admin',
    description: 'Last name field',
  },
  {
    key: 'audit.field.email',
    en: 'Email',
    he: 'אימייל',
    category: 'audit',
    context: 'admin',
    description: 'Email field',
  },
  {
    key: 'audit.field.phone',
    en: 'Phone',
    he: 'טלפון',
    category: 'audit',
    context: 'admin',
    description: 'Phone field',
  },
  {
    key: 'audit.field.bio',
    en: 'Bio',
    he: 'ביוגרפיה',
    category: 'audit',
    context: 'admin',
    description: 'Bio field',
  },
  {
    key: 'audit.field.website',
    en: 'Website',
    he: 'אתר אינטרנט',
    category: 'audit',
    context: 'admin',
    description: 'Website field',
  },
  {
    key: 'audit.field.linkedin_url',
    en: 'LinkedIn URL',
    he: 'קישור LinkedIn',
    category: 'audit',
    context: 'admin',
    description: 'LinkedIn URL field',
  },
  {
    key: 'audit.field.facebook_url',
    en: 'Facebook URL',
    he: 'קישור Facebook',
    category: 'audit',
    context: 'admin',
    description: 'Facebook URL field',
  },
  {
    key: 'audit.field.twitter_url',
    en: 'Twitter URL',
    he: 'קישור Twitter',
    category: 'audit',
    context: 'admin',
    description: 'Twitter URL field',
  },
  {
    key: 'audit.field.title',
    en: 'Title',
    he: 'כותרת',
    category: 'audit',
    context: 'admin',
    description: 'Title field',
  },
  {
    key: 'audit.field.description',
    en: 'Description',
    he: 'תיאור',
    category: 'audit',
    context: 'admin',
    description: 'Description field',
  },
  {
    key: 'audit.field.content',
    en: 'Content',
    he: 'תוכן',
    category: 'audit',
    context: 'admin',
    description: 'Content field',
  },
  {
    key: 'audit.field.status',
    en: 'Status',
    he: 'סטטוס',
    category: 'audit',
    context: 'admin',
    description: 'Status field',
  },
  {
    key: 'audit.field.is_active',
    en: 'Is Active',
    he: 'פעיל',
    category: 'audit',
    context: 'admin',
    description: 'Is active field',
  },
  {
    key: 'audit.field.role',
    en: 'Role',
    he: 'תפקיד',
    category: 'audit',
    context: 'admin',
    description: 'Role field',
  },

  // Event types for display
  {
    key: 'audit.eventType.CREATE',
    en: 'Create',
    he: 'יצירה',
    category: 'audit',
    context: 'admin',
    description: 'CREATE event type',
  },
  {
    key: 'audit.eventType.READ',
    en: 'Read',
    he: 'קריאה',
    category: 'audit',
    context: 'admin',
    description: 'READ event type',
  },
  {
    key: 'audit.eventType.UPDATE',
    en: 'Update',
    he: 'עדכון',
    category: 'audit',
    context: 'admin',
    description: 'UPDATE event type',
  },
  {
    key: 'audit.eventType.DELETE',
    en: 'Delete',
    he: 'מחיקה',
    category: 'audit',
    context: 'admin',
    description: 'DELETE event type',
  },
  {
    key: 'audit.eventType.LOGIN',
    en: 'Login',
    he: 'כניסה',
    category: 'audit',
    context: 'admin',
    description: 'LOGIN event type',
  },
  {
    key: 'audit.eventType.LOGOUT',
    en: 'Logout',
    he: 'יציאה',
    category: 'audit',
    context: 'admin',
    description: 'LOGOUT event type',
  },
  {
    key: 'audit.eventType.ACCESS',
    en: 'Access',
    he: 'גישה',
    category: 'audit',
    context: 'admin',
    description: 'ACCESS event type',
  },

  // Risk levels
  {
    key: 'audit.risk.low',
    en: 'Low',
    he: 'נמוך',
    category: 'audit',
    context: 'admin',
    description: 'Low risk level',
  },
  {
    key: 'audit.risk.medium',
    en: 'Medium',
    he: 'בינוני',
    category: 'audit',
    context: 'admin',
    description: 'Medium risk level',
  },
  {
    key: 'audit.risk.high',
    en: 'High',
    he: 'גבוה',
    category: 'audit',
    context: 'admin',
    description: 'High risk level',
  },
  {
    key: 'audit.risk.critical',
    en: 'Critical',
    he: 'קריטי',
    category: 'audit',
    context: 'admin',
    description: 'Critical risk level',
  },

  // Status values
  {
    key: 'audit.status.success',
    en: 'Success',
    he: 'הצליח',
    category: 'audit',
    context: 'admin',
    description: 'Success status',
  },
  {
    key: 'audit.status.failure',
    en: 'Failed',
    he: 'נכשל',
    category: 'audit',
    context: 'admin',
    description: 'Failure status',
  },
  {
    key: 'audit.status.pending',
    en: 'Pending',
    he: 'ממתין',
    category: 'audit',
    context: 'admin',
    description: 'Pending status',
  },
  {
    key: 'audit.status.partial',
    en: 'Partial',
    he: 'חלקי',
    category: 'audit',
    context: 'admin',
    description: 'Partial status',
  },
];

async function addMissingTranslations() {
  console.log('Starting to add missing audit translations...\n');

  // Get tenant ID (same pattern as other translation scripts)
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found in database');
    process.exit(1);
  }

  console.log(`Using tenant_id: ${tenantId}\n`);

  let addedCount = 0;
  let errorCount = 0;

  for (const translation of missingTranslations) {
    // Add Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        category: translation.category,
        context: translation.context,
      });

    if (heError) {
      // Ignore duplicate key errors (translation already exists)
      if (!heError.message.includes('duplicate key') && !heError.code?.includes('23505')) {
        console.error(`✗ Error adding Hebrew for ${translation.key}:`, heError.message);
        errorCount++;
      }
    } else {
      console.log(`✓ ${translation.key} (he): ${translation.he}`);
      addedCount++;
    }

    // Add English translation
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        category: translation.category,
        context: translation.context,
      });

    if (enError) {
      // Ignore duplicate key errors (translation already exists)
      if (!enError.message.includes('duplicate key') && !enError.code?.includes('23505')) {
        console.error(`✗ Error adding English for ${translation.key}:`, enError.message);
        errorCount++;
      }
    } else {
      console.log(`✓ ${translation.key} (en): ${translation.en}`);
      addedCount++;
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Translations added/updated: ${addedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total translation keys processed: ${missingTranslations.length}`);
}

// Run the script
addMissingTranslations()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
