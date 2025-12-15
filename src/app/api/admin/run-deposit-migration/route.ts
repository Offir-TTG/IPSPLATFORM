import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete existing deposit translations
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .is('tenant_id', null)
      .in('translation_key', [
        'admin.enrollments.paymentPlan.deposit',
        'admin.enrollments.paymentPlan.depositLabel'
      ]);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting old translations:', deleteError);
    }

    // Insert new deposit translations
    const { error: insertError } = await supabase
      .from('translations')
      .insert([
        {
          translation_key: 'admin.enrollments.paymentPlan.deposit',
          language_code: 'en',
          translation_value: 'Deposit + {count} Installments',
          context: 'admin',
          tenant_id: null
        },
        {
          translation_key: 'admin.enrollments.paymentPlan.deposit',
          language_code: 'he',
          translation_value: 'מקדמה + {count} תשלומים',
          context: 'admin',
          tenant_id: null
        },
        {
          translation_key: 'admin.enrollments.paymentPlan.depositLabel',
          language_code: 'en',
          translation_value: 'deposit',
          context: 'admin',
          tenant_id: null
        },
        {
          translation_key: 'admin.enrollments.paymentPlan.depositLabel',
          language_code: 'he',
          translation_value: 'מקדמה',
          context: 'admin',
          tenant_id: null
        }
      ]);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert translations', details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit payment plan translations added successfully'
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
