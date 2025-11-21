import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/docusign/templates - List DocuSign templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      // Get DocuSign client from database integration
      const { getDocuSignClient } = await import('@/lib/docusign/client');
      const docusignClient = await getDocuSignClient();
      const templates = await docusignClient.listTemplates();

      return NextResponse.json({
        success: true,
        templates: templates
      });
    } catch (docusignError) {
      console.error('DocuSign error:', docusignError);
      return NextResponse.json({
        success: true,
        templates: [],
        message: docusignError instanceof Error ? docusignError.message : 'Failed to fetch templates from DocuSign'
      });
    }

  } catch (error) {
    console.error('Error in GET /api/admin/docusign/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
