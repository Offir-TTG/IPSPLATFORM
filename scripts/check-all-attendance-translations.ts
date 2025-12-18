import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    // Get all lms.attendance.* translations
    const { data: translations } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'lms.attendance.%')
      .order('translation_key, language_code');

    console.log('All lms.attendance.* translations:\n');

    // Group by key
    const grouped = new Map<string, { en?: string; he?: string }>();
    translations?.forEach(t => {
      if (!grouped.has(t.translation_key)) {
        grouped.set(t.translation_key, {});
      }
      const group = grouped.get(t.translation_key)!;
      if (t.language_code === 'en') group.en = t.translation_value;
      if (t.language_code === 'he') group.he = t.translation_value;
    });

    grouped.forEach((values, key) => {
      console.log(`${key}:`);
      console.log(`  EN: ${values.en || 'MISSING'}`);
      console.log(`  HE: ${values.he || 'MISSING'}`);
      console.log('');
    });

    console.log(`\nTotal unique keys: ${grouped.size}`);
    console.log(`Total entries: ${translations?.length || 0}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllTranslations();
