require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTranslations() {
  // Correct Hebrew translations from the script
  const correctTranslations = [
    {
      translation_key: 'lms.lesson.meeting_integration_title',
      language_code: 'he',
      translation_value: 'אינטגרציית פגישת וידאו'
    },
    {
      translation_key: 'lms.lesson.meeting_integration_desc',
      language_code: 'he',
      translation_value: 'צור פגישת וידאו אוטומטית עבור שיעור זה'
    },
  ];

  console.log('Updating Hebrew translations...\n');

  for (const trans of correctTranslations) {
    // Check current value
    const { data: current } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', trans.translation_key)
      .eq('language_code', trans.language_code)
      .single();

    if (current) {
      console.log(`Key: ${trans.translation_key}`);
      console.log(`  Current: ${current.translation_value}`);
      console.log(`  Expected: ${trans.translation_value}`);

      if (current.translation_value !== trans.translation_value) {
        const { error } = await supabase
          .from('translations')
          .update({ translation_value: trans.translation_value })
          .eq('translation_key', trans.translation_key)
          .eq('language_code', trans.language_code);

        if (error) {
          console.log(`  ❌ Error updating: ${error.message}`);
        } else {
          console.log(`  ✅ Updated!`);
        }
      } else {
        console.log(`  ✅ Already correct`);
      }
      console.log('');
    }
  }

  console.log('\nAll translations checked and updated.');
}

updateTranslations();
