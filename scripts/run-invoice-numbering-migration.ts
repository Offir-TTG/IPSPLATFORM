import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log('📝 Reading SQL migration file...');
    const sqlFilePath = path.join(
      process.cwd(),
      'supabase',
      'SQL Scripts',
      '20251224_add_invoice_numbering.sql'
    );

    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🚀 Running invoice numbering migration...');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying alternative method...');

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await (supabase as any).rpc('exec', {
          query: statement + ';',
        });

        if (stmtError) {
          console.error('❌ Error executing statement:', stmtError);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }

      console.log('\n⚠️  Please run the SQL migration manually using your Supabase dashboard SQL editor.');
      console.log('📁 File location: supabase/SQL Scripts/20251224_add_invoice_numbering.sql\n');
      return;
    }

    console.log('✅ Invoice numbering migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Added invoice_number column to enrollments table');
    console.log('  - Created invoice_settings table for configuration');
    console.log('  - Created generate_invoice_number() function');
    console.log('  - Created auto-generation trigger for new enrollments');
    console.log('  - Backfilled invoice numbers for existing enrollments');
    console.log('\n🎯 Invoice Number Format:');
    console.log('  Default: INV-2025-000001, INV-2025-000002, etc.');
    console.log('  Customizable via invoice_settings table\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);

    console.log('\n⚠️  Please run the SQL migration manually:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents from: supabase/SQL Scripts/20251224_add_invoice_numbering.sql');
    console.log('3. Execute the SQL\n');

    process.exit(1);
  }
}

runMigration();
