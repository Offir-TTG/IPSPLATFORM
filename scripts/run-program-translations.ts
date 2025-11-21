/**
 * Script to run program error translations migration
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running program error translations migration...');

  const sql = `
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- ========================================================================
    -- INSERT ENGLISH TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        ('en', 'lms.programs.error.name_required', 'Program name is required', 'admin', v_tenant_id, 'lms')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    -- ========================================================================
    -- INSERT HEBREW TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        ('he', 'lms.programs.error.name_required', 'יש להזין שם תוכנית', 'admin', v_tenant_id, 'lms')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    RAISE NOTICE 'Program error translations added successfully for English and Hebrew';

END $$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error running migration:', error);

      // Try direct insert instead
      console.log('Attempting direct insert method...');

      // Get tenant_id first
      const { data: translations } = await supabase
        .from('translations')
        .select('tenant_id')
        .limit(1)
        .single();

      if (!translations?.tenant_id) {
        console.error('No tenant_id found in translations table');
        return;
      }

      const tenantId = translations.tenant_id;

      // Insert English translation
      const { error: enError } = await supabase
        .from('translations')
        .upsert({
          language_code: 'en',
          translation_key: 'lms.programs.error.name_required',
          translation_value: 'Program name is required',
          context: 'admin',
          tenant_id: tenantId,
          category: 'lms'
        }, {
          onConflict: 'language_code,translation_key'
        });

      if (enError) {
        console.error('Error inserting English translation:', enError);
      } else {
        console.log('✓ English translation inserted successfully');
      }

      // Insert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .upsert({
          language_code: 'he',
          translation_key: 'lms.programs.error.name_required',
          translation_value: 'יש להזין שם תוכנית',
          context: 'admin',
          tenant_id: tenantId,
          category: 'lms'
        }, {
          onConflict: 'language_code,translation_key'
        });

      if (heError) {
        console.error('Error inserting Hebrew translation:', heError);
      } else {
        console.log('✓ Hebrew translation inserted successfully');
      }

      console.log('✓ Migration completed via direct insert method');
    } else {
      console.log('✓ Migration completed successfully');
      console.log('Result:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runMigration();
