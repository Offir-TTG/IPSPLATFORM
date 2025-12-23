import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { renderEmailTemplate } from '@/lib/email/renderTemplate';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

// POST /api/admin/tenant/users/[id]/reset-password - Trigger password reset email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const emailLanguage = body.emailLanguage || 'en'; // Get language from request body
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (tenantUserError) {
      console.error('Error fetching tenant user:', tenantUserError);
    }

    if (!tenantUser) {
      console.error('No tenant user found for user:', user.id, 'tenant:', tenant.id);
      return NextResponse.json({ success: false, error: 'Forbidden: User not found in tenant' }, { status: 403 });
    }

    if (!['owner', 'admin'].includes(tenantUser.role)) {
      console.error('User role insufficient:', tenantUser.role);
      return NextResponse.json({ success: false, error: `Forbidden: Insufficient role (${tenantUser.role})` }, { status: 403 });
    }

    // Get admin user details separately
    const { data: adminUserData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    // Verify target user belongs to this tenant
    const { data: targetTenantUser, error: userError } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    if (userError || !targetTenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Get target user details separately
    const { data: targetUserData, error: targetUserError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', id)
      .single();

    if (targetUserError) {
      console.error('Error fetching target user details:', targetUserError);
      console.error('Target user ID:', id);
    }

    if (!targetUserData) {
      console.error('No target user data found for ID:', id);
      return NextResponse.json(
        { success: false, error: 'User details not found' },
        { status: 404 }
      );
    }

    const targetEmail = targetUserData.email;
    const targetFirstName = targetUserData.first_name;

    // Create admin client with service role to generate password reset link WITHOUT sending email
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate password reset link without sending email
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;
    console.log('Redirect URL will be:', redirectUrl);

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (resetError || !resetData) {
      console.error('Error generating password reset link:', resetError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    const resetUrl = resetData.properties.action_link;
    console.log('✅ Generated password reset link (no email sent by Supabase)');
    console.log('Reset URL:', resetUrl);

    // Render custom email template in admin-selected language
    const adminName = adminUserData
      ? `${adminUserData.first_name} ${adminUserData.last_name}`
      : 'Admin';

    console.log(`📧 Rendering email template in ${emailLanguage} for ${targetEmail}`);

    const renderedEmail = await renderEmailTemplate({
      templateKey: 'system.password_reset',
      tenantId: tenant.id,
      languageCode: emailLanguage === 'he' ? 'he' : 'en',
      variables: {
        userName: targetFirstName,
        resetUrl: resetUrl, // Use the actual generated reset link with token
        expiresIn: '24',
        organizationName: tenant.name || 'IPS Platform',
        adminName: adminName,
      },
    });

    // If custom template rendering failed, return error (no email sent)
    if (!renderedEmail) {
      console.error('Custom email template rendering failed');
      return NextResponse.json({
        success: false,
        error: 'Failed to render email template',
      }, { status: 500 });
    }

    // Send custom email using our email service
    console.log('📮 Sending custom email to:', targetEmail);
    console.log('Subject:', renderedEmail.subject);

    const emailResult = await sendEmail({
      to: targetEmail,
      subject: renderedEmail.subject,
      html: renderedEmail.bodyHtml,
      text: renderedEmail.bodyText,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send custom email:', emailResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email',
      }, { status: 500 });
    }

    console.log('✅ Custom email sent successfully!');

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'PASSWORD_RESET',
      event_category: 'USER_MANAGEMENT',
      resource_type: 'users',
      resource_id: id,
      action: 'Triggered password reset',
      description: `Password reset email sent to ${targetEmail}`,
      risk_level: 'medium',
      metadata: {
        target_user_email: targetEmail,
        email_template: 'system.password_reset',
        language: emailLanguage,
        custom_email_sent: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while sending password reset email' },
      { status: 500 }
    );
  }
}
