const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xbxddqbykyzjdcjtogbm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhieGRkcWJ5a3l6amRjanRvZ2JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEwNzE2NywiZXhwIjoyMDQ1NjgzMTY3fQ.1Z3aAL4fwqfO6T-yx_U7hLOVnhLHfvxXqUPTJpvpF0s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Delete existing deposit translation if any
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .is('tenant_id', null)
      .in('translation_key', [
        'admin.enrollments.paymentPlan.deposit'
      ]);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting old translations:', deleteError);
    }

    // Insert new deposit translations
    const { error: insertError } = await supabase
      .from('translations')
      .insert([
        {
          translation_key: 'admin.enrollments.paymentPlan.deposit',
          language_code: 'en',
          translation_value: 'Deposit + {count} Installments',
          context: 'admin',
          tenant_id: null
        },
        {
          translation_key: 'admin.enrollments.paymentPlan.deposit',
          language_code: 'he',
          translation_value: 'מקדמה + {count} תשלומים',
          context: 'admin',
          tenant_id: null
        }
      ]);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('✓ Deposit payment plan translations added successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
