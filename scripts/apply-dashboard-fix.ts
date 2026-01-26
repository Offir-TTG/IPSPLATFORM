import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260120_fix_user_dashboard_complete.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration SQL directly...');

    // Execute the SQL directly by splitting into statements
    // First drop the function
    const dropResult = await supabase.rpc('exec', {
      sql: 'DROP FUNCTION IF EXISTS public.get_user_dashboard_v3(UUID) CASCADE;'
    });

    if (dropResult.error) {
      console.error('Error dropping function:', dropResult.error);
    } else {
      console.log('Old function dropped successfully');
    }

    // Now create the new function
    // We need to execute this via a raw query since it's a complex function
    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('Migration error:', error);
      // Try to execute it as a single statement
      console.log('Trying alternative execution method...');
      console.log('Please run the migration manually using Supabase SQL Editor');
      console.log('File location:', migrationPath);
      process.exit(1);
    }

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\nPlease apply the migration manually using Supabase SQL Editor');
    console.log('File: supabase/migrations/20260120_fix_user_dashboard_complete.sql');
    process.exit(1);
  }
}

applyMigration();
