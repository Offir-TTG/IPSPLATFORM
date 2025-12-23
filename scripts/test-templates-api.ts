import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPI() {
  console.log('🧪 Testing email templates API (as client would see)...\n');

  const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1).single();

  if (!tenants) {
    console.log('No tenant found');
    return;
  }

  console.log(`Tenant: ${tenants.name}\n`);

  // This mimics what the UI does
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenants.id)
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} templates:\n`);

  data?.forEach(t => {
    console.log(`[${t.template_category}] ${t.template_key}`);
    console.log(`  Name: ${t.template_name}`);
    console.log(`  Active: ${t.is_active}`);
    console.log('');
  });
}

testAPI();
