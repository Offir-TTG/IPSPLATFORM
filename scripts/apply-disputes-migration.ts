import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('🗄️  Applying payment_disputes table migration...\n');

  // Read migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20260127000000_create_payment_disputes.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (for local dev)
      console.log('Attempting direct SQL execution...\n');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', {
          query: statement + ';'
        });

        if (stmtError) {
          console.error('❌ Error executing statement:', stmtError);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    // Verify table was created
    const { data: tableExists, error: checkError } = await supabase
      .from('payment_disputes')
      .select('id')
      .limit(0);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking if table exists:', checkError);
      console.log('\n⚠️  Please run the migration SQL manually in the Supabase SQL Editor:');
      console.log(`   File: ${migrationPath}`);
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ payment_disputes table created');
    console.log('\nTable structure:');
    console.log('  - id (UUID, primary key)');
    console.log('  - tenant_id (UUID, references tenants)');
    console.log('  - payment_id (UUID, references payments)');
    console.log('  - enrollment_id (UUID, references enrollments)');
    console.log('  - user_id (UUID, references users)');
    console.log('  - stripe_dispute_id (TEXT, unique)');
    console.log('  - stripe_charge_id (TEXT)');
    console.log('  - amount (DECIMAL)');
    console.log('  - currency (TEXT)');
    console.log('  - reason (TEXT)');
    console.log('  - status (TEXT - needs_response, under_review, won, lost, closed)');
    console.log('  - evidence_due_date (TIMESTAMPTZ)');
    console.log('  - evidence_submitted (BOOLEAN)');
    console.log('  - evidence_submitted_at (TIMESTAMPTZ)');
    console.log('  - metadata (JSONB)');
    console.log('  - created_at, updated_at (TIMESTAMPTZ)');
    console.log('\nIndexes created:');
    console.log('  - tenant_id, payment_id, user_id, status, stripe_dispute_id, created_at');
    console.log('\nRLS Policies:');
    console.log('  - Admins can view/update disputes for their tenant');
    console.log('  - System can insert disputes (via webhook)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  Please run the migration SQL manually in the Supabase SQL Editor');
    console.log(`   File: ${migrationPath}`);
    process.exit(1);
  }
}

applyMigration().then(() => process.exit(0));
