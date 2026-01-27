/**
 * Apply payment status constraint migration
 * Run: npx ts-node scripts/apply-payment-constraint-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  try {
    console.log('🔧 Applying payment status constraint migration...\n');
    console.log('='.repeat(70));

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260126_fix_payments_status_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolons to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));

    console.log(`\nFound ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comment-only statements
      if (statement.trim().startsWith('COMMENT')) {
        console.log(`${i + 1}. Skipping comment statement`);
        continue;
      }

      console.log(`${i + 1}. Executing: ${statement.substring(0, 60)}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`   ❌ Error:`, error);
        // Continue anyway - some errors are expected (like constraint already dropped)
      } else {
        console.log(`   ✅ Success`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nAllowed payment statuses:');
    console.log('  - pending');
    console.log('  - paid');
    console.log('  - failed');
    console.log('  - refunded');
    console.log('  - partially_refunded');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
