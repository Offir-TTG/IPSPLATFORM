const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Page Header
  { key: 'accessibility.title', en: 'Accessibility Features', he: 'תכונות נגישות' },
  { key: 'accessibility.subtitle', en: 'Customize your experience for better accessibility', he: 'התאם אישית את החוויה שלך לנגישות טובה יותר' },

  // Font Size
  { key: 'accessibility.fontSize.title', en: 'Text Size', he: 'גודל טקסט' },
  { key: 'accessibility.fontSize.description', en: 'Adjust the text size for better readability', he: 'התאם את גודל הטקסט לקריאה נוחה יותר' },
  { key: 'accessibility.fontSize.current', en: 'Current size', he: 'גודל נוכחי' },
  { key: 'accessibility.fontSize.decrease', en: 'Smaller', he: 'קטן יותר' },
  { key: 'accessibility.fontSize.increase', en: 'Larger', he: 'גדול יותר' },
  { key: 'accessibility.fontSize.reset', en: 'Reset', he: 'איפוס' },

  // Theme
  { key: 'accessibility.theme.title', en: 'Theme', he: 'ערכת נושא' },
  { key: 'accessibility.theme.description', en: 'Switch between light and dark mode', he: 'החלף בין מצב בהיר לכהה' },
  { key: 'accessibility.theme.current', en: 'Current theme', he: 'ערכת נושא נוכחית' },
  { key: 'accessibility.theme.light', en: 'Light', he: 'בהיר' },
  { key: 'accessibility.theme.dark', en: 'Dark', he: 'כהה' },
  { key: 'accessibility.theme.switchToLight', en: 'Switch to Light Mode', he: 'עבור למצב בהיר' },
  { key: 'accessibility.theme.switchToDark', en: 'Switch to Dark Mode', he: 'עבור למצב כהה' },

  // High Contrast
  { key: 'accessibility.contrast.title', en: 'High Contrast', he: 'ניגודיות גבוהה' },
  { key: 'accessibility.contrast.description', en: 'Increase contrast for better visibility', he: 'הגבר ניגודיות לראות טובה יותר' },
  { key: 'accessibility.contrast.status', en: 'Status', he: 'סטטוס' },
  { key: 'accessibility.contrast.enable', en: 'Enable High Contrast', he: 'הפעל ניגודיות גבוהה' },
  { key: 'accessibility.contrast.disable', en: 'Disable High Contrast', he: 'כבה ניגודיות גבוהה' },

  // Language
  { key: 'accessibility.language.title', en: 'Language & Direction', he: 'שפה וכיוון' },
  { key: 'accessibility.language.description', en: 'Switch between languages and text direction', he: 'החלף בין שפות וכיוון טקסט' },
  { key: 'accessibility.language.current', en: 'Current language', he: 'שפה נוכחית' },

  // Keyboard Shortcuts
  { key: 'accessibility.shortcuts.title', en: 'Keyboard Shortcuts', he: 'קיצורי מקלדת' },
  { key: 'accessibility.shortcuts.description', en: 'Navigate the platform using keyboard shortcuts', he: 'נווט בפלטפורמה באמצעות קיצורי מקלדת' },
  { key: 'accessibility.shortcuts.tab', en: 'Navigate through interactive elements', he: 'נווט בין אלמנטים אינטראקטיביים' },
  { key: 'accessibility.shortcuts.enter', en: 'Activate buttons and links', he: 'הפעל כפתורים וקישורים' },
  { key: 'accessibility.shortcuts.esc', en: 'Close dialogs and modals', he: 'סגור חלונות דיאלוג ומודלים' },
  { key: 'accessibility.shortcuts.search', en: 'Search within page', he: 'חפש בעמוד' },
  { key: 'accessibility.shortcuts.zoomIn', en: 'Zoom in (browser level)', he: 'התקרב (ברמת הדפדפן)' },
  { key: 'accessibility.shortcuts.zoomOut', en: 'Zoom out (browser level)', he: 'התרחק (ברמת הדפדפן)' },

  // Screen Reader
  { key: 'accessibility.screenReader.title', en: 'Screen Reader Support', he: 'תמיכה בקורא מסך' },
  { key: 'accessibility.screenReader.description', en: 'This platform is compatible with screen readers', he: 'פלטפורמה זו תומכת בקוראי מסך' },
  { key: 'accessibility.screenReader.info', en: 'Our platform is designed to work with popular screen readers including:', he: 'הפלטפורמה שלנו תוכננה לעבוד עם קוראי מסך פופולריים כולל:' },

  // General
  { key: 'accessibility.enabled', en: 'Enabled', he: 'מופעל' },
  { key: 'accessibility.disabled', en: 'Disabled', he: 'כבוי' },
  { key: 'accessibility.default', en: 'Default', he: 'ברירת מחדל' },
  { key: 'accessibility.custom', en: 'Custom', he: 'מותאם אישית' },

  // Feedback
  { key: 'accessibility.feedback.message', en: 'We are committed to making our platform accessible to everyone. If you encounter any accessibility issues or have suggestions for improvement, please contact us at', he: 'אנו מחויבים להפוך את הפלטפורמה שלנו לנגישה לכולם. אם אתה נתקל בבעיות נגישות או יש לך הצעות לשיפור, אנא צור קשר במייל' },
];

async function addTranslations() {
  try {
    console.log('Starting to add accessibility translations...\n');

    // Get tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenantError) throw tenantError;
    if (!tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log(`Using tenant ID: ${tenantId}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      try {
        // Check if English translation exists
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .eq('context', 'user');

        if (existingEn && existingEn.length > 0) {
          console.log(`- Skipped EN (exists): ${translation.key}`);
        } else {
          // Insert English
          const { error: enError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenantId,
              translation_key: translation.key,
              translation_value: translation.en,
              language_code: 'en',
              context: 'user',
            });

          if (enError) throw enError;
          console.log(`✓ Added EN: ${translation.key}`);
          successCount++;
        }

        // Check if Hebrew translation exists
        const { data: existingHe } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .eq('context', 'user');

        if (existingHe && existingHe.length > 0) {
          console.log(`- Skipped HE (exists): ${translation.key}`);
        } else {
          // Insert Hebrew
          const { error: heError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenantId,
              translation_key: translation.key,
              translation_value: translation.he,
              language_code: 'he',
              context: 'user',
            });

          if (heError) throw heError;
          console.log(`✓ Added HE: ${translation.key}`);
          successCount++;
        }

        console.log('');
      } catch (err) {
        console.error(`✗ Error adding ${translation.key}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Translation import completed!`);
    console.log(`Total translations processed: ${translations.length}`);
    console.log(`Successfully added: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

addTranslations();
