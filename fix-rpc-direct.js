const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const sql1 = `
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  domain TEXT,
  status TEXT,
  subscription_tier TEXT,
  max_users INTEGER,
  max_courses INTEGER,
  logo_url TEXT,
  primary_color TEXT,
  admin_email TEXT,
  default_language TEXT,
  timezone TEXT,
  currency TEXT,
  enabled_features JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.domain,
    t.status,
    t.subscription_tier,
    t.max_users,
    t.max_courses,
    t.logo_url,
    t.primary_color,
    t.admin_email,
    t.default_language,
    t.timezone,
    t.currency,
    t.enabled_features,
    t.created_at
  FROM tenants t
  WHERE t.slug = p_slug
    AND t.status = 'active';
END;
$$;
`;

async function fixRPC() {
  try {
    const { error } = await supabase.rpc('query', { query_text: sql1 });
    
    if (error) {
      console.error('Error updating function:', error);
    } else {
      console.log('✅ Function updated');
    }
    
    // Test it
    console.log('\nTesting...');
    const { data, error: testError } = await supabase
      .rpc('get_tenant_by_slug', { p_slug: 'default' })
      .single();
    
    if (testError) {
      console.error('Test error:', testError);
    } else {
      console.log('Fields returned:', Object.keys(data));
      console.log('admin_email:', data.admin_email);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

fixRPC();
