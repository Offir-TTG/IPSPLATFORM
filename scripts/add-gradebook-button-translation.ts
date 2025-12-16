import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGradebookButtonTranslation() {
  try {
    console.log('🚀 Adding Gradebook button translation...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translation to avoid duplicates
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('translation_key', 'lms.courses.gradebook');

    if (deleteError) {
      console.error('Warning: Error deleting old translation:', deleteError.message);
    }

    // Insert translation
    const { error: insertError } = await supabase
      .from('translations')
      .insert([
        {
          tenant_id: tenantId,
          language_code: 'en',
          translation_key: 'lms.courses.gradebook',
          translation_value: 'Gradebook',
          context: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          tenant_id: tenantId,
          language_code: 'he',
          translation_key: 'lms.courses.gradebook',
          translation_value: 'ספר ציונים',
          context: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      throw new Error(`Failed to insert translation: ${insertError.message}`);
    }

    console.log('✅ Added Gradebook button translation');
    console.log('Total translations added: 1 key × 2 languages = 2 entries\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addGradebookButtonTranslation();
