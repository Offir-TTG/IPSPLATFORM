import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Content type label
  { key: 'lms.topics.whiteboard', en: 'Whiteboard', he: 'לוח אינטראקטיבי' },
  { key: 'lms.topics.add_whiteboard', en: 'Add Whiteboard', he: 'הוסף לוח אינטראקטיבי' },

  // Form labels
  { key: 'lms.topics.whiteboard_title', en: 'Whiteboard', he: 'לוח אינטראקטיבי' },
  { key: 'lms.topics.whiteboard_description', en: 'Create an interactive whiteboard for students', he: 'צור לוח אינטראקטיבי לתלמידים' },
  { key: 'lms.topics.clear_whiteboard', en: 'Clear Whiteboard', he: 'נקה לוח' },
  { key: 'lms.topics.clear_whiteboard_confirm', en: 'Are you sure? This will erase all content.', he: 'האם אתה בטוח? פעולה זו תמחק את כל התוכן.' },
  { key: 'lms.topics.allow_collaboration', en: 'Allow Student Collaboration', he: 'אפשר שיתוף פעולה של תלמידים' },
  { key: 'lms.topics.allow_collaboration_desc', en: 'Let students draw together in real-time', he: 'אפשר לתלמידים לצייר יחד בזמן אמת' },
  { key: 'lms.topics.auto_save_info', en: 'Auto-saves every 30 seconds', he: 'נשמר אוטומטית כל 30 שניות' },

  // Display labels
  { key: 'lms.topics.no_whiteboard_content', en: 'Whiteboard is empty', he: 'הלוח ריק' },
  { key: 'lms.topics.whiteboard_read_only', en: 'View Only', he: 'צפייה בלבד' },
  { key: 'lms.topics.whiteboard_collaborative', en: 'Collaborative', he: 'שיתופי' },
  { key: 'lms.topics.active_collaborators', en: '{count} viewing', he: '{count} צופים' },
  { key: 'lms.topics.export_whiteboard', en: 'Export as Image', he: 'ייצא כתמונה' },
  { key: 'lms.topics.collaboration_enabled_info', en: 'You can draw and collaborate with other students in real-time', he: 'ניתן לצייר ולשתף פעולה עם תלמידים אחרים בזמן אמת' },

  // Collaboration
  { key: 'lms.topics.you', en: 'You', he: 'אתה' },
  { key: 'lms.topics.collaborator', en: 'Collaborator', he: 'משתף פעולה' },
];

async function applyTranslations() {
  console.log('🚀 Starting whiteboard translations migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const { key, en, he } of translations) {
    try {
      // Insert EN translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: key,
          language_code: 'en',
          translation_value: en,
          context: 'admin',
          tenant_id: null,
        });

      if (enError) {
        console.error(`❌ ${key} (EN):`, enError.message);
        errorCount++;
      } else {
        successCount++;
      }

      // Insert HE translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: key,
          language_code: 'he',
          translation_value: he,
          context: 'admin',
          tenant_id: null,
        });

      if (heError) {
        console.error(`❌ ${key} (HE):`, heError.message);
        errorCount++;
      } else {
        successCount++;
      }

      if (!enError && !heError) {
        console.log(`✅ ${key}`);
      }
    } catch (error) {
      console.error(`❌ ${key}:`, error);
      errorCount += 2;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount} translations`);
  console.log(`   ❌ Failed: ${errorCount} translations`);
  console.log(`\n✨ Whiteboard translations migration complete!`);
}

applyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
