import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all languages
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: languages, error } = await supabase
      .from('languages')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get languages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

// POST - Create new language
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { code, name, native_name, direction, is_active, is_default } = await request.json();

    if (!code || !name || !native_name || !direction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('languages')
        .update({ is_default: false })
        .neq('code', code);
    }

    const { data: language, error } = await supabase
      .from('languages')
      .insert({
        code,
        name,
        native_name,
        direction,
        is_active: is_active ?? true,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Language created successfully',
    });
  } catch (error) {
    console.error('Create language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create language' },
      { status: 500 }
    );
  }
}

// PUT - Update language
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { code, name, native_name, direction, is_active, is_default } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Language code is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('languages')
        .update({ is_default: false })
        .neq('code', code);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (native_name) updateData.native_name = native_name;
    if (direction) updateData.direction = direction;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data: language, error } = await supabase
      .from('languages')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Language updated successfully',
    });
  } catch (error) {
    console.error('Update language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update language' },
      { status: 500 }
    );
  }
}

// DELETE - Delete language
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Language code is required' },
        { status: 400 }
      );
    }

    // Check if it's the default language
    const { data: language } = await supabase
      .from('languages')
      .select('is_default')
      .eq('code', code)
      .single();

    if (language?.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default language' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('languages')
      .delete()
      .eq('code', code);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Language deleted successfully',
    });
  } catch (error) {
    console.error('Delete language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete language' },
      { status: 500 }
    );
  }
}
