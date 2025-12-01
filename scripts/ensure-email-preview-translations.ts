/**
 * Ensure All Email Preview Translations Exist
 * Checks and adds any missing translations for email preview functionality
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All required translations for email preview
const REQUIRED_TRANSLATIONS = [
  // Preview Dialog
  { key: 'emails.editor.preview_title', en: 'Email Preview', he: 'תצוגה מקדימה של אימייל', context: 'admin' },
  { key: 'emails.editor.preview_desc', en: 'Preview how your email will appear', he: 'תצוגה מקדימה כיצד האימייל שלך יופיע', context: 'admin' },

  // Preview Sections
  { key: 'emails.editor.subject', en: 'Subject', he: 'נושא', context: 'admin' },
  { key: 'emails.editor.html_preview', en: 'HTML Preview', he: 'תצוגה מקדימה HTML', context: 'admin' },
  { key: 'emails.editor.text_preview', en: 'Plain Text Preview', he: 'תצוגה מקדימה טקסט רגיל', context: 'admin' },

  // Empty States
  { key: 'emails.editor.no_subject', en: 'No subject', he: 'אין נושא', context: 'admin' },
  { key: 'emails.editor.no_text', en: 'No plain text version', he: 'אין גרסת טקסט רגיל', context: 'admin' },
  { key: 'emails.editor.no_version', en: 'No version available', he: 'אין גרסה זמינה', context: 'admin' },

  // Actions
  { key: 'emails.action.preview', en: 'Preview', he: 'תצוגה מקדימה', context: 'admin' },
  { key: 'emails.templates.edit', en: 'Edit', he: 'עריכה', context: 'admin' },
  { key: 'emails.card.variables_count', en: 'variables', he: 'משתנים', context: 'admin' },
];

async function ensureTranslation(key: string, languageCode: 'en' | 'he', value: string, context: string) {
  // Check if exists
  const { data: existing } = await supabase
    .from('translations')
    .select('id, translation_value')
    .eq('translation_key', key)
    .eq('language_code', languageCode)
    .eq('context', context)
    .is('tenant_id', null)
    .maybeSingle();

  if (existing) {
    if (existing.translation_value !== value) {
      // Update if value is different
      const { error } = await supabase
        .from('translations')
        .update({ translation_value: value })
        .eq('id', existing.id);

      if (error) {
        console.error(`❌ Error updating ${key} (${languageCode}):`, error);
        return 'error';
      } else {
        console.log(`🔄 Updated ${key} (${languageCode})`);
        return 'updated';
      }
    } else {
      return 'exists';
    }
  }

  // Insert new
  const { error } = await supabase
    .from('translations')
    .insert({
      tenant_id: null,
      translation_key: key,
      language_code: languageCode,
      translation_value: value,
      context: context
    });

  if (error) {
    console.error(`❌ Error inserting ${key} (${languageCode}):`, error);
    return 'error';
  } else {
    console.log(`✅ Added ${key} (${languageCode})`);
    return 'added';
  }
}

async function ensureAllTranslations() {
  console.log('🌐 Checking email preview translations...\n');

  let added = 0;
  let updated = 0;
  let exists = 0;
  let errors = 0;

  for (const trans of REQUIRED_TRANSLATIONS) {
    // English
    const enResult = await ensureTranslation(trans.key, 'en', trans.en, trans.context);
    if (enResult === 'added') added++;
    else if (enResult === 'updated') updated++;
    else if (enResult === 'exists') exists++;
    else errors++;

    // Hebrew
    const heResult = await ensureTranslation(trans.key, 'he', trans.he, trans.context);
    if (heResult === 'added') added++;
    else if (heResult === 'updated') updated++;
    else if (heResult === 'exists') exists++;
    else errors++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Translation check complete!`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⏭️  Already exists: ${exists}`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`);
  console.log('');
}

ensureAllTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
