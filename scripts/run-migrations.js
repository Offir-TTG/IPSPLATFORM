// Script to run migrations directly in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251116_add_program_image.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and run each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Running migration: 20251116_add_program_image.sql');

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');

      // Use raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        console.error('Error executing statement:', error);
        // Continue with other statements even if one fails
      } else {
        console.log('✓ Statement executed successfully');
      }
    }

    console.log('\nMigration completed!');
    console.log('\nPlease verify in Supabase Dashboard:');
    console.log('1. Check if "image_url" column exists in programs table');
    console.log('2. Check if "program-images" storage bucket exists');
    console.log('3. Verify RLS policies are set up correctly');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();