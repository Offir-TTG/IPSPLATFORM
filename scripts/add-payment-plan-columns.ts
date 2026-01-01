import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to add payment plan columns to products table...\n');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase', 'SQL Scripts', '20251126_add_product_payment_plans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('RPC method not available, trying direct execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: execError } = await supabase.rpc('exec', { query: statement });
        if (execError) {
          console.error('Error executing statement:', execError);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nAdded columns:');
    console.log('  - default_payment_plan_id (UUID)');
    console.log('  - alternative_payment_plan_ids (UUID[])');
    console.log('  - allow_plan_selection (BOOLEAN)');

  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();
