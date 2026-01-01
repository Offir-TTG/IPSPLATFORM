const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBucketRLS() {
  try {
    console.log('Checking public bucket...');
    
    // Get bucket info
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const publicBucket = buckets.find(b => b.name === 'public');
    console.log('Public bucket:', publicBucket);
    
    // Update bucket to be public (no RLS)
    const { data, error } = await supabase.storage.updateBucket('public', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    });
    
    if (error) {
      console.error('Error updating bucket:', error);
    } else {
      console.log('✅ Bucket updated successfully:', data);
    }
    
    // Verify
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    const updatedPublic = updatedBuckets.find(b => b.name === 'public');
    console.log('\nUpdated bucket info:', updatedPublic);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fixBucketRLS();
