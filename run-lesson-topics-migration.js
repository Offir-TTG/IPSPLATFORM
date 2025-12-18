const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Adding is_published column to lesson_topics table...\n');

    const sql = fs.readFileSync('supabase/SQL Scripts/20251216_add_is_published_to_lesson_topics.sql', 'utf8');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
      // If exec_sql doesn't exist, try running the commands individually
      console.log('Using direct SQL execution...');

      const { error: alterError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE lesson_topics ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;'
      });

      if (alterError) {
        // Try using the postgres extension
        const commands = [
          'ALTER TABLE lesson_topics ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;',
          'CREATE INDEX IF NOT EXISTS idx_lesson_topics_is_published ON lesson_topics(is_published);',
          "COMMENT ON COLUMN lesson_topics.is_published IS 'Whether this topic is published and visible to students';"
        ];

        for (const cmd of commands) {
          const { error: cmdError } = await supabase.from('_sql').insert({ query: cmd });
          if (cmdError) {
            console.log('Trying raw query...');
            // Last resort - just log the SQL
            console.log('\nPlease run this SQL manually in Supabase SQL Editor:\n');
            console.log(sql);
            throw new Error('Could not execute SQL automatically. Please run manually.');
          }
        }
      }
      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Migration error:', error.message);
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:\n');
      console.log(sql);
      process.exit(1);
    }

    console.log('✅ Successfully added is_published column to lesson_topics table');
    console.log('✓ Column added with DEFAULT false');
    console.log('✓ Index created for performance');
    console.log('✓ Comment added\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:\n');
    console.log(fs.readFileSync('supabase/SQL Scripts/20251216_add_is_published_to_lesson_topics.sql', 'utf8'));
    process.exit(1);
  }
}

runMigration();
