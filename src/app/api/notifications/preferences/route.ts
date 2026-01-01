import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdatePreferencesRequest } from '@/types/notifications';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 * Creates default preferences if they don't exist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }

    // Get existing preferences
    let { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', userData.tenant_id)
      .maybeSingle();

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          tenant_id: userData.tenant_id,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Notifications API] Error creating default preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create default preferences' },
          { status: 500 }
        );
      }

      preferences = newPrefs;
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Parse request body
    const body: UpdatePreferencesRequest = await request.json();

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', userData.tenant_id)
      .maybeSingle();

    // Build update object (only include fields that were provided)
    const updateData: any = {};

    if (typeof body.email_enabled === 'boolean') {
      updateData.email_enabled = body.email_enabled;
    }
    if (typeof body.sms_enabled === 'boolean') {
      updateData.sms_enabled = body.sms_enabled;
    }
    if (typeof body.push_enabled === 'boolean') {
      updateData.push_enabled = body.push_enabled;
    }
    if (body.category_preferences) {
      // Merge with existing category preferences
      updateData.category_preferences = body.category_preferences;
    }
    if (body.quiet_hours_start !== undefined) {
      updateData.quiet_hours_start = body.quiet_hours_start;
    }
    if (body.quiet_hours_end !== undefined) {
      updateData.quiet_hours_end = body.quiet_hours_end;
    }
    if (body.quiet_hours_timezone) {
      updateData.quiet_hours_timezone = body.quiet_hours_timezone;
    }
    if (typeof body.digest_mode === 'boolean') {
      updateData.digest_mode = body.digest_mode;
    }
    if (body.digest_frequency) {
      updateData.digest_frequency = body.digest_frequency;
    }
    if (body.digest_time) {
      updateData.digest_time = body.digest_time;
    }
    if (body.phone_number !== undefined) {
      updateData.phone_number = body.phone_number;
    }
    if (body.push_subscription !== undefined) {
      updateData.push_subscription = body.push_subscription;
    }

    let preferences;

    if (existing) {
      // Update existing preferences
      const { data, error: updateError } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .eq('tenant_id', userData.tenant_id)
        .select()
        .single();

      if (updateError) {
        console.error('[Notifications API] Error updating preferences:', updateError);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }

      preferences = data;
    } else {
      // Create new preferences with provided data
      const { data, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          tenant_id: userData.tenant_id,
          ...updateData,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Notifications API] Error creating preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      preferences = data;
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
