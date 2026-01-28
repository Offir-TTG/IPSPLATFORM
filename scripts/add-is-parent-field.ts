import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addIsParentField() {
  console.log('🔧 Adding is_parent field to enrollments table\n');
  console.log('='.repeat(60));

  try {
    // Add is_parent column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE enrollments
        ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_enrollments_is_parent
        ON enrollments(is_parent);

        COMMENT ON COLUMN enrollments.is_parent IS
        'Indicates if this is a parent enrollment (true) or student enrollment (false). Parent enrollments do not grant dashboard access. Dashboard access is granted when user has at least one non-parent enrollment.';
      `
    });

    if (alterError) {
      console.error('❌ Error adding is_parent field:', alterError);
      process.exit(1);
    }

    console.log('✅ Successfully added is_parent field to enrollments table');
    console.log('\n📝 Field details:');
    console.log('   - Column: is_parent');
    console.log('   - Type: BOOLEAN');
    console.log('   - Default: FALSE');
    console.log('   - Index: idx_enrollments_is_parent');
    console.log('\n💡 Next steps:');
    console.log('   1. Update admin enrollment creation form to include parent checkbox');
    console.log('   2. Update wizard logic to handle parent enrollments');
    console.log('   3. Update dashboard access logic to check non-parent enrollments');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addIsParentField().then(() => process.exit(0));
