/**
 * Apply Course Image Uploader Translations
 * Adds Hebrew translations for course cover image uploader
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
  // Main labels
  {
    translation_key: 'lms.course.cover_image',
    language_code: 'en',
    translation_value: 'Course Cover Image',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.cover_image',
    language_code: 'he',
    translation_value: 'תמונת שער של הקורס',
    context: 'admin',
  },

  // Recommended size
  {
    translation_key: 'lms.course.recommended_size',
    language_code: 'en',
    translation_value: 'Recommended: 1200x675px (16:9)',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.recommended_size',
    language_code: 'he',
    translation_value: 'מומלץ: 1200x675px (16:9)',
    context: 'admin',
  },

  // Upload button
  {
    translation_key: 'lms.course.upload_cover_image',
    language_code: 'en',
    translation_value: 'Upload Cover Image',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.upload_cover_image',
    language_code: 'he',
    translation_value: 'העלה תמונת שער',
    context: 'admin',
  },

  // Change button
  {
    translation_key: 'lms.course.change_cover_image',
    language_code: 'en',
    translation_value: 'Change Cover Image',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.change_cover_image',
    language_code: 'he',
    translation_value: 'שנה תמונת שער',
    context: 'admin',
  },

  // Remove button
  {
    translation_key: 'lms.course.remove_cover_image',
    language_code: 'en',
    translation_value: 'Remove Cover Image',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.remove_cover_image',
    language_code: 'he',
    translation_value: 'הסר תמונת שער',
    context: 'admin',
  },

  // Upload status
  {
    translation_key: 'lms.course.image_uploading',
    language_code: 'en',
    translation_value: 'Uploading...',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_uploading',
    language_code: 'he',
    translation_value: 'מעלה...',
    context: 'admin',
  },

  // Success messages
  {
    translation_key: 'lms.course.image_upload_success',
    language_code: 'en',
    translation_value: 'Cover image uploaded successfully',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_upload_success',
    language_code: 'he',
    translation_value: 'תמונת השער הועלתה בהצלחה',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.image_removed',
    language_code: 'en',
    translation_value: 'Cover image removed',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_removed',
    language_code: 'he',
    translation_value: 'תמונת השער הוסרה',
    context: 'admin',
  },

  // Error messages
  {
    translation_key: 'lms.course.image_upload_failed',
    language_code: 'en',
    translation_value: 'Failed to upload image. Please try again.',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_upload_failed',
    language_code: 'he',
    translation_value: 'העלאת התמונה נכשלה. אנא נסה שוב.',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.image_remove_failed',
    language_code: 'en',
    translation_value: 'Failed to remove image. Please try again.',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_remove_failed',
    language_code: 'he',
    translation_value: 'הסרת התמונה נכשלה. אנא נסה שוב.',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.invalid_image_type',
    language_code: 'en',
    translation_value: 'Please upload a JPG, PNG, WebP, or GIF image',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.invalid_image_type',
    language_code: 'he',
    translation_value: 'אנא העלה תמונת JPG, PNG, WebP או GIF',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.image_too_large',
    language_code: 'en',
    translation_value: 'Image must be smaller than 5MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_too_large',
    language_code: 'he',
    translation_value: 'התמונה חייבת להיות קטנה מ-5MB',
    context: 'admin',
  },

  // Confirmation
  {
    translation_key: 'lms.course.confirm_remove_image',
    language_code: 'en',
    translation_value: 'Are you sure you want to remove the cover image?',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.confirm_remove_image',
    language_code: 'he',
    translation_value: 'האם אתה בטוח שברצונך להסיר את תמונת השער?',
    context: 'admin',
  },

  // Drag and drop
  {
    translation_key: 'lms.course.drag_drop_image',
    language_code: 'en',
    translation_value: 'Drag and drop an image here, or click to browse',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.drag_drop_image',
    language_code: 'he',
    translation_value: 'גרור ושחרר תמונה כאן, או לחץ לעיון',
    context: 'admin',
  },

  // File formats
  {
    translation_key: 'lms.course.image_formats',
    language_code: 'en',
    translation_value: 'JPG, PNG, WebP, GIF up to 5MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_formats',
    language_code: 'he',
    translation_value: 'JPG, PNG, WebP, GIF עד 5MB',
    context: 'admin',
  },

  // Help text
  {
    translation_key: 'lms.course.image_size_limit',
    language_code: 'en',
    translation_value: 'Maximum file size: 5MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_size_limit',
    language_code: 'he',
    translation_value: 'גודל קובץ מקסימלי: 5MB',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.image_aspect_ratio',
    language_code: 'en',
    translation_value: 'Best aspect ratio: 16:9',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_aspect_ratio',
    language_code: 'he',
    translation_value: 'יחס גובה-רוחב מומלץ: 16:9',
    context: 'admin',
  },

  {
    translation_key: 'lms.course.image_resolution',
    language_code: 'en',
    translation_value: 'Recommended: 1200x675px',
    context: 'admin',
  },
  {
    translation_key: 'lms.course.image_resolution',
    language_code: 'he',
    translation_value: 'מומלץ: 1200x675px',
    context: 'admin',
  },
];

async function applyTranslations() {
  console.log('Starting course image uploader translations...\n');

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

  console.log('\n✅ Course image uploader translations complete!');
}

applyTranslations().catch(console.error);
