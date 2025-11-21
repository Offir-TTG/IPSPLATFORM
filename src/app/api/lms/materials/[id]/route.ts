import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CourseMaterial, CourseMaterialUpdateInput } from '@/types/lms';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// GET /api/lms/materials/[id]
// Get a single material by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as CourseMaterial,
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/materials/[id]
// Update a material
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get old values for audit
    const { data: oldMaterial } = await supabase
      .from('course_materials')
      .select('*')
      .eq('id', params.id)
      .single();

    // Get request body
    const body: CourseMaterialUpdateInput = await request.json();

    // Update material
    const { data, error } = await supabase
      .from('course_materials')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Material update failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'course_materials',
      resource_id: params.id,
      action: 'Updated course material',
      description: `Material: ${data.title}`,
      old_values: oldMaterial,
      new_values: data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: data as CourseMaterial,
      message: 'Material updated successfully',
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/lms/materials/[id]
// Delete a material
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get material details for audit and file cleanup
    const { data: material } = await supabase
      .from('course_materials')
      .select('*')
      .eq('id', params.id)
      .single();

    // Delete material from database
    const { error } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Material deletion failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    if (material) {
      await supabase.from('audit_events').insert({
        user_id: user.id,
        event_type: 'DELETE',
        event_category: 'EDUCATION',
        resource_type: 'course_materials',
        resource_id: params.id,
        action: 'Deleted course material',
        description: `Material: ${material.title}`,
        old_values: material,
        risk_level: 'medium',
      });
    }

    // Note: File deletion from storage should be handled separately
    // to avoid data loss if database deletion succeeds but storage deletion fails

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
