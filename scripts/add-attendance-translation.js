const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslation() {
  try {
    // Get the default tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    const key = 'lms.courses.attendance';

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he');

    if (existingHe && existingHe.length > 0) {
      console.log('Hebrew translation already exists, updating...');

      const { error: updateError } = await supabase
        .from('translations')
        .update({
          translation_value: 'נוכחות'
        })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he');

      if (updateError) {
        console.error('Error updating Hebrew translation:', updateError);
      } else {
        console.log('✅ Hebrew translation updated successfully');
      }
    } else {
      console.log('Adding Hebrew translation...');

      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: 'נוכחות',
          language_code: 'he',
          context: 'admin'
        });

      if (insertError) {
        console.error('Error adding Hebrew translation:', insertError);
      } else {
        console.log('✅ Hebrew translation added successfully');
      }
    }

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en');

    if (existingEn && existingEn.length > 0) {
      console.log('English translation already exists, updating...');

      const { error: updateError } = await supabase
        .from('translations')
        .update({
          translation_value: 'Attendance'
        })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en');

      if (updateError) {
        console.error('Error updating English translation:', updateError);
      } else {
        console.log('✅ English translation updated successfully');
      }
    } else {
      console.log('Adding English translation...');

      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: 'Attendance',
          language_code: 'en',
          context: 'admin'
        });

      if (insertError) {
        console.error('Error adding English translation:', insertError);
      } else {
        console.log('✅ English translation added successfully');
      }
    }

    console.log('\nTranslation key: lms.courses.attendance');
    console.log('English: Attendance');
    console.log('Hebrew: נוכחות');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslation();
