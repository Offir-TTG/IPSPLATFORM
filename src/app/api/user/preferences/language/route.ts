import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// PATCH /api/user/preferences/language - Update user's preferred language
export const PATCH = withAuth(
  async (request: NextRequest, user: any) => {
    let tenantId: string | undefined;
    try {
      const body = await request.json();
      const { preferred_language } = body;

      const supabase = await createClient();

      // Get tenant_id for audit logging
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      tenantId = tenantUser?.tenant_id;

      // Validate language code against active languages in the database
      if (preferred_language !== null) {
        const { data: language, error: langError } = await supabase
          .from('languages')
          .select('code, is_active')
          .eq('code', preferred_language)
          .single();

        if (langError || !language || !language.is_active) {
          return NextResponse.json(
            { success: false, error: 'Invalid or inactive language code' },
            { status: 400 }
          );
        }
      }

      // Get current language for audit trail
      const { data: currentUser } = await supabase
        .from('users')
        .select('preferred_language')
        .eq('id', user.id)
        .single();

      // Update user's preferred language
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ preferred_language })
        .eq('id', user.id)
        .select('id, preferred_language')
        .single();

      if (updateError) {
        console.error('Language preference update error:', updateError);

        logAuditEvent({
          tenantId,
          userId: user.id,
          userEmail: user.email || 'unknown',
          action: 'preferences.language.update_failed',
          details: {
            resourceType: 'user_preferences',
            resourceId: user.id,
            error: updateError.message,
            attemptedLanguage: preferred_language,
          },
        }).catch((err) => console.error('Audit log failed:', err));

        return NextResponse.json(
          { success: false, error: 'Failed to update language preference' },
          { status: 500 }
        );
      }

      // Log successful update
      logAuditEvent({
        tenantId,
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'preferences.language.updated',
        details: {
          resourceType: 'user_preferences',
          resourceId: user.id,
          previousLanguage: currentUser?.preferred_language || null,
          newLanguage: preferred_language,
        },
      }).catch((err) => console.error('Audit log failed:', err));

      // Set cookie for SSR language detection (prevents flash on page load)
      const response = NextResponse.json({
        success: true,
        data: {
          preferred_language: updatedUser.preferred_language,
        },
        message: 'Language preference updated successfully',
      });

      // Set cookie with 1 year expiry
      response.cookies.set('user_language', preferred_language || 'auto', {
        httpOnly: false, // Needs to be readable by client
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });

      return response;
    } catch (error) {
      console.error('Language preference update error:', error);

      logAuditEvent({
        tenantId,
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'preferences.language.update_error',
        details: {
          resourceType: 'user_preferences',
          resourceId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor', 'admin']
);
