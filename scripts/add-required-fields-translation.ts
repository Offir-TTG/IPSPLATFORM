/**
 * Script to add common.required_fields translation
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRequiredFieldsTranslation() {
  console.log('Adding common.required_fields translation...\n');

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
      translation_key: 'common.required_fields',
      translation_value: 'Please fill in all required fields correctly',
      context: 'both',
      tenant_id: tenantId,
      category: 'common'
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
      translation_key: 'common.required_fields',
      translation_value: 'נא למלא את כל השדות הנדרשים כראוי',
      context: 'both',
      tenant_id: tenantId,
      category: 'common'
    }, {
      onConflict: 'language_code,translation_key'
    });

  if (heError) {
    console.error('Error inserting Hebrew translation:', heError);
  } else {
    console.log('✓ Hebrew translation inserted successfully');
  }

  // Insert Spanish translation (for completeness)
  const { error: esError } = await supabase
    .from('translations')
    .upsert({
      language_code: 'es',
      translation_key: 'common.required_fields',
      translation_value: 'Por favor complete todos los campos requeridos correctamente',
      context: 'both',
      tenant_id: tenantId,
      category: 'common'
    }, {
      onConflict: 'language_code,translation_key'
    });

  if (esError) {
    console.error('Error inserting Spanish translation:', esError);
  } else {
    console.log('✓ Spanish translation inserted successfully');
  }

  console.log('\n✓ Migration completed');
}

addRequiredFieldsTranslation();
