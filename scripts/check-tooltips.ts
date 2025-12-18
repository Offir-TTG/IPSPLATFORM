import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTooltips() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    const { data } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'lms.attendance.tooltip.%')
      .order('translation_key, language_code');

    console.log('Tooltip translations in database:\n');
    data?.forEach(t => {
      console.log(`  ${t.translation_key} [${t.language_code}]: ${t.translation_value}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTooltips();
