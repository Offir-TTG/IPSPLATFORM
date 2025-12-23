import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();

    if (!tenants) {
      console.error('No tenant found');
      return;
    }

    const { data } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenants.id)
      .ilike('translation_key', 'lms.attendance.status.%')
      .order('translation_key, language_code');

    console.log('Status button translations:\n');

    const grouped = new Map<string, { en?: string; he?: string }>();
    data?.forEach(t => {
      if (!grouped.has(t.translation_key)) {
        grouped.set(t.translation_key, {});
      }
      const entry = grouped.get(t.translation_key)!;
      if (t.language_code === 'en') entry.en = t.translation_value;
      if (t.language_code === 'he') entry.he = t.translation_value;
    });

    grouped.forEach((value, key) => {
      console.log(`${key}:`);
      console.log(`  EN: ${value.en || 'MISSING'}`);
      console.log(`  HE: ${value.he || 'MISSING'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStatus();
