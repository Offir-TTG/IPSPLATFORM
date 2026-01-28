/**
 * Add Hebrew translations for profile page toast messages
 * Run: npx ts-node scripts/add-profile-toast-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  context: string;
}

const translations: Translation[] = [
  // Profile page toast messages
  {
    key: 'user.profile.update.success',
    en: 'Profile updated successfully',
    he: 'הפרופיל עודכן בהצלחה',
    context: 'user',
  },
  {
    key: 'user.profile.update.error',
    en: 'Failed to update profile',
    he: 'שגיאה בעדכון הפרופיל',
    context: 'user',
  },
  {
    key: 'user.profile.avatar.upload_success',
    en: 'Avatar updated successfully',
    he: 'תמונת הפרופיל עודכנה בהצלחה',
    context: 'user',
  },
  {
    key: 'user.profile.avatar.upload_error',
    en: 'Failed to upload avatar',
    he: 'שגיאה בהעלאת תמונת הפרופיל',
    context: 'user',
  },
  {
    key: 'user.profile.avatar.remove_success',
    en: 'Avatar removed successfully',
    he: 'תמונת הפרופיל הוסרה בהצלחה',
    context: 'user',
  },
  {
    key: 'user.profile.avatar.remove_error',
    en: 'Failed to remove avatar',
    he: 'שגיאה בהסרת תמונת הפרופיל',
    context: 'user',
  },
  {
    key: 'user.profile.deactivate.error',
    en: 'Failed to deactivate account',
    he: 'שגיאה בהשבתת החשבון',
    context: 'user',
  },

  // EditableProfileCard validation messages
  {
    key: 'user.profile.validation.missing_fields',
    en: 'Missing Required Fields',
    he: 'שדות חובה חסרים',
    context: 'user',
  },
  {
    key: 'user.profile.validation.invalid_email',
    en: 'Please enter a valid contact email address',
    he: 'נא להזין כתובת אימייל תקינה',
    context: 'user',
  },
  {
    key: 'user.profile.validation.phone_required',
    en: 'Please enter a phone number',
    he: 'נא להזין מספר טלפון',
    context: 'user',
  },
  {
    key: 'user.profile.validation.phone_invalid',
    en: 'Please enter a valid phone number with country code (e.g., +1 234 567 8900)',
    he: 'נא להזין מספר טלפון תקין עם קוד מדינה (למשל: +972 50 123 4567)',
    context: 'user',
  },
  {
    key: 'user.profile.validation.save_error',
    en: 'Failed to update profile. Please try again.',
    he: 'שגיאה בעדכון הפרופיל. נא לנסות שוב.',
    context: 'user',
  },
];

async function addTranslations() {
  console.log('🌐 Adding profile toast translations...\n');

  // Get the default tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError?.message);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: 'user',
      p_context: translation.context,
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error(`  ❌ Error adding English translation:`, enError.message);
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: 'user',
      p_context: translation.context,
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew translation:`, heError.message);
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ All profile toast translations added successfully!');
}

addTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
