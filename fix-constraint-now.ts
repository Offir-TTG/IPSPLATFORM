import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});

async function fixConstraint() {
  console.log('Starting constraint fix...\n');

  // Step 1: Check current constraints
  console.log('1. Checking current constraints...');
  const { data: constraints, error: checkError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'translations'::regclass
        AND contype = 'u';
      `
    } as any);

  if (!checkError) {
    console.log('Current constraints:', JSON.stringify(constraints, null, 2));
  } else {
    console.log('Could not check constraints (might need to use SQL editor)');
  }

  // Step 2: Drop old constraints using ALTER TABLE directly
  console.log('\n2. Dropping old constraints...');

  try {
    // Try to drop the first constraint
    const { error: drop1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_tenant_language_key_unique;'
    } as any);

    if (drop1) {
      console.log('Note:', drop1.message);
    } else {
      console.log('✓ Dropped translations_tenant_language_key_unique');
    }
  } catch (e: any) {
    console.log('Note: Could not drop first constraint:', e.message);
  }

  try {
    // Try to drop the second constraint
    const { error: drop2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_language_code_translation_key_key;'
    } as any);

    if (drop2) {
      console.log('Note:', drop2.message);
    } else {
      console.log('✓ Dropped translations_language_code_translation_key_key');
    }
  } catch (e: any) {
    console.log('Note: Could not drop second constraint:', e.message);
  }

  // Step 3: Create new indexes
  console.log('\n3. Creating new unique indexes...');

  try {
    const { error: idx1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_with_tenant
        ON translations (translation_key, language_code, context, tenant_id)
        WHERE tenant_id IS NOT NULL;
      `
    } as any);

    if (idx1) {
      console.log('Error creating tenant index:', idx1.message);
    } else {
      console.log('✓ Created translations_unique_with_tenant');
    }
  } catch (e: any) {
    console.log('Error creating tenant index:', e.message);
  }

  try {
    const { error: idx2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_global
        ON translations (translation_key, language_code, context)
        WHERE tenant_id IS NULL;
      `
    } as any);

    if (idx2) {
      console.log('Error creating global index:', idx2.message);
    } else {
      console.log('✓ Created translations_unique_global');
    }
  } catch (e: any) {
    console.log('Error creating global index:', e.message);
  }

  console.log('\n4. Testing upsert...');
  const testData = {
    language_code: 'he',
    translation_key: 'test.constraint.fix',
    translation_value: 'בדיקה',
    category: 'test',
    context: 'admin',
    tenant_id: '70d86807-7e7c-49cd-8601-98235444e2ac',
    updated_at: new Date().toISOString(),
  };

  const { data: testResult, error: testError } = await supabase
    .from('translations')
    .upsert(testData)
    .select()
    .single();

  if (testError) {
    console.log('✗ Test upsert failed:', testError.message);
    console.log('\nYou need to run the SQL manually in Supabase SQL Editor:');
    console.log('See: supabase/SQL Scripts/20251212_fix_translations_unique_constraint.sql');
  } else {
    console.log('✓ Test upsert successful!');
    console.log('Constraint fix is complete and working!');
  }
}

fixConstraint().catch(console.error);
