require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding invoice translations...\n');

  const translations = [
    // Page titles
    {
      translation_key: 'user.invoices.title',
      language_code: 'en',
      translation_value: 'My Invoices',
      category: 'user',
      context: 'user'
    },
    {
      translation_key: 'user.invoices.title',
      language_code: 'he',
      translation_value: 'החשבוניות שלי',
      category: 'user',
      context: 'user'
    },
    {
      translation_key: 'user.invoices.subtitle',
      language_code: 'en',
      translation_value: 'View and download your invoices',
      category: 'user',
      context: 'user'
    },
    {
      translation_key: 'user.invoices.subtitle',
      language_code: 'he',
      translation_value: 'צפה והורד את החשבוניות שלך',
      category: 'user',
      context: 'user'
    },

    // Status labels
    {
      translation_key: 'invoices.status.paid',
      language_code: 'en',
      translation_value: 'Paid',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.paid',
      language_code: 'he',
      translation_value: 'שולם',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.open',
      language_code: 'en',
      translation_value: 'Open',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.open',
      language_code: 'he',
      translation_value: 'פתוח',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.draft',
      language_code: 'en',
      translation_value: 'Draft',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.draft',
      language_code: 'he',
      translation_value: 'טיוטה',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.void',
      language_code: 'en',
      translation_value: 'Void',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.void',
      language_code: 'he',
      translation_value: 'בוטל',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.overdue',
      language_code: 'en',
      translation_value: 'Overdue',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.overdue',
      language_code: 'he',
      translation_value: 'באיחור',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.uncollectible',
      language_code: 'en',
      translation_value: 'Uncollectible',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.status.uncollectible',
      language_code: 'he',
      translation_value: 'לא ניתן לגבייה',
      category: 'invoice',
      context: 'user'
    },

    // Actions
    {
      translation_key: 'invoices.actions.view',
      language_code: 'en',
      translation_value: 'View',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.actions.view',
      language_code: 'he',
      translation_value: 'צפייה',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.actions.download',
      language_code: 'en',
      translation_value: 'Download PDF',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.actions.download',
      language_code: 'he',
      translation_value: 'הורד PDF',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.actions.pay_now',
      language_code: 'en',
      translation_value: 'Pay Now',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.actions.pay_now',
      language_code: 'he',
      translation_value: 'שלם עכשיו',
      category: 'invoice',
      context: 'user'
    },

    // Fields
    {
      translation_key: 'invoices.invoice_number',
      language_code: 'en',
      translation_value: 'Invoice Number',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.invoice_number',
      language_code: 'he',
      translation_value: 'מספר חשבונית',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.invoice_date',
      language_code: 'en',
      translation_value: 'Invoice Date',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.invoice_date',
      language_code: 'he',
      translation_value: 'תאריך חשבונית',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.due_date',
      language_code: 'en',
      translation_value: 'Due Date',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.due_date',
      language_code: 'he',
      translation_value: 'תאריך פירעון',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.paid_on',
      language_code: 'en',
      translation_value: 'Paid on',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.paid_on',
      language_code: 'he',
      translation_value: 'שולם בתאריך',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount',
      language_code: 'en',
      translation_value: 'Amount',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount',
      language_code: 'he',
      translation_value: 'סכום',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount_paid',
      language_code: 'en',
      translation_value: 'Amount Paid',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount_paid',
      language_code: 'he',
      translation_value: 'סכום ששולם',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount_due',
      language_code: 'en',
      translation_value: 'Amount Due',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.amount_due',
      language_code: 'he',
      translation_value: 'סכום לתשלום',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.description',
      language_code: 'en',
      translation_value: 'Description',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.description',
      language_code: 'he',
      translation_value: 'תיאור',
      category: 'invoice',
      context: 'user'
    },

    // Empty state
    {
      translation_key: 'invoices.empty.title',
      language_code: 'en',
      translation_value: 'No invoices yet',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.empty.title',
      language_code: 'he',
      translation_value: 'אין חשבוניות עדיין',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.empty.subtitle',
      language_code: 'en',
      translation_value: 'Your invoices will appear here',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.empty.subtitle',
      language_code: 'he',
      translation_value: 'החשבוניות שלך יופיעו כאן',
      category: 'invoice',
      context: 'user'
    },

    // Filters
    {
      translation_key: 'invoices.filter.all',
      language_code: 'en',
      translation_value: 'All Invoices',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.all',
      language_code: 'he',
      translation_value: 'כל החשבוניות',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.paid',
      language_code: 'en',
      translation_value: 'Paid',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.paid',
      language_code: 'he',
      translation_value: 'שולמו',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.unpaid',
      language_code: 'en',
      translation_value: 'Unpaid',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.unpaid',
      language_code: 'he',
      translation_value: 'לא שולמו',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.overdue',
      language_code: 'en',
      translation_value: 'Overdue',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.filter.overdue',
      language_code: 'he',
      translation_value: 'באיחור',
      category: 'invoice',
      context: 'user'
    },

    // Errors
    {
      translation_key: 'invoices.error_loading',
      language_code: 'en',
      translation_value: 'Failed to load invoices',
      category: 'invoice',
      context: 'user'
    },
    {
      translation_key: 'invoices.error_loading',
      language_code: 'he',
      translation_value: 'טעינת החשבוניות נכשלה',
      category: 'invoice',
      context: 'user'
    },

    // Navigation
    {
      translation_key: 'nav.invoices',
      language_code: 'en',
      translation_value: 'Invoices',
      category: 'navigation',
      context: 'user'
    },
    {
      translation_key: 'nav.invoices',
      language_code: 'he',
      translation_value: 'חשבוניות',
      category: 'navigation',
      context: 'user'
    },

    // Admin translations
    {
      translation_key: 'admin.invoices.title',
      language_code: 'en',
      translation_value: 'Invoice Management',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.invoices.title',
      language_code: 'he',
      translation_value: 'ניהול חשבוניות',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.invoices.subtitle',
      language_code: 'en',
      translation_value: 'Manage all tenant invoices',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.invoices.subtitle',
      language_code: 'he',
      translation_value: 'נהל את כל החשבוניות של הארגון',
      category: 'admin',
      context: 'admin'
    },
  ];

  const keys = [
    'user.invoices.title',
    'user.invoices.subtitle',
    'invoices.status.paid',
    'invoices.status.open',
    'invoices.status.draft',
    'invoices.status.void',
    'invoices.status.overdue',
    'invoices.status.uncollectible',
    'invoices.actions.view',
    'invoices.actions.download',
    'invoices.actions.pay_now',
    'invoices.invoice_number',
    'invoices.invoice_date',
    'invoices.due_date',
    'invoices.paid_on',
    'invoices.amount',
    'invoices.amount_paid',
    'invoices.amount_due',
    'invoices.description',
    'invoices.empty.title',
    'invoices.empty.subtitle',
    'invoices.filter.all',
    'invoices.filter.paid',
    'invoices.filter.unpaid',
    'invoices.filter.overdue',
    'invoices.error_loading',
    'nav.invoices',
    'admin.invoices.title',
    'admin.invoices.subtitle',
  ];

  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', keys);

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);

  const existingKeys = new Set(
    existing?.map(t => `${t.translation_key}:${t.language_code}`) || []
  );

  const newTranslations = translations.filter(
    t => !existingKeys.has(`${t.translation_key}:${t.language_code}`)
  );

  if (newTranslations.length === 0) {
    console.log('\n✅ All translations already exist!');
    return;
  }

  console.log(`\nAdding ${newTranslations.length} new translations...`);
  newTranslations.forEach(t => {
    console.log(`  - ${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ Invoice translations added successfully!');
}

addTranslations();
