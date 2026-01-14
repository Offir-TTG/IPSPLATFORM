const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // ChatBot UI
  {
    key: 'chatbot.title',
    en: 'Learning Assistant',
    he: 'עוזר למידה',
    context: 'user'
  },
  {
    key: 'chatbot.status',
    en: 'Online • Ready to help',
    he: 'מחובר • מוכן לעזור',
    context: 'user'
  },
  {
    key: 'chatbot.placeholder',
    en: 'Ask me anything...',
    he: 'שאל אותי כל דבר...',
    context: 'user'
  },

  // Welcome Message
  {
    key: 'chatbot.welcome',
    en: "Hi! I'm your learning assistant. I can help you find courses, lessons, files, and more. Try asking me something like 'show my courses' or search for a specific topic!",
    he: 'שלום! אני עוזר הלמידה שלך. אני יכול לעזור לך למצוא קורסים, שיעורים, קבצים ועוד. נסה לשאול אותי משהו כמו "הראה לי את הקורסים שלי" או חפש נושא ספציפי!',
    context: 'user'
  },

  // Quick Actions
  {
    key: 'chatbot.quickAction.myCourses',
    en: 'My Courses',
    he: 'הקורסים שלי',
    context: 'user'
  },
  {
    key: 'chatbot.quickAction.upcomingLessons',
    en: 'Upcoming Lessons',
    he: 'שיעורים קרובים',
    context: 'user'
  },
  {
    key: 'chatbot.quickAction.recentFiles',
    en: 'Recent Files',
    he: 'קבצים אחרונים',
    context: 'user'
  },
  {
    key: 'chatbot.quickAction.myAssignments',
    en: 'My Assignments',
    he: 'המ과לות שלי',
    context: 'user'
  },

  // Bot Responses
  {
    key: 'chatbot.response.hereAreYour',
    en: 'Here are your {item}:',
    he: 'הנה ה{item} שלך:',
    context: 'user'
  },
  {
    key: 'chatbot.response.foundResults',
    en: 'I found {count} result{plural} for "{query}":',
    he: 'מצאתי {count} תוצאות עבור "{query}":',
    context: 'user'
  },
  {
    key: 'chatbot.response.noResults',
    en: 'I couldn\'t find anything matching "{query}". Try searching for courses, lessons, or files you\'re enrolled in.',
    he: 'לא מצאתי שום דבר שתואם את "{query}". נסה לחפש קורסים, שיעורים או קבצים שאתה רשום אליהם.',
    context: 'user'
  },
  {
    key: 'chatbot.response.error',
    en: 'Sorry, I encountered an error. Please try again.',
    he: 'מצטער, נתקלתי בשגיאה. אנא נסה שוב.',
    context: 'user'
  },

  // Command Mappings
  {
    key: 'chatbot.command.myCourses',
    en: 'my courses',
    he: 'הקורסים שלי',
    context: 'user'
  },
  {
    key: 'chatbot.command.upcomingLessons',
    en: 'upcoming lessons',
    he: 'שיעורים קרובים',
    context: 'user'
  },
  {
    key: 'chatbot.command.recentFiles',
    en: 'recent files',
    he: 'קבצים אחרונים',
    context: 'user'
  },
  {
    key: 'chatbot.command.myAssignments',
    en: 'my assignments',
    he: 'המטלות שלי',
    context: 'user'
  },
];

async function addTranslations() {
  console.log('🌐 Adding ChatBot translations...\n');

  // Get tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (!tenant) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log('Using tenant ID:', tenant.id);

  let added = 0;
  let skipped = 0;

  for (const translation of translations) {
    // Check if translation already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .eq('context', translation.context);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping existing: ${translation.key}`);
      skipped++;
      continue;
    }

    // Add English translation
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: translation.context,
      });

    if (enError) {
      console.error(`❌ Error adding EN translation for ${translation.key}:`, enError);
      continue;
    }

    // Add Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: translation.context,
      });

    if (heError) {
      console.error(`❌ Error adding HE translation for ${translation.key}:`, heError);
      continue;
    }

    console.log(`✅ Added: ${translation.key}`);
    added += 2; // EN + HE
  }

  console.log('\n==================================================');
  console.log(`✅ Successfully added: ${added}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log('==================================================');
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
