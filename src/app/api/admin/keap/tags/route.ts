import { NextRequest, NextResponse } from 'next/server';
import { getKeapClient } from '@/lib/keap/client';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/keap/tags - List all tags
export async function GET() {
  try {
    const keap = await getKeapClient();
    const tags = await keap.listTags();

    return NextResponse.json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    console.error('Error fetching Keap tags:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/keap/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, categoryId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();
    const tag = await keap.createTag(name, description, categoryId);

    // Log audit event for tag creation
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const adminSupabase = createAdminClient();

        // Get user's tenant_id
        const { data: userData } = await adminSupabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        await adminSupabase.from('audit_events').insert({
          user_id: user.id,
          user_email: user.email || 'unknown',
          tenant_id: userData?.tenant_id || null,
          event_type: 'CREATE',
          event_category: 'SYSTEM',
          resource_type: 'keap_sync',
          action: 'audit.keap.create_tag',
          description: 'audit.keap.create_tag_desc',
          new_values: {
            tag_name: name,
            tag_id: tag.id,
            description: description || null,
            category_id: categoryId || null,
            name: name  // For translation placeholder
          },
          status: 'success',
          risk_level: 'low',
        });
      }
    } catch (auditError) {
      console.error('Failed to log tag creation audit event:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: tag,
      message: `Tag "${name}" created successfully`
    });
  } catch (error) {
    console.error('Error creating Keap tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag'
      },
      { status: 500 }
    );
  }
}
