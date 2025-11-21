/**
 * Script to fix the dark_primary_foreground value in theme_configs table
 * This changes button text color from dark blue to white in dark mode
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

async function fixThemeForeground() {
  try {
    console.log('🔍 Fetching active theme configuration...');

    // Get the active theme - using the known ID from user's config
    const themeId = '35098d76-21a2-46c9-bd1a-d7297206ace4';

    const { data: activeTheme, error: fetchError } = await supabase
      .from('theme_configs')
      .select('*')
      .eq('id', themeId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching theme:', fetchError.message);
      return;
    }

    if (!activeTheme) {
      console.log('⚠️  Theme not found in database');
      return;
    }

    console.log('📋 Current theme:', activeTheme.theme_name);
    console.log('📋 Current dark_primary_foreground:', activeTheme.dark_primary_foreground);
    console.log('📋 Current dark_sidebar_active_foreground:', activeTheme.dark_sidebar_active_foreground);

    // Check if it already has the correct value
    if (activeTheme.dark_primary_foreground === '210 40% 98%' &&
        activeTheme.dark_sidebar_active_foreground === '210 40% 98%') {
      console.log('✅ Theme already has correct foreground values!');
      return;
    }

    console.log('🔧 Updating foreground colors to "210 40% 98%" (white text)...');

    // Update the theme - fix both dark_primary_foreground and dark_sidebar_active_foreground
    const { data: updatedTheme, error: updateError } = await supabase
      .from('theme_configs')
      .update({
        dark_primary_foreground: '210 40% 98%',
        dark_sidebar_active_foreground: '210 40% 98%',
        updated_at: new Date().toISOString()
      })
      .eq('id', themeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating theme:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated theme!');
    console.log('📋 New dark_primary_foreground:', updatedTheme.dark_primary_foreground);
    console.log('📋 New dark_sidebar_active_foreground:', updatedTheme.dark_sidebar_active_foreground);
    console.log('');
    console.log('🎉 Theme fix complete!');
    console.log('💡 Note: Users need to refresh their browser to see the changes');
    console.log('💡 The changes affect:');
    console.log('   - Button text color in dark mode (now white)');
    console.log('   - Active sidebar item text in dark mode (now white)');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixThemeForeground();
