import { createClient } from '@supabase/supabase-js';

// Read from .env.local file manually
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach((line: string) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmailTemplates() {
  console.log('Checking email_templates table...\n');

  // Check all templates
  const { data: allTemplates, error: allError } = await supabase
    .from('email_templates')
    .select('id, template_key, template_name, template_category, tenant_id, is_active')
    .order('template_category, template_name');

  if (allError) {
    console.error('Error fetching templates:', allError);
    return;
  }

  console.log(`Total templates found: ${allTemplates?.length || 0}\n`);

  if (allTemplates && allTemplates.length > 0) {
    console.log('All templates:');
    console.table(allTemplates.map(t => ({
      key: t.template_key,
      name: t.template_name,
      category: t.template_category,
      tenant: t.tenant_id || 'NULL (global)',
      active: t.is_active ? '✓' : '✗'
    })));
  }

  // Check enrollment templates specifically
  const { data: enrollmentTemplates, error: enrollError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_category', 'enrollment')
    .eq('is_active', true);

  console.log('\n--- Enrollment Templates (active only) ---');
  console.log(`Found: ${enrollmentTemplates?.length || 0}`);

  if (enrollmentTemplates && enrollmentTemplates.length > 0) {
    console.table(enrollmentTemplates.map(t => ({
      key: t.template_key,
      name: t.template_name,
      tenant: t.tenant_id || 'NULL (global)',
      active: t.is_active ? '✓' : '✗'
    })));
  } else {
    console.log('❌ No active enrollment templates found!');
    console.log('\nYou need to run: npx tsx scripts/seed-email-templates.ts');
  }
}

checkEmailTemplates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
