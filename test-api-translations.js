require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('Testing translation API endpoint...\n');
  console.log(`App URL: ${appUrl}\n`);

  // Test both English and Hebrew
  for (const lang of ['en', 'he']) {
    console.log(`\nTesting ${lang.toUpperCase()} - admin context:`);
    console.log('='.repeat(50));

    try {
      const url = `${appUrl}/api/translations?language=${lang}&context=admin`;
      console.log(`URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const translations = data.data;
        const totalKeys = Object.keys(translations).length;
        console.log(`✅ Success - ${totalKeys} translations loaded`);

        // Check for our specific keys
        const ourKeys = [
          'lms.lesson.meeting_platform_label',
          'lms.lesson.platform_daily',
          'lms.lesson.daily_room_name_label',
        ];

        console.log('\nOur new translations:');
        ourKeys.forEach(key => {
          const value = translations[key];
          if (value) {
            console.log(`  ✅ ${key}: ${value}`);
          } else {
            console.log(`  ❌ ${key}: MISSING`);
          }
        });
      } else {
        console.log('❌ API returned error:', data);
      }
    } catch (error) {
      console.log('❌ Fetch error:', error.message);
    }
  }
}

testAPI();
