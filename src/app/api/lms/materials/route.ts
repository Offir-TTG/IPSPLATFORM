import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CourseMaterial, CourseMaterialCreateInput } from '@/types/lms';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// GET /api/lms/materials
// List materials for a course
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'course_id is required' },
        { status: 400 }
      );
    }

    // Get materials
    let query = supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch materials:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as CourseMaterial[],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/lms/materials
// Create a new course material
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body: CourseMaterialCreateInput = await request.json();

    // Validate required fields
    if (!body.course_id || !body.title || !body.file_url || !body.file_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's tenant_id
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not associated with any tenant' },
        { status: 403 }
      );
    }

    // Get next display order if not provided
    let displayOrder = body.display_order ?? 0;
    if (displayOrder === 0) {
      const { data: existingMaterials } = await supabase
        .from('course_materials')
        .select('display_order')
        .eq('course_id', body.course_id)
        .order('display_order', { ascending: false })
        .limit(1);

      if (existingMaterials && existingMaterials.length > 0) {
        displayOrder = existingMaterials[0].display_order + 1;
      }
    }

    // Create material
    const { data, error } = await supabase
      .from('course_materials')
      .insert({
        tenant_id: tenantUser.tenant_id,
        course_id: body.course_id,
        title: body.title,
        description: body.description || null,
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: body.file_type,
        file_size: body.file_size,
        display_order: displayOrder,
        is_published: body.is_published ?? true,
        category: body.category || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Material creation failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'course_materials',
      resource_id: data.id,
      action: 'Created new course material',
      description: `Material: ${body.title}`,
      new_values: data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: data as CourseMaterial,
      message: 'Material uploaded successfully',
    });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
