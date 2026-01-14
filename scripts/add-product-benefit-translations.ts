import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TENANT_ID = '70d86807-7e7c-49cd-8601-98235444e2ac';

const translations = [
  // Completion Benefit field
  {
    key: 'products.completion_benefit',
    category: 'admin',
    en: 'Completion Benefit',
    he: 'הטבה בסיום'
  },
  {
    key: 'products.completion_benefit_placeholder',
    category: 'admin',
    en: 'e.g., Certificate, Digital Badge',
    he: 'לדוגמה: תעודה, תג דיגיטלי'
  },
  {
    key: 'products.completion_benefit_desc',
    category: 'admin',
    en: 'What users receive upon completing this product',
    he: 'מה המשתמשים מקבלים בסיום המוצר'
  },

  // Completion Description field
  {
    key: 'products.completion_description',
    category: 'admin',
    en: 'Completion Description',
    he: 'תיאור סיום'
  },
  {
    key: 'products.completion_description_placeholder',
    category: 'admin',
    en: 'e.g., Upon completion, After all modules',
    he: 'לדוגמה: עם סיום התוכנית, לאחר כל המודולים'
  },
  {
    key: 'products.completion_description_desc',
    category: 'admin',
    en: 'Description of when/how users receive the benefit',
    he: 'תיאור של מתי ואיך המשתמשים מקבלים את ההטבה'
  },

  // Access Duration field
  {
    key: 'products.access_duration',
    category: 'admin',
    en: 'Access Duration',
    he: 'משך גישה'
  },
  {
    key: 'products.access_duration_placeholder',
    category: 'admin',
    en: 'e.g., Lifetime access, 1 year',
    he: 'לדוגמה: גישה לכל החיים, שנה אחת'
  },
  {
    key: 'products.access_duration_desc',
    category: 'admin',
    en: 'How long users have access to this product',
    he: 'כמה זמן למשתמשים יש גישה למוצר'
  },

  // Access Description field
  {
    key: 'products.access_description',
    category: 'admin',
    en: 'Access Description',
    he: 'תיאור גישה'
  },
  {
    key: 'products.access_description_placeholder',
    category: 'admin',
    en: 'e.g., Learn at your own pace, Full access to all materials',
    he: 'לדוגמה: למד בקצב שלך, גישה מלאה לכל החומרים'
  },
  {
    key: 'products.access_description_desc',
    category: 'admin',
    en: 'Description of the access terms and conditions',
    he: 'תיאור תנאי הגישה'
  }
];

async function addTranslations() {
  console.log('Starting to add product benefit/access translations...\n');
  console.log(`Using tenant ID: ${TENANT_ID}\n`);

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const trans of translations) {
    console.log(`Processing: ${trans.key}`);

    // Check English
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', TENANT_ID)
      .eq('translation_key', trans.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      if (existingEn.translation_value !== trans.en) {
        await supabase
          .from('translations')
          .update({ translation_value: trans.en, updated_at: new Date().toISOString() })
          .eq('id', existingEn.id);
        console.log(`  ✓ Updated EN: "${trans.en}"`);
        updated++;
      } else {
        console.log(`  - Skipped EN (same value)`);
        skipped++;
      }
    } else {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: TENANT_ID,
          language_code: 'en',
          translation_key: trans.key,
          translation_value: trans.en,
          category: trans.category,
          context: 'admin',
        });

      if (error) {
        console.error(`  ✗ Failed to add EN:`, error.message);
      } else {
        console.log(`  ✓ Added EN: "${trans.en}"`);
        added++;
      }
    }

    // Check Hebrew
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', TENANT_ID)
      .eq('translation_key', trans.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      if (existingHe.translation_value !== trans.he) {
        await supabase
          .from('translations')
          .update({ translation_value: trans.he, updated_at: new Date().toISOString() })
          .eq('id', existingHe.id);
        console.log(`  ✓ Updated HE: "${trans.he}"`);
        updated++;
      } else {
        console.log(`  - Skipped HE (same value)`);
        skipped++;
      }
    } else {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: TENANT_ID,
          language_code: 'he',
          translation_key: trans.key,
          translation_value: trans.he,
          category: trans.category,
          context: 'admin',
        });

      if (error) {
        console.error(`  ✗ Failed to add HE:`, error.message);
      } else {
        console.log(`  ✓ Added HE: "${trans.he}"`);
        added++;
      }
    }

    console.log('');
  }

  console.log('\nSummary:');
  console.log(`  Added: ${added}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('\n✅ Done!');
}

addTranslations().catch(console.error);
