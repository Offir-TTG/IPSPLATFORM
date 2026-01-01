const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }

    console.log('\nStorage Buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`);
    });

    // Check if 'public' bucket exists
    const publicBucket = buckets.find(b => b.name === 'public');
    if (!publicBucket) {
      console.log('\n⚠️  "public" bucket does not exist. Creating it...');
      
      const { data, error: createError } = await supabase.storage.createBucket('public', {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('✅ "public" bucket created successfully');
      }
    } else {
      console.log('\n✅ "public" bucket exists');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkBuckets();
