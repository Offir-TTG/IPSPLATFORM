/**
 * Script to check the lessons table schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to load from .env.local if not already set
if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
      }
    });
  } catch (err) {
    console.error('Could not read .env.local file:', err.message);
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking lessons table schema...\n');

    // Get a sample lesson to see what columns exist
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!lessons || lessons.length === 0) {
      console.log('⚠️  No lessons found');
      return;
    }

    const lesson = lessons[0];
    console.log('📋 Lessons table columns:');
    console.log('═══════════════════════════════════════════════════════════');
    Object.keys(lesson).sort().forEach(key => {
      const value = lesson[key];
      const type = typeof value;
      const preview = value === null ? 'NULL' :
                     type === 'string' && value.length > 50 ? value.substring(0, 50) + '...' :
                     JSON.stringify(value);
      console.log(`  ${key.padEnd(30)} ${type.padEnd(10)} ${preview}`);
    });
    console.log('');
    console.log('🔍 Looking for time-related columns:');
    console.log('═══════════════════════════════════════════════════════════');
    const timeColumns = Object.keys(lesson).filter(k =>
      k.includes('time') || k.includes('date') || k.includes('duration')
    );
    if (timeColumns.length > 0) {
      timeColumns.forEach(col => {
        console.log(`  ✓ ${col}: ${lesson[col]}`);
      });
    } else {
      console.log('  ⚠️  No time-related columns found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the check
checkSchema();
