import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    console.log('Starting translations constraint fix...');

    // Step 1: Drop old constraint
    const dropOld1 = `
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'translations_tenant_language_key_unique'
          ) THEN
              ALTER TABLE translations DROP CONSTRAINT translations_tenant_language_key_unique;
              RAISE NOTICE 'Dropped old constraint: translations_tenant_language_key_unique';
          END IF;
      END $$;
    `;

    const { error: error1 } = await supabase.rpc('exec_sql' as any, { sql: dropOld1 });
    if (error1) {
      console.log('Note: Could not drop old constraint (may not exist):', error1.message);
    }

    // Step 2: Drop another old constraint
    const dropOld2 = `
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'translations_language_code_translation_key_key'
          ) THEN
              ALTER TABLE translations DROP CONSTRAINT translations_language_code_translation_key_key;
              RAISE NOTICE 'Dropped old constraint: translations_language_code_translation_key_key';
          END IF;
      END $$;
    `;

    const { error: error2 } = await supabase.rpc('exec_sql' as any, { sql: dropOld2 });
    if (error2) {
      console.log('Note: Could not drop old constraint (may not exist):', error2.message);
    }

    // Step 3: Create tenant-specific unique index
    const createIndex1 = `
      CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_with_tenant
      ON translations (translation_key, language_code, context, tenant_id)
      WHERE tenant_id IS NOT NULL;
    `;

    const { error: error3 } = await supabase.rpc('exec_sql' as any, { sql: createIndex1 });
    if (error3) {
      console.error('Error creating tenant index:', error3);
      return NextResponse.json(
        { success: false, error: `Failed to create tenant index: ${error3.message}` },
        { status: 500 }
      );
    }

    // Step 4: Create global unique index
    const createIndex2 = `
      CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_global
      ON translations (translation_key, language_code, context)
      WHERE tenant_id IS NULL;
    `;

    const { error: error4 } = await supabase.rpc('exec_sql' as any, { sql: createIndex2 });
    if (error4) {
      console.error('Error creating global index:', error4);
      return NextResponse.json(
        { success: false, error: `Failed to create global index: ${error4.message}` },
        { status: 500 }
      );
    }

    console.log('Translations constraint fix completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Translations constraint fix applied successfully',
    });
  } catch (error) {
    console.error('Fix translations constraint error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix translations constraint' },
      { status: 500 }
    );
  }
}
