import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCacheAndVerify() {
  console.log('🧹 Clearing translation caches...\n');

  try {
    // 1. Clear server-side API cache
    console.log('1️⃣ Clearing server-side API cache...');
    const response = await fetch('http://localhost:3000/api/translations', {
      method: 'POST',
    });

    if (response.ok) {
      console.log('   ✅ Server cache cleared');
    } else {
      console.log('   ⚠️  Server might not be running - cache will clear on next request');
    }

    // 2. Instructions for clearing browser cache
    console.log('\n2️⃣ Browser localStorage cache:');
    console.log('   📝 To clear browser cache, open DevTools Console and run:');
    console.log('   ```');
    console.log('   localStorage.removeItem("translations_admin_he")');
    console.log('   localStorage.removeItem("translations_admin_en")');
    console.log('   localStorage.removeItem("translations_user_he")');
    console.log('   localStorage.removeItem("translations_user_en")');
    console.log('   location.reload()');
    console.log('   ```');

    // 3. Verify translations in database
    console.log('\n3️⃣ Verifying translations in database...');

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single();

    const tenantId = tenant?.id;

    const { data: hebrewTranslations, error } = await supabase
      .from('translations')
      .select('translation_key, translation_value')
      .eq('language_code', 'he')
      .in('category', ['admin', 'both'])
      .like('translation_key', 'admin.enrollments.create%')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

    if (error) {
      console.log('   ❌ Error fetching translations:', error.message);
    } else {
      console.log(`   ✅ Found ${hebrewTranslations?.length || 0} Hebrew enrollment dialog translations in DB`);

      if (hebrewTranslations && hebrewTranslations.length > 0) {
        console.log('\n   Sample translations:');
        hebrewTranslations.slice(0, 5).forEach(t => {
          console.log(`   - ${t.translation_key}: ${t.translation_value}`);
        });
      }
    }

    // 4. Test API endpoint directly
    console.log('\n4️⃣ Testing API endpoint...');
    const apiUrl = `http://localhost:3000/api/translations?language=he&context=admin`;

    try {
      const apiResponse = await fetch(apiUrl);
      const apiData = await apiResponse.json();

      if (apiData.success && apiData.data) {
        const enrollmentKeys = Object.keys(apiData.data).filter(k => k.startsWith('admin.enrollments.create'));
        console.log(`   ✅ API returns ${enrollmentKeys.length} enrollment dialog translations`);

        // Check specific keys
        const keyChecks = [
          'admin.enrollments.createEnrollment',
          'admin.enrollments.create.title',
          'admin.enrollments.create.user',
          'admin.enrollments.create.submit'
        ];

        console.log('\n   Key checks:');
        keyChecks.forEach(key => {
          const value = apiData.data[key];
          if (value) {
            console.log(`   ✅ ${key}: ${value}`);
          } else {
            console.log(`   ❌ ${key}: MISSING`);
          }
        });
      } else {
        console.log('   ⚠️  API endpoint not responding correctly');
      }
    } catch (apiError: any) {
      console.log(`   ⚠️  Could not test API: ${apiError.message}`);
      console.log('   Make sure the dev server is running: npm run dev');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Open browser DevTools Console (F12)');
    console.log('3. Run the localStorage.clear() commands above');
    console.log('4. Refresh the page (F5)');
    console.log('5. Navigate to /admin/enrollments');
    console.log('6. Switch to Hebrew language');
    console.log('7. Click "Create Enrollment" button');
    console.log('8. All text should now be in Hebrew!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCacheAndVerify();
