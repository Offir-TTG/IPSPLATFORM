const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const policies = `
-- Allow authenticated users to insert into public bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to public bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Allow public reads from public bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Allow authenticated users to update
CREATE POLICY IF NOT EXISTS "Allow authenticated updates to public bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public');

-- Allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from public bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public');
`;

async function addPolicies() {
  try {
    console.log('Adding storage policies...\n');
    console.log('Please run this SQL in your Supabase SQL Editor:\n');
    console.log(policies);
    console.log('\n---\n');
    console.log('Or go to: Storage > Policies > New Policy');
  } catch (err) {
    console.error('Error:', err);
  }
}

addPolicies();
