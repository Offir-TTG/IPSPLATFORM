/**
 * Check translations table schema
 * Run: npx ts-node scripts/check-translations-table-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  try {
    console.log('🔍 Checking translations table schema...\n');

    // Try to get a single row to see the structure
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No data in translations table');
      return;
    }

    console.log('✅ Sample row:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n📋 Columns:', Object.keys(data[0]).join(', '));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
