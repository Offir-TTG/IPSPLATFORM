import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTranslation() {
  console.log('Fixing session_pack translation...\n');
  console.log('Changing from: תוכנית ליווי (Mentoring Program)');
  console.log('Changing to: חבילת מפגשים (Session Pack)\n');

  // Update Hebrew translation
  const { error: heError } = await supabase
    .from('translations')
    .update({
      translation_value: 'חבילת מפגשים'
    })
    .eq('translation_key', 'product.type.session_pack')
    .eq('language_code', 'he');

  if (heError) {
    console.error('❌ Error updating Hebrew:', heError.message);
  } else {
    console.log('✓ Updated Hebrew: product.type.session_pack = חבילת מפגשים');
  }

  console.log('\n✅ Translation fixed successfully!');
}

fixTranslation().catch(console.error);
