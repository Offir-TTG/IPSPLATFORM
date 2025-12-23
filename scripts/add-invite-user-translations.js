require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding invite user translations...\n');

  const translations = [
    // Invite user dialog
    {
      translation_key: 'admin.users.invite_user_description',
      language_code: 'en',
      translation_value: 'Add a new user to your organization',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.invite_user_description',
      language_code: 'he',
      translation_value: 'הוסף משתמש חדש לארגון שלך',
      category: 'admin',
      context: 'admin'
    },
    // Form fields
    {
      translation_key: 'admin.users.email',
      language_code: 'en',
      translation_value: 'Email',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.email',
      language_code: 'he',
      translation_value: 'אימייל',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.first_name',
      language_code: 'en',
      translation_value: 'First Name',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.first_name',
      language_code: 'he',
      translation_value: 'שם פרטי',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.last_name',
      language_code: 'en',
      translation_value: 'Last Name',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.last_name',
      language_code: 'he',
      translation_value: 'שם משפחה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.phone',
      language_code: 'en',
      translation_value: 'Phone',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.phone',
      language_code: 'he',
      translation_value: 'טלפון',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password',
      language_code: 'en',
      translation_value: 'Password',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password',
      language_code: 'he',
      translation_value: 'סיסמה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password_hint',
      language_code: 'en',
      translation_value: 'Minimum 8 characters',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password_hint',
      language_code: 'he',
      translation_value: 'לפחות 8 תווים',
      category: 'admin',
      context: 'admin'
    },
    // Errors
    {
      translation_key: 'admin.users.error_email_required',
      language_code: 'en',
      translation_value: 'Email is required',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_email_required',
      language_code: 'he',
      translation_value: 'אימייל נדרש',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_email_invalid',
      language_code: 'en',
      translation_value: 'Invalid email address',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_email_invalid',
      language_code: 'he',
      translation_value: 'כתובת אימייל לא תקינה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_email_exists',
      language_code: 'en',
      translation_value: 'A user with this email already exists',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_email_exists',
      language_code: 'he',
      translation_value: 'משתמש עם אימייל זה כבר קיים',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_first_name_required',
      language_code: 'en',
      translation_value: 'First name is required',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_first_name_required',
      language_code: 'he',
      translation_value: 'שם פרטי נדרש',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_last_name_required',
      language_code: 'en',
      translation_value: 'Last name is required',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_last_name_required',
      language_code: 'he',
      translation_value: 'שם משפחה נדרש',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_password_min',
      language_code: 'en',
      translation_value: 'Password must be at least 8 characters',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.error_password_min',
      language_code: 'he',
      translation_value: 'הסיסמה חייבת להיות לפחות 8 תווים',
      category: 'admin',
      context: 'admin'
    },
    // Success/Error messages
    {
      translation_key: 'admin.users.invite_success',
      language_code: 'en',
      translation_value: 'User invited successfully',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.invite_success',
      language_code: 'he',
      translation_value: 'המשתמש הוזמן בהצלחה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.invite_error',
      language_code: 'en',
      translation_value: 'Failed to invite user',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.invite_error',
      language_code: 'he',
      translation_value: 'הזמנת המשתמש נכשלה',
      category: 'admin',
      context: 'admin'
    },
    // Role labels
    {
      translation_key: 'admin.users.role',
      language_code: 'en',
      translation_value: 'Role',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role',
      language_code: 'he',
      translation_value: 'תפקיד',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_student',
      language_code: 'en',
      translation_value: 'Student',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_student',
      language_code: 'he',
      translation_value: 'תלמיד',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_instructor',
      language_code: 'en',
      translation_value: 'Instructor',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_instructor',
      language_code: 'he',
      translation_value: 'מרצה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_admin',
      language_code: 'en',
      translation_value: 'Admin',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.role_admin',
      language_code: 'he',
      translation_value: 'מנהל',
      category: 'admin',
      context: 'admin'
    },
    // Password generator
    {
      translation_key: 'admin.users.generate_password',
      language_code: 'en',
      translation_value: 'Generate',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.generate_password',
      language_code: 'he',
      translation_value: 'יצירה',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password_generated',
      language_code: 'en',
      translation_value: 'Password generated',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.password_generated',
      language_code: 'he',
      translation_value: 'סיסמה נוצרה',
      category: 'admin',
      context: 'admin'
    },
    // Language field
    {
      translation_key: 'admin.users.language',
      language_code: 'en',
      translation_value: 'Email Language',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.language',
      language_code: 'he',
      translation_value: 'שפת האימייל',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.language_help',
      language_code: 'en',
      translation_value: 'The welcome email will be sent in this language',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.language_help',
      language_code: 'he',
      translation_value: 'אימייל הברכה יישלח בשפה זו',
      category: 'admin',
      context: 'admin'
    },
    // Send email checkbox
    {
      translation_key: 'admin.users.send_welcome_email',
      language_code: 'en',
      translation_value: 'Send welcome email with login credentials',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.send_welcome_email',
      language_code: 'he',
      translation_value: 'שלח אימייל ברכה עם פרטי התחברות',
      category: 'admin',
      context: 'admin'
    },
    // User created success (without email)
    {
      translation_key: 'admin.users.user_created_success',
      language_code: 'en',
      translation_value: 'User created successfully',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.user_created_success',
      language_code: 'he',
      translation_value: 'המשתמש נוצר בהצלחה',
      category: 'admin',
      context: 'admin'
    },
    // Send email description
    {
      translation_key: 'admin.users.send_welcome_email_desc',
      language_code: 'en',
      translation_value: 'User will receive login credentials via email',
      category: 'admin',
      context: 'admin'
    },
    {
      translation_key: 'admin.users.send_welcome_email_desc',
      language_code: 'he',
      translation_value: 'המשתמש יקבל את פרטי ההתחברות באימייל',
      category: 'admin',
      context: 'admin'
    },
  ];

  const keys = [
    'admin.users.invite_user_description',
    'admin.users.email',
    'admin.users.first_name',
    'admin.users.last_name',
    'admin.users.phone',
    'admin.users.password',
    'admin.users.password_hint',
    'admin.users.error_email_required',
    'admin.users.error_email_invalid',
    'admin.users.error_email_exists',
    'admin.users.error_first_name_required',
    'admin.users.error_last_name_required',
    'admin.users.error_password_min',
    'admin.users.invite_success',
    'admin.users.invite_error',
    'admin.users.role',
    'admin.users.role_student',
    'admin.users.role_instructor',
    'admin.users.role_admin',
    'admin.users.generate_password',
    'admin.users.password_generated',
    'admin.users.language',
    'admin.users.language_help',
    'admin.users.send_welcome_email',
    'admin.users.user_created_success',
    'admin.users.send_welcome_email_desc'
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

  console.log('\n✅ Invite user translations added successfully!');
}

addTranslations();
