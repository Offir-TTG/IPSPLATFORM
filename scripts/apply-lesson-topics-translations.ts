/**
 * Apply Lesson Topics Translations
 * Adds Hebrew translations for lesson topics/content blocks system
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
    translation_key: 'lms.topics.lesson_content',
    language_code: 'en',
    translation_value: 'Lesson Content',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.lesson_content',
    language_code: 'he',
    translation_value: 'תוכן השיעור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.manage_content_blocks',
    language_code: 'en',
    translation_value: 'Add and organize content blocks for this lesson',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.manage_content_blocks',
    language_code: 'he',
    translation_value: 'הוסף וארגן בלוקי תוכן לשיעור זה',
    context: 'admin',
  },

  // Content types
  {
    translation_key: 'lms.topics.video',
    language_code: 'en',
    translation_value: 'Video',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.video',
    language_code: 'he',
    translation_value: 'וידאו',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.text',
    language_code: 'en',
    translation_value: 'Text',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.text',
    language_code: 'he',
    translation_value: 'טקסט',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link',
    language_code: 'en',
    translation_value: 'External Link',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link',
    language_code: 'he',
    translation_value: 'קישור חיצוני',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf',
    language_code: 'en',
    translation_value: 'PDF Document',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf',
    language_code: 'he',
    translation_value: 'מסמך PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.download',
    language_code: 'en',
    translation_value: 'Downloadable File',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.download',
    language_code: 'he',
    translation_value: 'קובץ להורדה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed',
    language_code: 'en',
    translation_value: 'Embed Code',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed',
    language_code: 'he',
    translation_value: 'קוד הטמעה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.quiz',
    language_code: 'en',
    translation_value: 'Quiz',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.quiz',
    language_code: 'he',
    translation_value: 'מבחן',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.assignment',
    language_code: 'en',
    translation_value: 'Assignment',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.assignment',
    language_code: 'he',
    translation_value: 'מטלה',
    context: 'admin',
  },

  // Actions
  {
    translation_key: 'lms.topics.add_topic',
    language_code: 'en',
    translation_value: 'Add Content Block',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_topic',
    language_code: 'he',
    translation_value: 'הוסף בלוק תוכן',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.edit_topic',
    language_code: 'en',
    translation_value: 'Edit Content Block',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.edit_topic',
    language_code: 'he',
    translation_value: 'ערוך בלוק תוכן',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.delete_topic',
    language_code: 'en',
    translation_value: 'Delete Content',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.delete_topic',
    language_code: 'he',
    translation_value: 'מחק תוכן',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.preview_mode',
    language_code: 'en',
    translation_value: 'Preview Mode',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.preview_mode',
    language_code: 'he',
    translation_value: 'מצב תצוגה מקדימה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.edit_mode',
    language_code: 'en',
    translation_value: 'Edit Mode',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.edit_mode',
    language_code: 'he',
    translation_value: 'מצב עריכה',
    context: 'admin',
  },

  // Add content types
  {
    translation_key: 'lms.topics.add_video',
    language_code: 'en',
    translation_value: 'Add Video',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_video',
    language_code: 'he',
    translation_value: 'הוסף וידאו',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_text',
    language_code: 'en',
    translation_value: 'Add Text',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_text',
    language_code: 'he',
    translation_value: 'הוסף טקסט',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_link',
    language_code: 'en',
    translation_value: 'Add Link',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_link',
    language_code: 'he',
    translation_value: 'הוסף קישור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_pdf',
    language_code: 'en',
    translation_value: 'Add PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_pdf',
    language_code: 'he',
    translation_value: 'הוסף PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_download',
    language_code: 'en',
    translation_value: 'Add Download',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_download',
    language_code: 'he',
    translation_value: 'הוסף הורדה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_embed',
    language_code: 'en',
    translation_value: 'Add Embed',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_embed',
    language_code: 'he',
    translation_value: 'הוסף הטמעה',
    context: 'admin',
  },

  // Common fields
  {
    translation_key: 'lms.topics.title',
    language_code: 'en',
    translation_value: 'Title',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.title',
    language_code: 'he',
    translation_value: 'כותרת',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.title_placeholder',
    language_code: 'en',
    translation_value: 'Enter a title for this content',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.title_placeholder',
    language_code: 'he',
    translation_value: 'הזן כותרת לתוכן זה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.duration',
    language_code: 'en',
    translation_value: 'Duration',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.duration',
    language_code: 'he',
    translation_value: 'משך',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.minutes',
    language_code: 'en',
    translation_value: 'minutes',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.minutes',
    language_code: 'he',
    translation_value: 'דקות',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.duration_placeholder',
    language_code: 'en',
    translation_value: 'Optional: Estimated time to complete',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.duration_placeholder',
    language_code: 'he',
    translation_value: 'אופציונלי: זמן משוער להשלמה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.required',
    language_code: 'en',
    translation_value: 'Required',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.required',
    language_code: 'he',
    translation_value: 'חובה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.mark_required',
    language_code: 'en',
    translation_value: 'Mark as required for course completion',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.mark_required',
    language_code: 'he',
    translation_value: 'סמן כנדרש להשלמת הקורס',
    context: 'admin',
  },

  // Empty states
  {
    translation_key: 'lms.topics.no_content',
    language_code: 'en',
    translation_value: 'No content blocks yet',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_content',
    language_code: 'he',
    translation_value: 'אין בלוקי תוכן עדיין',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_first_block',
    language_code: 'en',
    translation_value: 'Add your first content block to get started',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.add_first_block',
    language_code: 'he',
    translation_value: 'הוסף את בלוק התוכן הראשון כדי להתחיל',
    context: 'admin',
  },

  // Video
  {
    translation_key: 'lms.topics.video_url',
    language_code: 'en',
    translation_value: 'Video URL',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.video_url',
    language_code: 'he',
    translation_value: 'כתובת וידאו',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.youtube_vimeo',
    language_code: 'en',
    translation_value: 'Supports YouTube and Vimeo URLs',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.youtube_vimeo',
    language_code: 'he',
    translation_value: 'תומך בכתובות YouTube ו-Vimeo',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_video_url',
    language_code: 'en',
    translation_value: 'Invalid video URL. Please use YouTube or Vimeo links.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_video_url',
    language_code: 'he',
    translation_value: 'כתובת וידאו לא חוקית. אנא השתמש בקישורי YouTube או Vimeo.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_video_url',
    language_code: 'en',
    translation_value: 'No video URL provided',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_video_url',
    language_code: 'he',
    translation_value: 'לא סופקה כתובת וידאו',
    context: 'admin',
  },

  // Text
  {
    translation_key: 'lms.topics.rich_text',
    language_code: 'en',
    translation_value: 'Content',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.rich_text',
    language_code: 'he',
    translation_value: 'תוכן',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.text_placeholder',
    language_code: 'en',
    translation_value: 'Start typing your content...',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.text_placeholder',
    language_code: 'he',
    translation_value: 'התחל להקליד את התוכן שלך...',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_text_content',
    language_code: 'en',
    translation_value: 'No content provided',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_text_content',
    language_code: 'he',
    translation_value: 'לא סופק תוכן',
    context: 'admin',
  },

  // Link
  {
    translation_key: 'lms.topics.link_url',
    language_code: 'en',
    translation_value: 'URL',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_url',
    language_code: 'he',
    translation_value: 'כתובת URL',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_title',
    language_code: 'en',
    translation_value: 'Link Title',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_title',
    language_code: 'he',
    translation_value: 'כותרת הקישור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_title_placeholder',
    language_code: 'en',
    translation_value: 'Custom display text for the link',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_title_placeholder',
    language_code: 'he',
    translation_value: 'טקסט תצוגה מותאם אישית לקישור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_description',
    language_code: 'en',
    translation_value: 'Description',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_description',
    language_code: 'he',
    translation_value: 'תיאור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_description_placeholder',
    language_code: 'en',
    translation_value: 'Brief description of the link',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_description_placeholder',
    language_code: 'he',
    translation_value: 'תיאור קצר של הקישור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.open_in_new_tab',
    language_code: 'en',
    translation_value: 'Open in new tab',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.open_in_new_tab',
    language_code: 'he',
    translation_value: 'פתח בטאב חדש',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.open_link',
    language_code: 'en',
    translation_value: 'Open Link',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.open_link',
    language_code: 'he',
    translation_value: 'פתח קישור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_link_url',
    language_code: 'en',
    translation_value: 'No link URL provided',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_link_url',
    language_code: 'he',
    translation_value: 'לא סופקה כתובת קישור',
    context: 'admin',
  },

  // PDF
  {
    translation_key: 'lms.topics.upload_pdf',
    language_code: 'en',
    translation_value: 'PDF Document',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.upload_pdf',
    language_code: 'he',
    translation_value: 'מסמך PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.select_pdf',
    language_code: 'en',
    translation_value: 'Select PDF File',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.select_pdf',
    language_code: 'he',
    translation_value: 'בחר קובץ PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.view_pdf',
    language_code: 'en',
    translation_value: 'View PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.view_pdf',
    language_code: 'he',
    translation_value: 'צפה ב-PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_max_size',
    language_code: 'en',
    translation_value: 'Maximum file size: 50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_max_size',
    language_code: 'he',
    translation_value: 'גודל קובץ מקסימלי: 50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_pdf',
    language_code: 'en',
    translation_value: 'Please select a PDF file',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_pdf',
    language_code: 'he',
    translation_value: 'אנא בחר קובץ PDF',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_too_large',
    language_code: 'en',
    translation_value: 'PDF file must be smaller than 50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_too_large',
    language_code: 'he',
    translation_value: 'קובץ PDF חייב להיות קטן מ-50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_upload_failed',
    language_code: 'en',
    translation_value: 'Failed to upload PDF. Please try again.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.pdf_upload_failed',
    language_code: 'he',
    translation_value: 'העלאת PDF נכשלה. אנא נסה שוב.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_pdf_file',
    language_code: 'en',
    translation_value: 'No PDF file uploaded',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_pdf_file',
    language_code: 'he',
    translation_value: 'לא הועלה קובץ PDF',
    context: 'admin',
  },

  // Download
  {
    translation_key: 'lms.topics.upload_file',
    language_code: 'en',
    translation_value: 'File',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.upload_file',
    language_code: 'he',
    translation_value: 'קובץ',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.select_file',
    language_code: 'en',
    translation_value: 'Select File',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.select_file',
    language_code: 'he',
    translation_value: 'בחר קובץ',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.download_button',
    language_code: 'en',
    translation_value: 'Download',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.download_button',
    language_code: 'he',
    translation_value: 'הורד',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_description',
    language_code: 'en',
    translation_value: 'Description',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_description',
    language_code: 'he',
    translation_value: 'תיאור',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_description_placeholder',
    language_code: 'en',
    translation_value: 'Describe what this file contains',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_description_placeholder',
    language_code: 'he',
    translation_value: 'תאר מה הקובץ מכיל',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_max_size',
    language_code: 'en',
    translation_value: 'Maximum file size: 50MB. All file types supported.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_max_size',
    language_code: 'he',
    translation_value: 'גודל קובץ מקסימלי: 50MB. כל סוגי הקבצים נתמכים.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_too_large',
    language_code: 'en',
    translation_value: 'File must be smaller than 50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_too_large',
    language_code: 'he',
    translation_value: 'הקובץ חייב להיות קטן מ-50MB',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_upload_failed',
    language_code: 'en',
    translation_value: 'Failed to upload file. Please try again.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.file_upload_failed',
    language_code: 'he',
    translation_value: 'העלאת הקובץ נכשלה. אנא נסה שוב.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_download_file',
    language_code: 'en',
    translation_value: 'No file uploaded',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_download_file',
    language_code: 'he',
    translation_value: 'לא הועלה קובץ',
    context: 'admin',
  },

  // Embed
  {
    translation_key: 'lms.topics.embed_code',
    language_code: 'en',
    translation_value: 'Embed Code',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed_code',
    language_code: 'he',
    translation_value: 'קוד הטמעה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.paste_iframe',
    language_code: 'en',
    translation_value: 'Paste the iframe embed code from YouTube, Vimeo, Google Docs, etc.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.paste_iframe',
    language_code: 'he',
    translation_value: 'הדבק את קוד ההטמעה מ-YouTube, Vimeo, Google Docs וכו\'.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.allowed_domains',
    language_code: 'en',
    translation_value: 'Allowed: YouTube, Vimeo, Google Docs, Microsoft Forms, Miro, Figma, Canva',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.allowed_domains',
    language_code: 'he',
    translation_value: 'מותר: YouTube, Vimeo, Google Docs, Microsoft Forms, Miro, Figma, Canva',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed_width',
    language_code: 'en',
    translation_value: 'Width',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed_width',
    language_code: 'he',
    translation_value: 'רוחב',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed_height',
    language_code: 'en',
    translation_value: 'Height',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.embed_height',
    language_code: 'he',
    translation_value: 'גובה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_embed',
    language_code: 'en',
    translation_value: 'Invalid embed code. Could not find src attribute.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.invalid_embed',
    language_code: 'he',
    translation_value: 'קוד הטמעה לא חוקי. לא נמצא מאפיין src.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.unsupported_embed',
    language_code: 'en',
    translation_value: 'Unsupported embed source. Only trusted domains are allowed.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.unsupported_embed',
    language_code: 'he',
    translation_value: 'מקור הטמעה לא נתמך. רק דומיינים מהימנים מותרים.',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_embed_code',
    language_code: 'en',
    translation_value: 'No embed code provided',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.no_embed_code',
    language_code: 'he',
    translation_value: 'לא סופק קוד הטמעה',
    context: 'admin',
  },

  // Messages
  {
    translation_key: 'lms.topics.confirm_delete',
    language_code: 'en',
    translation_value: 'Are you sure you want to delete this content block?',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.confirm_delete',
    language_code: 'he',
    translation_value: 'האם אתה בטוח שברצונך למחוק את בלוק התוכן הזה?',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.delete_failed',
    language_code: 'en',
    translation_value: 'Failed to delete topic',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.delete_failed',
    language_code: 'he',
    translation_value: 'מחיקת הנושא נכשלה',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.title_required',
    language_code: 'en',
    translation_value: 'Title is required',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.title_required',
    language_code: 'he',
    translation_value: 'כותרת נדרשת',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.content_required',
    language_code: 'en',
    translation_value: 'Content is required',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.content_required',
    language_code: 'he',
    translation_value: 'תוכן נדרש',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.video_url_required',
    language_code: 'en',
    translation_value: 'Video URL is required',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.video_url_required',
    language_code: 'he',
    translation_value: 'כתובת וידאו נדרשת',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_url_required',
    language_code: 'en',
    translation_value: 'Link URL is required',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.link_url_required',
    language_code: 'he',
    translation_value: 'כתובת קישור נדרשת',
    context: 'admin',
  },

  // Coming soon
  {
    translation_key: 'lms.topics.quiz_coming_soon',
    language_code: 'en',
    translation_value: 'Quiz content (Coming Soon)',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.quiz_coming_soon',
    language_code: 'he',
    translation_value: 'תוכן מבחן (בקרוב)',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.assignment_coming_soon',
    language_code: 'en',
    translation_value: 'Assignment content (Coming Soon)',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.assignment_coming_soon',
    language_code: 'he',
    translation_value: 'תוכן מטלה (בקרוב)',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.unknown_type',
    language_code: 'en',
    translation_value: 'Unknown content type',
    context: 'admin',
  },
  {
    translation_key: 'lms.topics.unknown_type',
    language_code: 'he',
    translation_value: 'סוג תוכן לא ידוע',
    context: 'admin',
  },

  // Edit lesson content button
  {
    translation_key: 'lms.builder.edit_lesson_content',
    language_code: 'en',
    translation_value: 'Edit Content',
    context: 'admin',
  },
  {
    translation_key: 'lms.builder.edit_lesson_content',
    language_code: 'he',
    translation_value: 'ערוך תוכן',
    context: 'admin',
  },
];

async function applyTranslations() {
  console.log('Starting lesson topics translations...\n');

  let insertCount = 0;
  let updateCount = 0;
  let skipCount = 0;

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
            updateCount++;
          }
        } else {
          console.log(`⏭️  Skipped (unchanged): ${translation.translation_key} (${translation.language_code})`);
          skipCount++;
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
          insertCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing ${translation.translation_key} (${translation.language_code}):`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Inserted: ${insertCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`\n✅ Lesson topics translations complete!`);
}

applyTranslations().catch(console.error);
