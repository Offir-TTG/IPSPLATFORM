/**
 * Test translation API endpoint directly
 * Run: npx ts-node scripts/test-translation-api.ts
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testTranslationAPI() {
  try {
    console.log('🔍 Testing Translation API Endpoint\n');
    console.log('='.repeat(70));

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3000';

    // Test user context translations
    console.log('\n1️⃣  Testing /api/translations?lang=he&context=user');
    console.log('-'.repeat(70));

    const userResponse = await fetch(`${baseUrl}/api/translations?lang=he&context=user`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (userResponse.ok) {
      const userTranslations = await userResponse.json();

      console.log(`✅ API returned ${Object.keys(userTranslations).length} translations`);
      console.log('\nSearching for refund keys:');

      const refundKeys = [
        'user.payments.statusRefunded',
        'user.payments.statusPartiallyRefunded',
        'user.payments.status.refunded',
        'user.payments.status.partially_refunded',
      ];

      refundKeys.forEach(key => {
        if (userTranslations[key]) {
          console.log(`  ✅ ${key}: "${userTranslations[key]}"`);
        } else {
          console.log(`  ❌ ${key}: NOT FOUND`);
        }
      });
    } else {
      console.log(`❌ API returned error: ${userResponse.status}`);
      const errorText = await userResponse.text();
      console.log(`   ${errorText}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testTranslationAPI();
